"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Zap, AlertCircle, Wrench, Mail } from "lucide-react";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type AgentData = {
  executionId: string;
  response: string;
  toolsUsed: string[];
  status: "SUCCESS" | "FAILED";
};

type Message = {
  id: string;
  role: Role;
  content: string;
  agentData?: AgentData;
};

type ApiResponse =
  | { success: true; data: AgentData }
  | { success: false; error: string; code: string };

// ─── Suggested prompts ─────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  "Summarize today's important emails",
  "Show my finance emails from this week",
  "Draft a reply to my latest email",
  "What meetings do I have today?",
  "Find emails about project deadlines",
  "Schedule a meeting for tomorrow afternoon",
];

// ─── Message bubble ────────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-end gap-2 max-w-[75%]">
        <div className="rounded-2xl rounded-br-sm bg-[#BE5103] px-4 py-3 text-sm text-white leading-relaxed">
          {content}
        </div>
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F8F2EA] border border-[#E7D8C8]">
          <User className="h-3.5 w-3.5 text-[#544823]" />
        </div>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEF0E7] border border-[#E7D8C8]">
          <Bot className="h-3.5 w-3.5 text-[#BE5103]" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-2xl rounded-bl-sm border border-[#E7D8C8] bg-white px-4 py-3 text-sm text-[#332216] leading-relaxed">
            <p className="whitespace-pre-wrap">{message.content}</p>

            {message.agentData && message.agentData.toolsUsed.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#E7D8C8] pt-3">
                <Wrench className="h-3 w-3 text-[#8C4C1F]" />
                <span className="text-[11px] text-[#8C4C1F]">Used:</span>
                {message.agentData.toolsUsed.map((tool, i) => (
                  <span
                    key={`${tool}-${i}`}
                    className="rounded-full border border-[#E7D8C8] bg-[#F8F2EA] px-2 py-0.5 text-[11px] font-medium text-[#544823]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            )}
          </div>

          {message.agentData && (
            <div className="flex items-center gap-1.5 px-1">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  message.agentData.status === "SUCCESS" ? "bg-emerald-500" : "bg-red-400"
                }`}
              />
              <span className="text-[11px] text-[#8C4C1F]">
                {message.agentData.status === "SUCCESS" ? "Completed" : "Failed"} ·{" "}
                <span className="font-mono">{message.agentData.executionId.slice(0, 8)}</span>
              </span>
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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FEF0E7] border border-[#E7D8C8]">
          <Bot className="h-3.5 w-3.5 text-[#BE5103]" />
        </div>
        <div className="rounded-2xl rounded-bl-sm border border-[#E7D8C8] bg-white px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#BE5103]" />
            <span className="text-sm text-[#8C4C1F]">Thinking…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF0E7] border border-[#E7D8C8]">
        <Zap className="h-8 w-8 text-[#BE5103]" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#332216]">How can I help you?</h2>
        <p className="mt-1 text-sm text-[#544823]">
          Ask me about your emails, calendar, or let me take action for you.
        </p>
      </div>
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="rounded-xl border border-[#E7D8C8] bg-white px-4 py-3 text-left text-sm text-[#544823] transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7] hover:text-[#332216]"
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
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => { if (j.success) setGmailConnected(j.data.gmailConnected); })
      .catch(() => setGmailConnected(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (gmailConnected === false) {
    return (
      <OnboardingEmptyState
        icon={<Mail className="h-7 w-7 text-[#BE5103]" />}
        title="Gmail access required"
        description="SuperAlien's AI agent requires Gmail access before workflows can run. Connect Gmail to continue."
        action={{ label: "Connect Gmail", href: "/onboarding" }}
      />
    );
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });
      const json: ApiResponse = await res.json();

      if (!json.success) { setError(json.error); return; }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: json.data.response,
        agentData: json.data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
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
    <div className="flex h-[calc(100vh-57px)] flex-col bg-[#FFFDF8]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#E7D8C8] bg-white px-6 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FEF0E7] border border-[#E7D8C8]">
          <Bot className="h-4 w-4 text-[#BE5103]" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-[#332216]">AI Agent</h1>
          <p className="text-[11px] text-[#8C4C1F]">Powered by AI · Reads your Gmail & Calendar</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onPrompt={(p) => { setInput(p); sendMessage(p); }} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-5 px-6 py-6">
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
        <div className="mx-auto w-full max-w-3xl px-6 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-[#E7D8C8] bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-2xl border border-[#E7D8C8] bg-[#F8F2EA] px-4 py-3 focus-within:border-[#BE5103]/50 focus-within:ring-2 focus-within:ring-[#BE5103]/10 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your emails, calendar, or request an action…"
              disabled={loading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[#332216] placeholder:text-[#8C4C1F] outline-none disabled:opacity-60"
              style={{ maxHeight: "160px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#BE5103] text-white transition-colors hover:bg-[#8C4C1F] disabled:opacity-40"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-[#8C4C1F]">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
