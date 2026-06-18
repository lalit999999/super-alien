"use client";

import { useUser } from "@clerk/nextjs";
import { CheckCircle, Link as LinkIcon } from "lucide-react";

export function AccountOverview() {
  const { user } = useUser();

  if (!user) return null;

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const lastSignIn = user.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card overflow-hidden">
      <div className="border-b border-ps-border px-6 py-4">
        <h2 className="text-sm font-semibold text-ps-text">Account overview</h2>
        <p className="mt-0.5 text-xs text-ps-muted">Read-only account information</p>
      </div>
      <div className="divide-y divide-ps-border">
        <div className="flex items-center justify-between px-6 py-3.5">
          <p className="text-sm text-ps-secondary">Member since</p>
          <p className="text-sm font-medium text-ps-text">{createdAt}</p>
        </div>
        <div className="flex items-center justify-between px-6 py-3.5">
          <p className="text-sm text-ps-secondary">Last sign in</p>
          <p className="text-sm font-medium text-ps-text">{lastSignIn}</p>
        </div>

        {user.externalAccounts.length > 0 && (
          <div className="px-6 py-3.5">
            <p className="mb-2 text-sm text-ps-secondary">Connected accounts</p>
            <div className="space-y-1.5">
              {user.externalAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2.5 rounded-xl border border-ps-border p-3">
                  <LinkIcon className="h-3.5 w-3.5 text-ps-accent shrink-0" />
                  <span className="flex-1 text-sm font-medium text-ps-text capitalize">
                    {account.provider}
                  </span>
                  <span className="text-xs text-ps-muted truncate max-w-[160px]">
                    {account.emailAddress}
                  </span>
                  {account.verification?.status === "verified" && (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
