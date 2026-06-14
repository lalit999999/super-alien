"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const json: ApiResponse = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

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

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4 gap-4">
      <h1 className="text-xl font-semibold">Agent Chat (Test)</h1>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-sm text-center mt-8">
            Send a message to start testing the agent.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "user" ? (
              <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[75%] text-sm">
                {msg.content}
              </div>
            ) : (
              <Card className="max-w-[85%]">
                <CardContent className="p-4 flex flex-col gap-2">
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                  {msg.agentData && msg.agentData.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t">
                      <span className="text-xs text-muted-foreground">Tools: </span>
                      {msg.agentData.toolsUsed.map((tool) => (
                        <span
                          key={tool}
                          className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.agentData && (
                    <div className="flex gap-2 items-center pt-1 text-xs text-muted-foreground">
                      <span
                        className={
                          msg.agentData.status === "SUCCESS"
                            ? "text-green-600"
                            : "text-red-500"
                        }
                      >
                        {msg.agentData.status}
                      </span>
                      <span className="font-mono">{msg.agentData.executionId.slice(0, 8)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="text-muted-foreground text-sm px-2 py-1">Thinking...</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          disabled={loading}
          rows={2}
          className="resize-none"
        />
        <Button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
