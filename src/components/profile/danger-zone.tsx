"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertCircle } from "lucide-react";

function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  requireTyping,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  requireTyping?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState("");
  if (!open) return null;
  const canConfirm = !requireTyping || typed === requireTyping;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ps-border bg-ps-card p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 border border-red-200">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="text-sm font-semibold text-ps-text">{title}</h3>
        <p className="mt-2 text-xs text-ps-secondary">{description}</p>
        {requireTyping && (
          <div className="mt-3">
            <label className="mb-1.5 block text-xs text-ps-muted">
              Type <span className="font-mono font-semibold text-ps-text">{requireTyping}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-red-400"
            />
          </div>
        )}
        <div className="mt-5 flex gap-3">
          <button onClick={() => { onCancel(); setTyped(""); }} disabled={loading} className="flex-1 rounded-xl border border-ps-border px-4 py-2 text-sm font-medium text-ps-secondary hover:bg-ps-surface disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading || !canConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DangerZone() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [disconnectDialog, setDisconnectDialog] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleDisconnectAll() {
    setDisconnectLoading(true);
    try {
      const res = await fetch("/api/integrations/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plugin: "all" }),
      });
      const j = await res.json();
      if (j.success) {
        setDisconnectDialog(false);
        showToast("All integrations disconnected.");
      } else {
        showToast(j.error ?? "Disconnect failed.");
      }
    } catch {
      showToast("Disconnect failed.");
    } finally {
      setDisconnectLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const j = await res.json();
      if (!j.success) throw new Error(j.error ?? "Server error");
      await user.delete();
      await signOut(() => router.push("/"));
    } catch (err) {
      showToast((err as Error).message ?? "Failed to delete account.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-ps-card overflow-hidden dark:border-red-900/40">
      <div className="border-b border-red-200 px-6 py-4 dark:border-red-900/40">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <p className="mt-0.5 text-xs text-ps-muted">Destructive actions — proceed with caution</p>
      </div>

      {toast && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {toast}
        </div>
      )}

      <div className="divide-y divide-ps-border">
        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ps-text">Disconnect all integrations</p>
            <p className="mt-0.5 text-xs text-ps-muted">Removes all synced data and disconnects Gmail and Calendar</p>
          </div>
          <button
            onClick={() => setDisconnectDialog(true)}
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            Disconnect all
          </button>
        </div>

        <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ps-text">Delete account</p>
            <p className="mt-0.5 text-xs text-ps-muted">Permanently delete your account and all associated data</p>
          </div>
          <button
            onClick={() => setDeleteDialog(true)}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
          >
            Delete account
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={disconnectDialog}
        title="Disconnect all integrations?"
        description="This will remove all synced emails and calendar events and disconnect Gmail and Google Calendar. You will need to reconnect and sync again."
        confirmText="Disconnect all"
        onConfirm={handleDisconnectAll}
        onCancel={() => setDisconnectDialog(false)}
        loading={disconnectLoading}
      />

      <ConfirmDialog
        open={deleteDialog}
        title="Delete your account?"
        description="This is permanent and cannot be undone. All your emails, events, and data will be deleted immediately."
        confirmText="Delete my account"
        requireTyping="DELETE"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeleteDialog(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
