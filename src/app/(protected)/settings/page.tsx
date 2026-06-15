"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  RefreshCw,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Mail,
  CalendarDays,
  User,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

type IntegrationStatus = {
  gmailConnected: boolean;
  calendarConnected: boolean;
  lastGmailSync: string | null;
  lastCalendarSync: string | null;
  onboardingCompleted: boolean;
};

// ─── Shared UI primitives ──────────────────────────────────────────────────────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-ps-muted">{description}</p>
        )}
      </div>
      <div className="divide-y divide-ps-border">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-medium text-ps-text">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-ps-muted">{description}</p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        connected
          ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          : "bg-ps-surface text-ps-muted border-ps-border"
      }`}
    >
      {connected ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

// ─── Appearance section ────────────────────────────────────────────────────────

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <SettingsSection title="Appearance" description="Choose your preferred color theme">
      <div className="px-6 py-5">
        <div className="grid grid-cols-3 gap-3">
          {options.map(({ value, label, icon: Icon }) => {
            const active = mounted && theme === value;
            return (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors ${
                  active
                    ? "border-ps-accent bg-ps-accent-light text-ps-accent"
                    : "border-ps-border bg-ps-bg text-ps-secondary hover:border-ps-accent/40 hover:bg-ps-surface"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
        {mounted && (
          <p className="mt-3 text-xs text-ps-muted">
            Current theme: <span className="font-medium capitalize">{theme}</span>
          </p>
        )}
      </div>
    </SettingsSection>
  );
}

function formatSync(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Disconnect confirmation dialog ────────────────────────────────────────────

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

  const label =
    plugin === "gmail"
      ? "Gmail"
      : plugin === "calendar"
      ? "Google Calendar"
      : "all integrations";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ps-border bg-ps-card p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-ps-text">Disconnect {label}?</h3>
        <p className="mt-2 text-xs text-ps-secondary">
          This will remove all synced data and disconnect the integration. You will need to reconnect and sync again.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-ps-border px-4 py-2 text-sm font-medium text-ps-secondary transition-colors hover:bg-ps-surface disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [syncingGmail, setSyncingGmail] = useState(false);
  const [syncingCalendar, setSyncingCalendar] = useState(false);
  const [disconnectDialog, setDisconnectDialog] = useState<{
    open: boolean;
    plugin: "gmail" | "calendar" | "all";
    loading: boolean;
  }>({ open: false, plugin: "all", loading: false });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/integrations");
      const json = await res.json();
      if (json.success) setStatus(json.data);
    } finally {
      setLoadingStatus(false);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSync(plugin: "gmail" | "calendar") {
    const setter = plugin === "gmail" ? setSyncingGmail : setSyncingCalendar;
    setter(true);
    try {
      const endpoint = plugin === "gmail" ? "/api/gmail/sync" : "/api/calendar/sync";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`${plugin === "gmail" ? "Gmail" : "Calendar"} synced successfully.`, "success");
        await loadStatus();
      } else {
        showToast(json.error ?? "Sync failed.", "error");
      }
    } catch {
      showToast("Sync failed. Please try again.", "error");
    } finally {
      setter(false);
    }
  }

  function openDisconnect(plugin: "gmail" | "calendar" | "all") {
    setDisconnectDialog({ open: true, plugin, loading: false });
  }

  async function confirmDisconnect() {
    setDisconnectDialog((d) => ({ ...d, loading: true }));
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin: disconnectDialog.plugin }),
      });
      const json = await res.json();
      if (json.success) {
        setDisconnectDialog({ open: false, plugin: "all", loading: false });
        showToast("Integration disconnected. Redirecting to onboarding…", "success");
        await loadStatus();
        setTimeout(() => router.push("/onboarding"), 1500);
      } else {
        showToast(json.error ?? "Disconnect failed.", "error");
        setDisconnectDialog((d) => ({ ...d, loading: false }));
      }
    } catch {
      showToast("Disconnect failed. Please try again.", "error");
      setDisconnectDialog((d) => ({ ...d, loading: false }));
    }
  }

  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ps-secondary">
          Manage your account and integrations
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Appearance */}
        <AppearanceSection />

        {/* Account */}
        <SettingsSection title="Account" description="Your profile and authentication">
          <SettingsRow label="Profile" description="Managed via Clerk authentication">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ps-accent-light border border-ps-border">
              <User className="h-4 w-4 text-ps-accent" />
            </div>
          </SettingsRow>
          <SettingsRow
            label="Authentication"
            description="Managed by Clerk — secure and passwordless"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-ps-accent-light px-3 py-1 text-xs font-medium text-ps-accent border border-ps-border">
              <Shield className="h-3 w-3" />
              Clerk
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* Integrations */}
        <SettingsSection
          title="Integrations"
          description="Connected services and sync status"
        >
          {loadingStatus ? (
            <div className="flex items-center justify-center gap-2 px-6 py-8 text-xs text-ps-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading integration status…
            </div>
          ) : (
            <>
              {/* Gmail row */}
              <div className="px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps-surface border border-ps-border">
                      <Mail className="h-4 w-4 text-ps-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ps-text">Gmail</p>
                      <p className="text-xs text-ps-muted">
                        Last sync: {formatSync(status?.lastGmailSync ?? null)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge connected={status?.gmailConnected ?? false} />
                    {status?.gmailConnected ? (
                      <>
                        <button
                          onClick={() => handleSync("gmail")}
                          disabled={syncingGmail}
                          className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingGmail ? "animate-spin" : ""}`} />
                          {syncingGmail ? "Syncing…" : "Sync"}
                        </button>
                        <button
                          onClick={() => openDisconnect("gmail")}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <a
                        href="/api/corsair/connect?plugin=gmail"
                        className="rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ps-accent-dark"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar row */}
              <div className="px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ps-surface border border-ps-border">
                      <CalendarDays className="h-4 w-4 text-ps-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ps-text">Google Calendar</p>
                      <p className="text-xs text-ps-muted">
                        Last sync: {formatSync(status?.lastCalendarSync ?? null)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge connected={status?.calendarConnected ?? false} />
                    {status?.calendarConnected ? (
                      <>
                        <button
                          onClick={() => handleSync("calendar")}
                          disabled={syncingCalendar}
                          className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-1.5 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingCalendar ? "animate-spin" : ""}`} />
                          {syncingCalendar ? "Syncing…" : "Sync"}
                        </button>
                        <button
                          onClick={() => openDisconnect("calendar")}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <a
                        href="/api/corsair/connect?plugin=googlecalendar"
                        className="rounded-lg bg-ps-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ps-accent-dark"
                      >
                        Connect
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Control how and when you get notified"
        >
          <SettingsRow
            label="Email summaries"
            description="Receive AI-generated daily email summaries"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-5 w-9 rounded-full border border-ps-border bg-ps-surface-2 peer-checked:bg-ps-accent peer-checked:border-ps-accent transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>
          <SettingsRow
            label="Meeting reminders"
            description="Get reminded before calendar events"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-5 w-9 rounded-full border border-ps-border bg-ps-surface-2 peer-checked:bg-ps-accent peer-checked:border-ps-accent transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>
          <SettingsRow
            label="Agent notifications"
            description="Notify when the AI agent completes an action"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-5 w-9 rounded-full border border-ps-border bg-ps-surface-2 peer-checked:bg-ps-accent peer-checked:border-ps-accent transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection
          title="Data & Privacy"
          description="Your data is encrypted and never sold"
        >
          <SettingsRow
            label="Data storage"
            description="Emails and events are stored in your private database"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 border border-emerald-200">
              <Shield className="h-3 w-3" />
              Encrypted
            </span>
          </SettingsRow>
          <SettingsRow
            label="AI data usage"
            description="Your data is used only to generate responses for you"
          >
            <span className="text-xs text-ps-muted">Never shared</span>
          </SettingsRow>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone">
          <SettingsRow
            label="Disconnect all integrations"
            description="Removes all synced data and disconnects Gmail and Calendar"
          >
            <button
              onClick={() => openDisconnect("all")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              Disconnect all
            </button>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* Disconnect confirmation dialog */}
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
