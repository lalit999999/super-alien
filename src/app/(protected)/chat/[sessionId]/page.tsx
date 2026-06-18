"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Send, Bot, User, Loader2, AlertCircle, Wrench, Trash2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = "USER" | "ASSISTANT";

type StoredMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: string;
};

type SendResult = {
  userMessage: StoredMessage;
  assistantMessage: StoredMessage & { toolsUsed?: string[] };
  toolsUsed: string[];
};

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

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

function AssistantBubble({ content, toolsUsed }: { content: string; toolsUsed?: string[] }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[80%]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ps-accent-light border border-ps-border">
          <Bot className="h-3.5 w-3.5 text-ps-accent" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl rounded-bl-sm border border-ps-border bg-ps-card px-4 py-3 text-sm text-ps-text leading-relaxed">
            <p className="whitespace-pre-wrap">{content}</p>
            {toolsUsed && toolsUsed.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-ps-border pt-3">
                <Wrench className="h-3 w-3 text-ps-muted" />
                <span className="text-[11px] text-ps-muted">Used:</span>
                {toolsUsed.map((tool, i) => (
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [toolsMap, setToolsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/chat/session/${sessionId}`)
      .then((r) => r.json())
      .then((j: ApiResponse<{ messages?: StoredMessage[] }>) => {
        if (j.success && j.data.messages) {
          setMessages(j.data.messages);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || sending) return;

    const optimisticUser: StoredMessage = {
      id: `opt-${Date.now()}`,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setError(null);
    setErrorCode(null);
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/chat/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const json: ApiResponse<SendResult> = await res.json();

      if (!json.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        setError(json.error);
        setErrorCode(json.code);
        return;
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        json.data.userMessage,
        json.data.assistantMessage,
      ]);

      if (json.data.toolsUsed.length > 0) {
        setToolsMap((prev) => ({
          ...prev,
          [json.data.assistantMessage.id]: json.data.toolsUsed,
        }));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this conversation?")) return;
    await fetch(`/api/chat/session/${sessionId}`, { method: "DELETE" });
    router.push("/chat");
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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center bg-ps-bg">
        <Loader2 className="h-6 w-6 animate-spin text-ps-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-ps-bg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ps-border bg-ps-card px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ps-accent-light border border-ps-border">
            <Bot className="h-4 w-4 text-ps-accent" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ps-text">SuperAlien</h1>
            <p className="text-[11px] text-ps-muted">AI assistant · Gmail & Calendar</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-ps-muted transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          title="Delete conversation"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          {messages.map((msg) =>
            msg.role === "USER" ? (
              <UserBubble key={msg.id} content={msg.content} />
            ) : (
              <AssistantBubble
                key={msg.id}
                content={msg.content}
                toolsUsed={toolsMap[msg.id]}
              />
            )
          )}
          {sending && <ThinkingBubble />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Error */}
      {error && errorCode === "RATE_LIMIT_EXCEEDED" && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">
          <div className="flex flex-col gap-2 rounded-lg border border-ps-accent/30 bg-ps-accent-light px-4 py-3 text-xs text-ps-text sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-ps-accent" />
              <span>You've hit your daily limit on the Free plan. Upgrade to Pro for 5,000 messages a day.</span>
            </div>
            <Link
              href="/billing/upgrade"
              className="shrink-0 rounded-lg bg-ps-accent px-3 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-ps-accent-dark"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
      {error && errorCode !== "RATE_LIMIT_EXCEEDED" && (
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
              placeholder="Continue the conversation…"
              disabled={sending}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-ps-text placeholder:text-ps-muted outline-none disabled:opacity-60"
              style={{ maxHeight: "160px" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ps-accent text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-40"
            >
              {sending ? (
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
  );
}
