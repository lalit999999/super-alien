"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(raw: string): string {
  const date = new Date(raw);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ sender }: { sender: string }) {
  const initials = getInitials(sender);
  const colors = [
    "bg-[#384959]",
    "bg-[#6A89A7]",
    "bg-[#4a6280]",
    "bg-[#3d5a73]",
  ];
  const idx = sender.charCodeAt(0) % colors.length;

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${colors[idx]}`}
    >
      {initials}
    </div>
  );
}

function UnreadDot() {
  return (
    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#88BDF2]" />
  );
}

function EmailRow({
  email,
  onMarkRead,
}: {
  email: Email;
  onMarkRead: (id: string) => void;
}) {
  const name = extractName(email.sender);

  async function handleClick() {
    if (!email.isRead) {
      await fetch(`/api/gmail/${email.id}`, { method: "PATCH" });
      onMarkRead(email.id);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`group flex w-full items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5 ${
        !email.isRead ? "bg-white/3" : ""
      }`}
    >
      <Avatar sender={email.sender} />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              !email.isRead
                ? "font-semibold text-white"
                : "font-medium text-[#BDDDFC]/70"
            }`}
          >
            {name}
          </span>
          <span className="shrink-0 text-xs text-[#6A89A7]">
            {formatTime(email.receivedAt)}
          </span>
        </div>

        <p
          className={`truncate text-sm ${
            !email.isRead ? "text-[#BDDDFC]" : "text-[#6A89A7]"
          }`}
        >
          {email.subject}
        </p>

        {email.snippet && (
          <p className="truncate text-xs text-[#6A89A7]/80">{email.snippet}</p>
        )}
      </div>

      {!email.isRead && <UnreadDot />}
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-12 animate-pulse rounded bg-white/10" />
            </div>
            <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-64 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onSync }: { onSync: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#384959]">
        <svg
          className="h-8 w-8 text-[#88BDF2]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>
      <div>
        <p className="text-base font-medium text-[#BDDDFC]">No emails yet</p>
        <p className="mt-1 text-sm text-[#6A89A7]">
          Sync your inbox to get started
        </p>
      </div>
      <button
        onClick={onSync}
        className="mt-2 rounded-lg bg-[#384959] px-4 py-2 text-sm font-medium text-[#88BDF2] transition-colors hover:bg-[#4a6280]"
      >
        Sync now
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; skipped: number } | null>(null);

  const fetchEmails = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/gmail?page=${p}&limit=20`);
      const json: ApiResponse = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

      setEmails(json.data.emails);
      setPagination(json.data.pagination);
    } catch {
      setError("Failed to load emails. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmails(page);
  }, [fetchEmails, page]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);

    try {
      const res = await fetch("/api/gmail/sync", { method: "POST", body: JSON.stringify({}) });
      const json: SyncResponse = await res.json();

      if (!json.success) {
        setError(json.error);
        return;
      }

      setSyncResult(json.data);
      await fetchEmails(1);
      setPage(1);
    } catch {
      setError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  }

  function handleMarkRead(id: string) {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isRead: true } : e))
    );
  }

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col bg-[#1a2530]">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">Inbox</h2>
          {!loading && unreadCount > 0 && (
            <span className="rounded-full bg-[#384959] px-2 py-0.5 text-xs font-medium text-[#88BDF2]">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {syncResult && (
            <span className="text-xs text-[#6A89A7]">
              {syncResult.synced} synced · {syncResult.skipped} skipped
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-lg bg-[#384959] px-3 py-1.5 text-sm font-medium text-[#88BDF2] transition-colors hover:bg-[#4a6280] disabled:opacity-50"
          >
            {syncing ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Syncing…
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Sync
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : emails.length === 0 ? (
          <EmptyState onSync={handleSync} />
        ) : (
          <div className="divide-y divide-white/5">
            {emails.map((email) => (
              <EmailRow key={email.id} email={email} onMarkRead={handleMarkRead} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/5 px-6 py-3">
          <span className="text-xs text-[#6A89A7]">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} emails
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded px-3 py-1 text-xs font-medium text-[#88BDF2] transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded px-3 py-1 text-xs font-medium text-[#88BDF2] transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
