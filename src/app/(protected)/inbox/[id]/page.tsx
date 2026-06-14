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

const AVATAR_COLORS = ["bg-[#BE5103]", "bg-[#8C4C1F]", "bg-[#544823]", "bg-[#332216]"];

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

function AIPanel({ emailId }: { emailId: string }) {
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
    URGENT: "bg-red-50 text-red-600 border-red-200",
    IMPORTANT: "bg-[#FEF0E7] text-[#BE5103] border-[#E7D8C8]",
    NORMAL: "bg-[#F8F2EA] text-[#544823] border-[#E7D8C8]",
    LOW: "bg-gray-50 text-gray-500 border-gray-200",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* AI Actions */}
      <div className="rounded-2xl border border-[#E7D8C8] bg-[#FFFDF8] p-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8C4C1F]">
          AI Actions
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSummarize}
            disabled={loadingSummary}
            className="flex items-center gap-2.5 rounded-xl border border-[#E7D8C8] bg-white px-4 py-3 text-left text-sm font-medium text-[#332216] transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7] disabled:opacity-60"
          >
            {loadingSummary ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#BE5103]" />
            ) : (
              <Sparkles className="h-4 w-4 text-[#BE5103]" />
            )}
            {loadingSummary ? "Summarizing…" : "Summarize email"}
          </button>

          <button
            onClick={handleDraft}
            disabled={loadingDraft}
            className="flex items-center gap-2.5 rounded-xl border border-[#E7D8C8] bg-white px-4 py-3 text-left text-sm font-medium text-[#332216] transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7] disabled:opacity-60"
          >
            {loadingDraft ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#BE5103]" />
            ) : (
              <FileText className="h-4 w-4 text-[#BE5103]" />
            )}
            {loadingDraft ? "Drafting…" : "Generate draft reply"}
          </button>

          <button
            onClick={handleClassify}
            disabled={loadingClassify}
            className="flex items-center gap-2.5 rounded-xl border border-[#E7D8C8] bg-white px-4 py-3 text-left text-sm font-medium text-[#332216] transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7] disabled:opacity-60"
          >
            {loadingClassify ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#BE5103]" />
            ) : (
              <Tag className="h-4 w-4 text-[#BE5103]" />
            )}
            {loadingClassify ? "Classifying…" : "Classify email"}
          </button>
        </div>
      </div>

      {/* Classification result */}
      {classification && (
        <div className="rounded-2xl border border-[#E7D8C8] bg-white p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-[#BE5103]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C4C1F]">
              Classification
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border bg-[#FEF0E7] px-3 py-1 text-xs font-medium text-[#BE5103] border-[#E7D8C8]">
              {classification.category}
            </span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${priorityColors[classification.priority] ?? "bg-gray-50 text-gray-500 border-gray-200"}`}>
              {classification.priority}
            </span>
          </div>
        </div>
      )}

      {/* AI Summary */}
      {(summary || errorSummary) && (
        <div className="rounded-2xl border border-[#E7D8C8] bg-[#FEF0E7] p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#BE5103]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#BE5103]">
              AI Summary
            </h3>
          </div>
          {errorSummary ? (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> {errorSummary}
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-[#332216]">{summary}</p>
          )}
        </div>
      )}

      {/* Draft reply */}
      {(draft || errorDraft) && (
        <div className="rounded-2xl border border-[#E7D8C8] bg-white p-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Reply className="h-4 w-4 text-[#BE5103]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C4C1F]">
              Generated Draft
            </h3>
          </div>
          {errorDraft ? (
            <div className="flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> {errorDraft}
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#332216]">{draft}</p>
              <button
                onClick={() => navigator.clipboard?.writeText(draft ?? "")}
                className="mt-3 rounded-lg border border-[#E7D8C8] px-3 py-1.5 text-xs font-medium text-[#544823] transition-colors hover:bg-[#F8F2EA]"
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
    <div className="flex h-[calc(100vh-57px)] flex-col bg-[#FFFDF8]">
      <div className="flex items-center gap-3 border-b border-[#E7D8C8] px-6 py-4">
        <div className="h-4 w-4 rounded bg-[#E7D8C8]" />
        <div className="h-4 w-24 animate-pulse rounded bg-[#E7D8C8]" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 w-2/3 animate-pulse rounded bg-[#E7D8C8]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#EFE5D5]" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`h-3 animate-pulse rounded bg-[#EFE5D5] ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        </div>
        <div className="w-[300px] shrink-0 border-l border-[#E7D8C8] p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-[#E7D8C8]" />
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
      <div className="flex h-[calc(100vh-57px)] flex-col items-center justify-center gap-3 bg-[#FFFDF8]">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm font-medium text-[#332216]">{error ?? "Email not found"}</p>
        <Link href="/inbox" className="text-sm text-[#BE5103] hover:underline">
          ← Back to inbox
        </Link>
      </div>
    );
  }

  const name = extractName(email.sender);
  const emailAddress = extractEmail(email.sender);

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-[#FFFDF8]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 border-b border-[#E7D8C8] bg-white px-6 py-3">
        <Link
          href="/inbox"
          className="flex items-center gap-1.5 text-sm text-[#544823] transition-colors hover:text-[#BE5103]"
        >
          <ArrowLeft className="h-4 w-4" />
          Inbox
        </Link>
        <span className="text-[#E7D8C8]">/</span>
        <span className="truncate text-sm text-[#8C4C1F]">{email.subject}</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Email content */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Email header */}
          <div className="border-b border-[#E7D8C8] bg-white px-8 py-6">
            <h1 className="text-xl font-semibold text-[#332216] leading-snug">
              {email.subject}
            </h1>
            <div className="mt-4 flex items-start gap-3">
              <SenderAvatar sender={email.sender} />
              <div>
                <p className="text-sm font-medium text-[#332216]">{name}</p>
                <p className="text-xs text-[#8C4C1F]">{emailAddress}</p>
                <p className="mt-0.5 text-xs text-[#8C4C1F]">
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
          <div className="flex-1 px-8 py-6">
            {email.body ? (
              <div
                className="prose prose-sm max-w-none text-[#332216]"
                dangerouslySetInnerHTML={{ __html: email.body }}
              />
            ) : email.snippet ? (
              <p className="text-sm leading-relaxed text-[#332216]">{email.snippet}</p>
            ) : (
              <p className="text-sm text-[#8C4C1F]">No content available for this email.</p>
            )}
          </div>
        </div>

        {/* AI side panel */}
        <div className="w-[320px] shrink-0 overflow-y-auto border-l border-[#E7D8C8] bg-[#F8F2EA] p-5">
          <AIPanel emailId={id} />
        </div>
      </div>
    </div>
  );
}
