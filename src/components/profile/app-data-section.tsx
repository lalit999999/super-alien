"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Mail,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

type IntegrationStatus = {
  gmailConnected: boolean;
  calendarConnected: boolean;
  lastGmailSync: string | null;
  lastCalendarSync: string | null;
};

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        connected
          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-ps-surface text-ps-muted border-ps-border"
      }`}
    >
      {connected ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

function DisconnectDialog({
  open,
  plugin,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  plugin: "gmail" | "calendar" | "all";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  const label = plugin === "gmail" ? "Gmail" : plugin === "calendar" ? "Google Calendar" : "all integrations";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ps-border bg-ps-card p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-ps-text">Disconnect {label}?</h3>
        <p className="mt-2 text-xs text-ps-secondary">
          This will remove all synced data and disconnect the integration. You will need to reconnect and sync again.
        </p>
        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-ps-border px-4 py-2 text-sm font-medium text-ps-secondary hover:bg-ps-surface disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

function formatSync(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AppDataSection() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState<{ open: boolean; plugin: "gmail" | "calendar" | "all"; loading: boolean }>({ open: false, plugin: "all", loading: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [planLabel, setPlanLabel] = useState<"Pro" | "Free">("Free");
  const [renewsAt, setRenewsAt] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => { if (j.success) setStatus(j.data); })
      .finally(() => setLoadingStatus(false));

    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const sub = j.data?.subscription;
          setPlanLabel(sub?.status === "ACTIVE" ? "Pro" : "Free");
          if (sub?.renewsAt) {
            setRenewsAt(new Date(sub.renewsAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }));
          }
        }
      })
      .catch(() => {});
  }, []);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSync(plugin: "gmail" | "calendar") {
    const setter = plugin === "gmail" ? setSyncingGmail : setSyncingCalendar;
    setter(true);
    try {
      const endpoint = plugin === "gmail" ? "/api/gmail/sync" : "/api/calendar/sync";
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const j = await res.json();
      if (j.success) {
        showToast(`${plugin === "gmail" ? "Gmail" : "Calendar"} synced.`, "success");
        const r2 = await fetch("/api/integrations");
        const j2 = await r2.json();
        if (j2.success) setStatus(j2.data);
      } else {
        showToast(j.error ?? "Sync failed.", "error");
      }
    } catch {
      showToast("Sync failed.", "error");
    } finally {
      setter(false);
    }
  }

  async function confirmDisconnect() {
    setDisconnectDialog((d) => ({ ...d, loading: true }));
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin: disconnectDialog.plugin }),
      });
      const j = await res.json();
      if (j.success) {
        setDisconnectDialog({ open: false, plugin: "all", loading: false });
        showToast("Integration disconnected.", "success");
        const r2 = await fetch("/api/integrations");
        const j2 = await r2.json();
        if (j2.success) setStatus(j2.data);
      } else {
        showToast(j.error ?? "Disconnect failed.", "error");
        setDisconnectDialog((d) => ({ ...d, loading: false }));
      }
    } catch {
      showToast("Disconnect failed.", "error");
      setDisconnectDialog((d) => ({ ...d, loading: false }));
    }
  }

  return (
    <div id="connected-accounts" className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">Connected accounts & plan</h2>
        <p className="mt-0.5 text-xs text-ps-muted">Integrations and billing summary</p>
      </div>

      {toast && (
        <div
          className={`mx-6 mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <div className="divide-y divide-ps-border">
        {/* Gmail */}
        {loadingStatus ? (
          <div className="flex items-center justify-center gap-2 px-6 py-8 text-xs text-ps-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading integration status…
          </div>
        ) : (
          <>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps-surface border border-ps-border">
                    <Mail className="h-4 w-4 text-ps-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ps-text">Gmail</p>
                    <p className="text-xs text-ps-muted">Last sync: {formatSync(status?.lastGmailSync ?? null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge connected={status?.gmailConnected ?? false} />
                  {status?.gmailConnected ? (
                    <>
                      <button onClick={() => handleSync("gmail")} disabled={syncingGmail} className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 disabled:opacity-50">
                        <RefreshCw className={`h-3 w-3 ${syncingGmail ? "animate-spin" : ""}`} />
                        {syncingGmail ? "Syncing…" : "Sync"}
                      </button>
                      <button onClick={() => setDisconnectDialog({ open: true, plugin: "gmail", loading: false })} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a href="/api/corsair/connect?plugin=gmail" className="rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-ps-accent-dark">
                      Connect
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps-surface border border-ps-border">
                    <CalendarDays className="h-4 w-4 text-ps-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ps-text">Google Calendar</p>
                    <p className="text-xs text-ps-muted">Last sync: {formatSync(status?.lastCalendarSync ?? null)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge connected={status?.calendarConnected ?? false} />
                  {status?.calendarConnected ? (
                    <>
                      <button onClick={() => handleSync("calendar")} disabled={syncingCalendar} className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 disabled:opacity-50">
                        <RefreshCw className={`h-3 w-3 ${syncingCalendar ? "animate-spin" : ""}`} />
                        {syncingCalendar ? "Syncing…" : "Sync"}
                      </button>
                      <button onClick={() => setDisconnectDialog({ open: true, plugin: "calendar", loading: false })} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a href="/api/corsair/connect?plugin=googlecalendar" className="rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-ps-accent-dark">
                      Connect
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Plan summary */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps-surface border border-ps-border">
              <CreditCard className="h-4 w-4 text-ps-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-ps-text">{planLabel} plan</p>
              {renewsAt && <p className="text-xs text-ps-muted">Renews {renewsAt}</p>}
            </div>
          </div>
          <Link href="/billing" className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary hover:bg-ps-surface-2">
            View full billing
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <DisconnectDialog
        open={disconnectDialog.open}
        plugin={disconnectDialog.plugin}
        onConfirm={confirmDisconnect}
        onCancel={() => setDisconnectDialog((d) => ({ ...d, open: false }))}
        loading={disconnectDialog.loading}
      />
    </div>
  );
}
