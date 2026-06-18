"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type VerifyStep = {
  type: "email" | "phone";
  resourceId: string;
};

export function ContactSection() {
  const { user } = useUser();
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [verifyStep, setVerifyStep] = useState<VerifyStep | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function addEmail() {
    if (!user || !newEmail.trim()) return;
    setLoading(true);
    try {
      const emailAddr = await user.createEmailAddress({ email: newEmail.trim() });
      await emailAddr.prepareVerification({ strategy: "email_code" });
      setVerifyStep({ type: "email", resourceId: emailAddr.id });
      setNewEmail("");
      showToast("Verification code sent.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to add email.", false);
    } finally {
      setLoading(false);
    }
  }

  async function addPhone() {
    if (!user || !newPhone.trim()) return;
    setLoading(true);
    try {
      const phoneNum = await user.createPhoneNumber({ phoneNumber: newPhone.trim() });
      await phoneNum.prepareVerification();
      setVerifyStep({ type: "phone", resourceId: phoneNum.id });
      setNewPhone("");
      showToast("Verification code sent.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to add phone.", false);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!user || !verifyStep || !code.trim()) return;
    setLoading(true);
    try {
      if (verifyStep.type === "email") {
        const emailAddr = user.emailAddresses.find((e) => e.id === verifyStep.resourceId);
        if (!emailAddr) throw new Error("Email not found");
        await emailAddr.attemptVerification({ code });
      } else {
        const phoneNum = user.phoneNumbers.find((p) => p.id === verifyStep.resourceId);
        if (!phoneNum) throw new Error("Phone not found");
        await phoneNum.attemptVerification({ code });
      }
      setVerifyStep(null);
      setCode("");
      showToast("Verified successfully.", true);
      await user.reload();
    } catch (err) {
      showToast((err as Error).message ?? "Invalid code.", false);
    } finally {
      setLoading(false);
    }
  }

  async function removeEmail(id: string) {
    if (!user) return;
    try {
      const emailAddr = user.emailAddresses.find((e) => e.id === id);
      if (!emailAddr) return;
      await emailAddr.destroy();
      await user.reload();
      showToast("Email removed.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to remove.", false);
    }
  }

  async function removePhone(id: string) {
    if (!user) return;
    try {
      const phone = user.phoneNumbers.find((p) => p.id === id);
      if (!phone) return;
      await phone.destroy();
      await user.reload();
      showToast("Phone removed.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to remove.", false);
    }
  }

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">Contact</h2>
        <p className="mt-0.5 text-xs text-ps-muted">Email addresses and phone numbers</p>
      </div>
      <div className="px-6 py-5 space-y-5">
        {toast && (
          <div
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs ${
              toast.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {toast.ok ? <CheckCircle className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
            {toast.msg}
          </div>
        )}

        {/* Verify step */}
        {verifyStep && (
          <div className="rounded-xl border border-ps-accent/30 bg-ps-accent-light p-4">
            <p className="mb-2 text-xs font-medium text-ps-text">
              Enter the verification code sent to your {verifyStep.type}
            </p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                className="flex-1 rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-ps-accent"
              />
              <button
                onClick={verifyCode}
                disabled={loading || !code}
                className="flex items-center gap-1.5 rounded-lg bg-ps-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
                Verify
              </button>
              <button
                onClick={() => { setVerifyStep(null); setCode(""); }}
                className="rounded-lg border border-ps-border px-3 py-2 text-xs text-ps-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Email addresses */}
        <div>
          <p className="mb-2 text-xs font-semibold text-ps-secondary uppercase tracking-wide">Email addresses</p>
          <div className="space-y-1.5 mb-2">
            {user?.emailAddresses.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-xl border border-ps-border p-3">
                <span className="flex-1 text-sm text-ps-text">{e.emailAddress}</span>
                {e.verification?.status === "verified" ? (
                  <span className="text-[10px] font-medium text-emerald-600">Verified</span>
                ) : (
                  <span className="text-[10px] font-medium text-orange-500">Unverified</span>
                )}
                <button
                  onClick={() => removeEmail(e.id)}
                  className="text-ps-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          
        </div>

        {/* Phone numbers */}
        <div>
          <p className="mb-2 text-xs font-semibold text-ps-secondary uppercase tracking-wide">Phone numbers</p>
          <div className="space-y-1.5 mb-2">
            {user?.phoneNumbers.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-ps-border p-3">
                <span className="flex-1 text-sm text-ps-text">{p.phoneNumber}</span>
                {p.verification?.status === "verified" ? (
                  <span className="text-[10px] font-medium text-emerald-600">Verified</span>
                ) : (
                  <span className="text-[10px] font-medium text-orange-500">Unverified</span>
                )}
                <button
                  onClick={() => removePhone(p.id)}
                  className="text-ps-muted transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newPhone}
              onChange={(ev) => setNewPhone(ev.target.value)}
              placeholder="+1 234 567 8900"
              type="tel"
              className="flex-1 rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text placeholder:text-ps-muted outline-none focus:border-ps-accent"
            />
            <button
              onClick={addPhone}
              disabled={loading || !newPhone.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
