import type { AgentService } from "@/modules/agent";
import type { ChatHistoryMessage } from "@/modules/agent";
import type { CacheService } from "@/modules/cache";
import { buildChatMessagesKey, CACHE_TTL } from "@/modules/cache";
import type { ChatRepository } from "./chat.repository";
import type { ChatSession, ChatMessage, ChatSessionGroup } from "./chat.types";
import { CHAT_DEFAULT_TITLE, CHAT_TITLE_MAX_LENGTH, CHAT_SESSION_GROUPS } from "./chat.constants";

function log(msg: string, meta?: Record<string, unknown>) {
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`${new Date().toISOString()} [CHAT] ${msg}${metaStr}`);
}

function deriveTitleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  return clean.length <= CHAT_TITLE_MAX_LENGTH
    ? clean
    : clean.slice(0, CHAT_TITLE_MAX_LENGTH - 1) + "…";
}

function groupSessionsByDate(sessions: ChatSession[]): ChatSessionGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const last7 = new Date(today.getTime() - 7 * 86400000);
  const last30 = new Date(today.getTime() - 30 * 86400000);

  const groups: Record<string, ChatSession[]> = {
    [CHAT_SESSION_GROUPS.TODAY]: [],
    [CHAT_SESSION_GROUPS.YESTERDAY]: [],
    [CHAT_SESSION_GROUPS.LAST_7_DAYS]: [],
    [CHAT_SESSION_GROUPS.LAST_30_DAYS]: [],
  };

  for (const s of sessions) {
    const d = new Date(s.lastMessageAt);
    if (d >= today) {
      groups[CHAT_SESSION_GROUPS.TODAY].push(s);
    } else if (d >= yesterday) {
      groups[CHAT_SESSION_GROUPS.YESTERDAY].push(s);
    } else if (d >= last7) {
      groups[CHAT_SESSION_GROUPS.LAST_7_DAYS].push(s);
    } else if (d >= last30) {
      groups[CHAT_SESSION_GROUPS.LAST_30_DAYS].push(s);
    }
  }

  return Object.entries(groups)
    .filter(([, sessions]) => sessions.length > 0)
    .map(([label, sessions]) => ({ label, sessions }));
}

export class ChatService {
  constructor(
    private readonly repo: ChatRepository,
    private readonly agent: AgentService,
    private readonly cache?: CacheService
  ) {}

  async createSession(userId: string, title?: string): Promise<ChatSession> {
    const t = title?.trim() || CHAT_DEFAULT_TITLE;
    log("Creating session", { userId, title: t });
    return this.repo.createSession(userId, t);
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    return this.repo.getSession(sessionId, userId);
  }

  async listSessions(userId: string): Promise<{ sessions: ChatSession[]; groups: ChatSessionGroup[] }> {
    const sessions = await this.repo.listSessions(userId);
    return { sessions, groups: groupSessionsByDate(sessions) };
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    log("Deleting session", { sessionId, userId });
    await this.repo.deleteSession(sessionId, userId);
    await this.invalidateChatCache(sessionId);
  }

  async sendMessage(
    sessionId: string,
    clerkUserId: string,
    dbUserId: string,
    prompt: string
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage; toolsUsed: string[] }> {
    const session = await this.repo.getSession(sessionId, dbUserId);
    if (!session) throw new Error("Session not found");

    if (session.title === CHAT_DEFAULT_TITLE || !session.title) {
      await this.repo.updateTitle(sessionId, dbUserId, deriveTitleFromPrompt(prompt));
    }

    const userMessage = await this.repo.addMessage(sessionId, "USER", prompt);
    log("User message saved", { sessionId });

    // Load history and persisted context in parallel
    const [history, activeContext] = await Promise.all([
      this.getChatHistory(sessionId),
      this.repo.getActiveContext(sessionId, dbUserId),
    ]);

    const agentResult = await this.agent.chat({
      userId: clerkUserId,
      prompt,
      history,
      sessionId,
      activeContext: activeContext ?? undefined,
    });

    // Persist updated context returned by the agent
    if (agentResult.updatedContext) {
      await this.repo.updateActiveContext(sessionId, agentResult.updatedContext);
    }

    const assistantMessage = await this.repo.addMessage(sessionId, "ASSISTANT", agentResult.response);
    log("Assistant message saved", { sessionId, toolsUsed: agentResult.toolsUsed });

    // Invalidate cache so next read gets fresh messages
    await this.invalidateChatCache(sessionId);

    return { userMessage, assistantMessage, toolsUsed: agentResult.toolsUsed };
  }

  private async getChatHistory(sessionId: string): Promise<ChatHistoryMessage[]> {
    if (this.cache) {
      const key = buildChatMessagesKey(sessionId);
      const cached = await this.cache.get<ChatHistoryMessage[]>(key);
      if (cached.hit && cached.data) {
        log("Chat history cache-hit", { sessionId });
        return cached.data;
      }

      const messages = (await this.repo.getRecentMessages(sessionId)) ?? [];
      const history: ChatHistoryMessage[] = messages.map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      }));

      await this.cache.set(key, history, { ttl: CACHE_TTL.CHAT_MESSAGES });
      log("Chat history cache-miss — populated", { sessionId });
      return history;
    }

    const messages = (await this.repo.getRecentMessages(sessionId)) ?? [];
    return messages.map((m) => ({
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
    }));
  }

  private async invalidateChatCache(sessionId: string): Promise<void> {
    if (!this.cache) return;
    const key = buildChatMessagesKey(sessionId);
    await this.cache.del(key).catch(() => undefined);
  }
}
