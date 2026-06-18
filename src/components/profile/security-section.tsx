"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from "lucide-react";

type Toast = { msg: string; ok: boolean };

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ps-border last:border-0 py-5 first:pt-0 last:pb-0">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ps-secondary">{title}</p>
      {children}
    </div>
  );
}

function ToastBar({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div
      className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs ${
        toast.ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {toast.ok ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
      {toast.msg}
    </div>
  );
}

export function SecuritySection() {
  const { user } = useUser();
  const { sessionId } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState<Toast | null>(null);

  // Password
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  // 2FA TOTP
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [enablingTotp, setEnablingTotp] = useState(false);

  // Backup codes
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Sessions
  type Session = { id: string; browserName?: string; deviceType?: string; ipAddress?: string; city?: string; country?: string; lastActiveAt?: Date };
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!user) return;
    setLoadingSessions(true);
    user.getSessions()
      .then((s) => setSessions(s as Session[]))
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [user]);

  async function savePassword() {
    if (!user || !newPwd) return;
    setSavingPwd(true);
    try {
      await user.updatePassword({
        currentPassword: currentPwd || undefined,
        newPassword: newPwd,
        signOutOfOtherSessions: false,
      });
      setCurrentPwd("");
      setNewPwd("");
      showToast("Password updated.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to update password.", false);
    } finally {
      setSavingPwd(false);
    }
  }

  async function startEnableTotp() {
    if (!user) return;
    setEnablingTotp(true);
    try {
      const totp = await user.createTOTP();
      setTotpSecret(totp.secret ?? null);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to set up 2FA.", false);
    } finally {
      setEnablingTotp(false);
    }
  }

  async function verifyTotp() {
    if (!user || !totpCode) return;
    try {
      await user.verifyTOTP({ code: totpCode });
      setTotpSecret(null);
      setTotpCode("");
      showToast("Two-factor authentication enabled.", true);
      await user.reload();
    } catch (err) {
      showToast((err as Error).message ?? "Invalid code.", false);
    }
  }

  async function disableTotp() {
    if (!user) return;
    try {
      await user.disableTOTP();
      showToast("Two-factor authentication disabled.", true);
      await user.reload();
    } catch (err) {
      showToast((err as Error).message ?? "Failed to disable 2FA.", false);
    }
  }

  async function generateBackupCodes() {
    if (!user) return;
    try {
      const result = await user.createBackupCode();
      setBackupCodes((result as { codes: string[] }).codes);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to generate backup codes.", false);
    }
  }

  async function revokeSession(id: string) {
    if (!user) return;
    try {
      const session = sessions.find((s) => s.id === id);
      if (!session) return;
      // @ts-expect-error session type from getSessions supports revoke
      await session.revoke();
      if (id === sessionId) {
        router.push("/sign-in");
      } else {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        showToast("Session revoked.", true);
      }
    } catch (err) {
      showToast((err as Error).message ?? "Failed to revoke session.", false);
    }
  }

  const totpEnabled = user?.twoFactorEnabled;

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">Security</h2>
        <p className="mt-0.5 text-xs text-ps-muted">Password</p>
      </div>
      <div className="px-6 py-5 space-y-0">
        <ToastBar toast={toast} />

        {/* Password */}
        <SectionBlock title="Password">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ps-secondary">Current password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={currentPwd}
                  onChange={(e) => setCurrentPwd(e.target.value)}
                  placeholder="Leave blank if no password set"
                  className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 pr-9 text-sm text-ps-text outline-none focus:border-ps-accent"
                />
                <button onClick={() => setShowPwd((v) => !v)} className="absolute right-2.5 top-2.5 text-ps-muted">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ps-secondary">New password</label>
              <input
                type={showPwd ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-ps-accent"
              />
            </div>
            <button
              onClick={savePassword}
              disabled={savingPwd || !newPwd}
              className="flex items-center gap-2 rounded-xl bg-ps-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {savingPwd && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {currentPwd ? "Change password" : "Set password"}
            </button>
          </div>
        </SectionBlock>

      


      </div>
    </div>
  );
}
