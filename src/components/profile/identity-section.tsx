"use client";

import { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Camera, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { UserAvatar } from "@/components/layout/user-avatar";

function SectionCard({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-ps-muted">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export function IdentitySection() {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName, lastName, username: username || undefined });
      showToast("Profile updated.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to update profile.", false);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      await user.setProfileImage({ file });
      showToast("Avatar updated.", true);
    } catch (err) {
      showToast((err as Error).message ?? "Failed to update avatar.", false);
    }
    e.target.value = "";
  }

  return (
    <SectionCard title="Identity" description="Your name, username, and profile photo">
      {toast && (
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
      )}

      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <UserAvatar size="lg" />
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-ps-border bg-ps-card text-ps-secondary shadow-sm transition-colors hover:bg-ps-surface"
          >
            <Camera className="h-3 w-3" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <p className="text-sm font-medium text-ps-text">
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"}
          </p>
          <p className="text-xs text-ps-muted">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ps-secondary">First name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ps-secondary">Last name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ps-secondary">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-ps-border bg-ps-bg px-3 py-2 text-sm text-ps-text outline-none focus:border-ps-accent focus:ring-2 focus:ring-ps-accent/10"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-ps-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save changes
        </button>
      </div>
    </SectionCard>
  );
}
