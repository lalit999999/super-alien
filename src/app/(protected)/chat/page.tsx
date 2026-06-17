"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Bot,
  User,
  Loader2,
  Zap,
  AlertCircle,
  Wrench,
  Mail,
  MessageSquarePlus,
  Trash2,
  ChevronRight,
  PanelLeft,
} from "lucide-react";

import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { MarkdownRenderer } from "@/components/renderers/markdown-renderer";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  toolsUsed?: string[];
};

type ChatSession = {
  id: string;
  title: string;
  lastMessageAt: string;
};

type SessionGroup = {
  label: string;
  sessions: ChatSession[];
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Summarize today's important emails",
  "Show my finance emails from this week",
  "Draft a reply to my latest email",
  "What meetings do I have today?",
  "Find emails about project deadlines",
  "Schedule a meeting for tomorrow afternoon",
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  groups,
  currentSessionId,
  onNewChat,
  onDeleteSession,
}: {
  groups: SessionGroup[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-ps-border bg-ps-card">
      <div className="flex items-center justify-between border-b border-ps-border px-4 py-3.5">
        <span className="text-sm font-semibold text-ps-text">Conversations</span>
        <button
          onClick={onNewChat}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-ps-muted transition-colors hover:bg-ps-surface hover:text-ps-text"
          title="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {groups.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-ps-muted">No conversations yet</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-wider text-ps-muted">
                {group.label}
              </p>
              {group.sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-ps-surface ${
                    currentSessionId === session.id ? "bg-ps-accent-light" : ""
                  }`}
                  onClick={() => router.push(`/chat/${session.id}`)}
                >
                  <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 text-ps-muted" />
                  <span className="flex-1 truncate text-xs text-ps-secondary group-hover:text-ps-text">
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                    className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-ps-muted opacity-0 transition-all group-hover:flex group-hover:opacity-100 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Message bubbles ───────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
        <div className="rounded-2xl rounded-br-sm bg-ps-accent px-4 py-3 text-sm text-white leading-relaxed">
          {content}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ps-surface border border-ps-border">
          <User className="h-3.5 w-3.5 text-ps-secondary" />
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[80%]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ps-accent-light border border-ps-border">
          <Bot className="h-3.5 w-3.5 text-ps-accent" />
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-ps-border bg-ps-card px-4 py-3 text-sm text-ps-text leading-relaxed">
          <MarkdownRenderer content={message.content} />
          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ps-border pt-3">
              <Wrench className="h-3 w-3 text-ps-muted" />
              <span className="text-[11px] text-ps-muted">Used:</span>
              {message.toolsUsed.map((tool, i) => (
                <span
                  key={`${tool}-${i}`}
                  className="rounded-full border border-ps-border bg-ps-surface px-2 py-0.5 text-[11px] font-medium text-ps-secondary"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ps-accent-light border border-ps-border">
          <Bot className="h-3.5 w-3.5 text-ps-accent" />
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-ps-border bg-ps-card px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-ps-accent" />
            <span className="text-sm text-ps-muted">Thinking…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 py-10 sm:gap-6 sm:px-6 sm:py-12">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ps-accent-light border border-ps-border sm:h-16 sm:w-16">
        <Zap className="h-7 w-7 text-ps-accent sm:h-8 sm:w-8" />
      </div>
      <div className="text-center">
        <h2 className="text-base font-semibold text-ps-text sm:text-lg">How can I help you?</h2>
        <p className="mt-1 text-sm text-ps-secondary">
          Ask me about your emails, calendar, or let me take action for you.
        </p>
      </div>
      <div className="grid w-full max-w-lg gap-2 grid-cols-1 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="rounded-xl border border-ps-border bg-ps-card px-4 py-3 text-left text-sm text-ps-secondary transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light hover:text-ps-text"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [groups, setGroups] = useState<SessionGroup[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/chat/sessions").catch(() => null);
    if (!res) return;
    const json: ApiResponse<{ groups: SessionGroup[] }> = await res.json();
    if (json.success) setGroups(json.data.groups);
  }, []);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => { if (j.success) setGmailConnected(j.data.gmailConnected); })
      .catch(() => setGmailConnected(true));
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (gmailConnected === false) {
    return (
      <OnboardingEmptyState
        icon={<Mail className="h-7 w-7 text-ps-accent" />}
        title="Gmail access required"
        description="SuperAlien's AI agent requires Gmail access before workflows can run. Connect Gmail to continue."
        action={{ label: "Connect Gmail", href: "/onboarding" }}
      />
    );
  }

  async function createAndSendInNewSession(prompt: string) {
    // Create session
    const createRes = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: prompt.slice(0, 80) }),
    });
    const createJson: ApiResponse<{ id: string }> = await createRes.json();
    if (!createJson.success) {
      setError(createJson.error);
      return;
    }
    const newSessionId = createJson.data.id;
    setActiveSessionId(newSessionId);

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: prompt };
    setMessages([userMsg]);
    setInput("");
    setError(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/chat/session/${newSessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json: ApiResponse<{ assistantMessage: { content: string }; toolsUsed: string[] }> = await res.json();

      if (!json.success) { setError(json.error); return; }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: json.data.assistantMessage.content,
          toolsUsed: json.data.toolsUsed,
        },
      ]);

      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    if (!activeSessionId) {
      await createAndSendInNewSession(content);
      return;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/chat/session/${activeSessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const json: ApiResponse<{ assistantMessage: { content: string }; toolsUsed: string[] }> = await res.json();

      if (!json.success) { setError(json.error); return; }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: json.data.assistantMessage.content,
          toolsUsed: json.data.toolsUsed,
        },
      ]);

      await loadSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleNewChat() {
    setActiveSessionId(null);
    setMessages([]);
    setError(null);
    setInput("");
  }

  async function handleDeleteSession(id: string) {
    await fetch(`/api/chat/session/${id}`, { method: "DELETE" });
    if (activeSessionId === id) {
      handleNewChat();
    }
    await loadSessions();
  }

  async function handleSelectSession(id: string) {
    router.push(`/chat/${id}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden bg-ps-bg">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          groups={groups}
          currentSessionId={activeSessionId}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
        />
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-ps-border bg-ps-card px-4 py-3.5 sm:px-6">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ps-muted transition-colors hover:bg-ps-surface hover:text-ps-text"
          >
            {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ps-accent-light border border-ps-border">
            <Bot className="h-4 w-4 text-ps-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ps-text">SuperAlien</h1>
            <p className="text-[11px] text-ps-muted">AI assistant · Gmail & Calendar</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <EmptyState onPrompt={(p) => sendMessage(p)} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <UserBubble key={msg.id} content={msg.content} />
                ) : (
                  <AssistantBubble key={msg.id} message={msg} />
                )
              )}
              {loading && <ThinkingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-ps-border bg-ps-card px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-ps-border bg-ps-surface px-4 py-3 focus-within:border-ps-accent/50 focus-within:ring-2 focus-within:ring-ps-accent/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your emails, calendar, or request an action…"
                disabled={loading}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-ps-text placeholder:text-ps-muted outline-none disabled:opacity-60"
                style={{ maxHeight: "160px" }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ps-accent text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-ps-muted">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
