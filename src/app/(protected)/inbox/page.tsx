"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, Mail, Star, DollarSign, CalendarDays, Tag, Circle, ChevronRight, X, ExternalLink, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { ComposeModal } from "@/components/inbox/compose-modal";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Email = {
  id: string;
  corsairEmailId: string;
  subject: string;
  sender: string;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiResponse =
  | { success: true; data: { emails: Email[]; pagination: Pagination } }
  | { success: false; error: string; code: string };

type SyncResponse =
  | { success: true; data: { synced: number; skipped: number } }
  | { success: false; error: string; code: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(raw: string): string {
  const date = new Date(raw);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7)
    return date.toLocaleDateString([], { weekday: "short" });
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function extractName(sender: string): string {
  const match = sender.match(/^([^<]+)</);
  return match ? match[1].trim() : sender.split("@")[0];
}

function getInitials(sender: string): string {
  const name = extractName(sender);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-ps-accent",
  "bg-ps-accent-dark",
  "bg-ps-secondary",
  "bg-ps-text",
];

function SenderAvatar({ sender }: { sender: string }) {
  const initials = getInitials(sender);
  const color = AVATAR_COLORS[sender.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${color}`}>
      {initials}
    </div>
  );
}

const FILTERS = [
  { id: "all", label: "All", icon: Mail },
  { id: "unread", label: "Unread", icon: Circle },
  { id: "important", label: "Important", icon: Star },
  { id: "finance", label: "Finance", icon: DollarSign },
  { id: "meeting", label: "Meeting", icon: CalendarDays },
  { id: "promotion", label: "Promo", icon: Tag },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

// ─── Email Row ─────────────────────────────────────────────────────────────────

function EmailRow({
  email,
  selected,
  onClick,
}: {
  email: Email;
  selected: boolean;
  onClick: () => void;
}) {
  const name = extractName(email.sender);
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left px-4 py-3 flex items-start gap-3 border-b border-ps-border transition-colors ${
        selected
          ? "bg-ps-accent-light border-l-2 border-l-ps-accent"
          : "hover:bg-ps-surface"
      }`}
    >
      <div className="mt-0.5 flex flex-col items-center gap-1">
        <SenderAvatar sender={email.sender} />
        {!email.isRead && (
          <span className="h-1.5 w-1.5 rounded-full bg-ps-accent" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm ${!email.isRead ? "font-semibold text-ps-text" : "font-medium text-ps-secondary"}`}>
            {name}
          </span>
          <span className="shrink-0 text-[11px] text-ps-muted">
            {formatTime(email.receivedAt)}
          </span>
        </div>
        <p className={`truncate text-sm mt-0.5 ${!email.isRead ? "text-ps-text" : "text-ps-secondary"}`}>
          {email.subject}
        </p>
        {email.snippet && (
          <p className="truncate text-xs text-ps-muted mt-0.5">{email.snippet}</p>
        )}
      </div>
    </button>
  );
}

// ─── Email Preview Panel (desktop only) ────────────────────────────────────────

function EmailPreview({
  email,
  onClose,
}: {
  email: Email;
  onClose: () => void;
}) {
  const name = extractName(email.sender);
  return (
    <div className="flex flex-1 flex-col bg-ps-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-ps-border px-6 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-ps-text line-clamp-2">
            {email.subject}
          </h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-ps-secondary">
            <SenderAvatar sender={email.sender} />
            <span>{name}</span>
            <span className="text-ps-border">·</span>
            <span className="text-xs text-ps-muted">
              {new Date(email.receivedAt).toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/inbox/${email.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark"
          >
            <ExternalLink className="h-3 w-3" />
            Full view
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ps-muted transition-colors hover:bg-ps-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {email.snippet ? (
          <p className="text-sm leading-relaxed text-ps-text">{email.snippet}</p>
        ) : (
          <p className="text-sm text-ps-muted">No preview available.</p>
        )}

        <div className="mt-6 rounded-xl border border-ps-border bg-ps-accent-light p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-xs font-semibold text-ps-accent">AI Summary</span>
          </div>
          <p className="text-xs text-ps-secondary">
            Open the full email view to generate an AI summary, draft a reply, or classify this email.
          </p>
          <Link
            href={`/inbox/${email.id}`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-ps-accent hover:underline"
          >
            Open full view <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Empty preview ──────────────────────────────────────────────────────────────

function EmptyPreview() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-ps-bg text-center px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ps-surface">
        <Mail className="h-6 w-6 text-ps-accent" />
      </div>
      <div>
        <p className="text-sm font-medium text-ps-text">Select an email</p>
        <p className="mt-1 text-xs text-ps-muted">Click any email to preview it here</p>
      </div>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-ps-border">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-ps-border" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex justify-between gap-2">
              <div className="h-3 w-28 animate-pulse rounded bg-ps-border" />
              <div className="h-3 w-10 animate-pulse rounded bg-ps-border" />
            </div>
            <div className="h-2.5 w-44 animate-pulse rounded bg-ps-surface-2" />
            <div className="h-2 w-36 animate-pulse rounded bg-ps-surface-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const router = useRouter();
  const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; skipped: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => { if (j.success) setGmailConnected(j.data.gmailConnected); })
      .catch(() => setGmailConnected(true));
  }, []);

  const fetchEmails = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/gmail?page=${p}&limit=20`);
      const json: ApiResponse = await res.json();
      if (!json.success) { setError(json.error); return; }
      setEmails(json.data.emails);
      setPagination(json.data.pagination);
    } catch {
      setError("Failed to load emails. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmails(page); }, [fetchEmails, page]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json: SyncResponse = await res.json();
      if (!json.success) { setError(json.error); return; }
      setSyncResult(json.data);
      await fetchEmails(1);
      setPage(1);
    } catch {
      setError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleEmailClick(email: Email) {
    if (!email.isRead) {
      await fetch(`/api/gmail/${email.id}`, { method: "PATCH" });
      setEmails((prev) => prev.map((e) => e.id === email.id ? { ...e, isRead: true } : e));
    }
    // On mobile navigate to detail page; on desktop show preview panel
    if (window.innerWidth < 1024) {
      router.push(`/inbox/${email.id}`);
    } else {
      setSelectedEmail(email);
    }
  }

  const filteredEmails = emails.filter((email) => {
    if (activeFilter === "unread" && email.isRead) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        email.subject.toLowerCase().includes(q) ||
        email.sender.toLowerCase().includes(q) ||
        (email.snippet ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadCount = emails.filter((e) => !e.isRead).length;

  if (gmailConnected === false) {
    return (
      <OnboardingEmptyState
        icon={<Mail className="h-7 w-7 text-ps-accent" />}
        title="Gmail not connected"
        description="SuperAlien requires Gmail access to show your inbox. Connect Gmail to continue."
        action={{ label: "Connect Gmail", href: "/onboarding" }}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)] bg-ps-bg">
      {/* Email list panel — full width on mobile, fixed width on desktop */}
      <div className="flex w-full shrink-0 flex-col border-r border-ps-border bg-ps-card lg:w-85">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-ps-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ps-text">Inbox</h2>
            {!loading && unreadCount > 0 && (
              <span className="rounded-full bg-ps-accent-light px-2 py-0.5 text-[11px] font-medium text-ps-accent border border-ps-border">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {syncResult && (
              <span className="text-[11px] text-ps-muted">
                {syncResult.synced} synced
              </span>
            )}
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-2.5 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2"
            >
              <Pencil className="h-3 w-3" />
              Compose
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg bg-ps-accent px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-ps-border px-4 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-ps-surface px-3 py-1.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-ps-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emails..."
              className="w-full bg-transparent text-xs text-ps-text placeholder:text-ps-muted outline-none"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-ps-border px-3 py-2 scrollbar-hide">
          {FILTERS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveFilter(id)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                activeFilter === id
                  ? "bg-ps-accent text-white"
                  : "text-ps-secondary hover:bg-ps-surface"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ps-surface">
                <Mail className="h-5 w-5 text-ps-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-ps-text">
                  {search ? "No results found" : "No emails yet"}
                </p>
                <p className="mt-0.5 text-xs text-ps-muted">
                  {search ? "Try a different search" : "Sync your inbox to get started"}
                </p>
              </div>
              {!search && (
                <button
                  onClick={handleSync}
                  className="rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark"
                >
                  Sync now
                </button>
              )}
            </div>
          ) : (
            filteredEmails.map((email) => (
              <EmailRow
                key={email.id}
                email={email}
                selected={selectedEmail?.id === email.id}
                onClick={() => handleEmailClick(email)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-ps-border px-4 py-2.5">
            <span className="text-[11px] text-ps-muted">
              {pagination.page} / {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="rounded px-2 py-1 text-xs font-medium text-ps-accent transition-colors hover:bg-ps-accent-light disabled:opacity-40"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded px-2 py-1 text-xs font-medium text-ps-accent transition-colors hover:bg-ps-accent-light disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preview panel — hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex lg:flex-1">
        {selectedEmail ? (
          <EmailPreview
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
          />
        ) : (
          <EmptyPreview />
        )}
      </div>

      <ComposeModal
        open={showCompose}
        onClose={() => setShowCompose(false)}
      />
    </div>
  );
}
