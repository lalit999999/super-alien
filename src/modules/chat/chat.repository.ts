import type { PrismaClient } from "@/config/generated/prisma/client";
import type { ChatSession, ChatMessage, MessageRoleValue } from "./chat.types";
import { CHAT_HISTORY_LIMIT } from "./chat.constants";

export class ChatRepository {
  constructor(private readonly db: PrismaClient) {}

  async createSession(userId: string, title: string): Promise<ChatSession> {
    return this.db.chatSession.create({
      data: { user: { connect: { id: userId } }, title },
    }) as Promise<ChatSession>;
  }

  async getSession(sessionId: string, userId: string): Promise<ChatSession | null> {
    return this.db.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: CHAT_HISTORY_LIMIT,
        },
      },
    }) as Promise<ChatSession | null>;
  }

  async listSessions(userId: string): Promise<ChatSession[]> {
    return this.db.chatSession.findMany({
      where: { userId },
      orderBy: { lastMessageAt: "desc" },
    }) as Promise<ChatSession[]>;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.db.chatSession.deleteMany({ where: { id: sessionId, userId } });
  }

  async addMessage(
    sessionId: string,
    role: MessageRoleValue,
    content: string
  ): Promise<ChatMessage> {
    const [message] = await this.db.$transaction([
      this.db.chatMessage.create({
        data: { session: { connect: { id: sessionId } }, role, content },
      }),
      this.db.chatSession.update({
        where: { id: sessionId },
        data: { lastMessageAt: new Date() },
      }),
    ]);
    return message as ChatMessage;
  }

  async getRecentMessages(sessionId: string): Promise<ChatMessage[]> {
    return this.db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: CHAT_HISTORY_LIMIT,
    }).then((msgs) => msgs.reverse()) as Promise<ChatMessage[]>;
  }

  async updateTitle(sessionId: string, userId: string, title: string): Promise<void> {
    await this.db.chatSession.updateMany({
      where: { id: sessionId, userId },
      data: { title },
    });
  }
}
