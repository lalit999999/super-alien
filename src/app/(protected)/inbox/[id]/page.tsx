"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  Reply,
  Loader2,
  CheckCircle,
  AlertCircle,
  Tag,
  Zap,
  X,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Email = {
  id: string;
  subject: string;
  sender: string;
  snippet: string | null;
  body: string | null;
  receivedAt: string;
  isRead: boolean;
};

type EmailApiResponse =
  | { success: true; data: { email: Email } }
  | { success: false; error: string; code: string };

type SummarizeResponse =
  | { success: true; data: { summary: string } }
  | { success: false; error: string; code: string };

type DraftResponse =
  | { success: true; data: { draft: string } }
  | { success: false; error: string; code: string };

type ClassifyResponse =
  | { success: true; data: { category: string; priority: string } }
  | { success: false; error: string; code: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractName(sender: string): string {
  const match = sender.match(/^([^<]+)</);
  return match ? match[1].trim() : sender.split("@")[0];
}

function extractEmail(sender: string): string {
  const match = sender.match(/<([^>]+)>/);
  return match ? match[1] : sender;
}

function getInitials(sender: string): string {
  const name = extractName(sender);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["bg-ps-accent", "bg-ps-accent-dark", "bg-ps-secondary", "bg-ps-text"];

function SenderAvatar({ sender, size = "md" }: { sender: string; size?: "sm" | "md" }) {
  const initials = getInitials(sender);
  const color = AVATAR_COLORS[sender.charCodeAt(0) % AVATAR_COLORS.length];
  const cls = size === "sm" ? "h-8 w-8 text-[11px]" : "h-10 w-10 text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${cls} ${color}`}>
      {initials}
    </div>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────

function AIPanel({ emailId, onClose }: { emailId: string; onClose?: () => void }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [classification, setClassification] = useState<{ category: string; priority: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [loadingClassify, setLoadingClassify] = useState(false);
  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorDraft, setErrorDraft] = useState<string | null>(null);

  async function handleSummarize() {
    setLoadingSummary(true);
    setErrorSummary(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json: SummarizeResponse = await res.json();
      if (!json.success) { setErrorSummary(json.error); return; }
      setSummary(json.data.summary);
    } catch {
      setErrorSummary("Failed to generate summary.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function handleDraft() {
    setLoadingDraft(true);
    setErrorDraft(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json: DraftResponse = await res.json();
      if (!json.success) { setErrorDraft(json.error); return; }
      setDraft(json.data.draft);
    } catch {
      setErrorDraft("Failed to generate draft.");
    } finally {
      setLoadingDraft(false);
    }
  }

  async function handleClassify() {
    setLoadingClassify(true);
    try {
      const res = await fetch("/api/ai/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json: ClassifyResponse = await res.json();
      if (json.success) setClassification(json.data);
    } finally {
      setLoadingClassify(false);
    }
  }

  const priorityColors: Record<string, string> = {
    URGENT: "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    IMPORTANT: "bg-ps-accent-light text-ps-accent border-ps-border",
    NORMAL: "bg-ps-surface text-ps-secondary border-ps-border",
    LOW: "bg-ps-surface-2 text-ps-muted border-ps-border",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Panel header with close button (mobile) */}
      {onClose && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-ps-accent" />
            <span className="text-sm font-semibold text-ps-text">AI Tools</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ps-muted transition-colors hover:bg-ps-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* AI Actions */}
      <div className="rounded-2xl border border-ps-border bg-ps-bg p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ps-muted">
          AI Actions
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="flex items-center gap-2.5 rounded-xl border border-ps-border bg-ps-card px-4 py-3 text-left text-sm font-medium text-ps-text transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light disabled:opacity-60"
          >
            {loadingSummary ? (
              <Loader2 className="h-4 w-4 animate-spin text-ps-accent" />
            ) : (
              <Sparkles className="h-4 w-4 text-ps-accent" />
            )}
            {loadingSummary ? "Summarizing…" : "Summarize email"}
          </button>

          <button
            onClick={handleDraft}
            disabled={loadingDraft}
            className="flex items-center gap-2.5 rounded-xl border border-ps-border bg-ps-card px-4 py-3 text-left text-sm font-medium text-ps-text transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light disabled:opacity-60"
          >
            {loadingDraft ? (
              <Loader2 className="h-4 w-4 animate-spin text-ps-accent" />
            ) : (
              <FileText className="h-4 w-4 text-ps-accent" />
            )}
            {loadingDraft ? "Drafting…" : "Generate draft reply"}
          </button>

          <button
            onClick={handleClassify}
            disabled={loadingClassify}
            className="flex items-center gap-2.5 rounded-xl border border-ps-border bg-ps-card px-4 py-3 text-left text-sm font-medium text-ps-text transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light disabled:opacity-60"
          >
            {loadingClassify ? (
              <Loader2 className="h-4 w-4 animate-spin text-ps-accent" />
            ) : (
              <Tag className="h-4 w-4 text-ps-accent" />
            )}
            {loadingClassify ? "Classifying…" : "Classify email"}
          </button>
        </div>
      </div>

      {/* Classification result */}
      {classification && (
        <div className="rounded-2xl border border-ps-border bg-ps-card p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-ps-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ps-muted">
              Classification
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-ps-accent-light px-3 py-1 text-xs font-medium text-ps-accent border-ps-border">
              {classification.category}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityColors[classification.priority] ?? "bg-ps-surface text-ps-muted border-ps-border"}`}>
              {classification.priority}
            </span>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {(summary || errorSummary) && (
        <div className="rounded-2xl border border-ps-border bg-ps-accent-light p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-ps-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ps-accent">
              AI Summary
            </h3>
          </div>
          {errorSummary ? (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> {errorSummary}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-ps-text">{summary}</p>
          )}
        </div>
      )}

      {/* Draft reply */}
      {(draft || errorDraft) && (
        <div className="rounded-2xl border border-ps-border bg-ps-card p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Reply className="h-4 w-4 text-ps-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ps-muted">
              Generated Draft
            </h3>
          </div>
          {errorDraft ? (
            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5" /> {errorDraft}
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ps-text">{draft}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(draft ?? "")}
                className="mt-3 rounded-lg border border-ps-border px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface"
              >
                Copy to clipboard
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-ps-bg">
      <div className="flex items-center gap-3 border-b border-ps-border px-6 py-4">
        <div className="h-4 w-4 rounded bg-ps-border" />
        <div className="h-4 w-24 animate-pulse rounded bg-ps-border" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 w-2/3 animate-pulse rounded bg-ps-border" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-ps-surface-2" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-3 animate-pulse rounded bg-ps-surface-2 ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block w-80 shrink-0 border-l border-ps-border p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-ps-border" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);

  useEffect(() => {
    async function fetchEmail() {
      try {
        const res = await fetch(`/api/gmail/${id}`);
        const json: EmailApiResponse = await res.json();
        if (!json.success) { setError(json.error); return; }
        setEmail(json.data.email);
      } catch {
        setError("Failed to load email.");
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [id]);

  if (loading) return <PageSkeleton />;

  if (error || !email) {
    return (
      <div className="flex h-[calc(100vh-57px)] flex-col items-center justify-center gap-3 bg-ps-bg">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-ps-text">{error ?? "Email not found"}</p>
        <Link href="/inbox" className="text-sm text-ps-accent hover:underline">
          ← Back to inbox
        </Link>
      </div>
    );
  }

  const name = extractName(email.sender);
  const emailAddress = extractEmail(email.sender);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-ps-bg">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between gap-3 border-b border-ps-border bg-ps-card px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/inbox"
            className="flex shrink-0 items-center gap-1.5 text-sm text-ps-secondary transition-colors hover:text-ps-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Inbox
          </Link>
          <span className="text-ps-border">/</span>
          <span className="truncate text-sm text-ps-muted">{email.subject}</span>
        </div>

        {/* AI toggle — mobile only */}
        <button
          onClick={() => setShowAIPanel((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light hover:text-ps-accent lg:hidden"
        >
          <Zap className="h-3.5 w-3.5" />
          AI Tools
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email content */}
        <div className={`flex flex-col overflow-y-auto ${showAIPanel ? "hidden lg:flex lg:flex-1" : "flex flex-1"}`}>
          {/* Email header */}
          <div className="border-b border-ps-border bg-ps-card px-5 py-5 sm:px-8 sm:py-6">
            <h1 className="text-lg font-semibold text-ps-text leading-snug sm:text-xl">
              {email.subject}
            </h1>
            <div className="mt-4 flex items-start gap-3">
              <SenderAvatar sender={email.sender} />
              <div>
                <p className="text-sm font-medium text-ps-text">{name}</p>
                <p className="text-xs text-ps-muted">{emailAddress}</p>
                <p className="mt-0.5 text-xs text-ps-muted">
                  {new Date(email.receivedAt).toLocaleString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Email body */}
          <div className="flex-1 px-5 py-5 sm:px-8 sm:py-6">
            {email.body ? (
              <div
                className="prose prose-sm max-w-none text-ps-text"
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            ) : email.snippet ? (
              <p className="text-sm leading-relaxed text-ps-text">{email.snippet}</p>
            ) : (
              <p className="text-sm text-ps-muted">No content available for this email.</p>
            )}
          </div>
        </div>

        {/* AI side panel — always visible on desktop, toggleable on mobile */}
        <div className={`overflow-y-auto border-l border-ps-border bg-ps-surface p-5 ${showAIPanel ? "flex flex-col w-full lg:w-80 lg:shrink-0" : "hidden lg:flex lg:flex-col lg:w-80 lg:shrink-0"}`}>
          <AIPanel emailId={id} onClose={showAIPanel ? () => setShowAIPanel(false) : undefined} />
        </div>
      </div>
    </div>
  );
}
