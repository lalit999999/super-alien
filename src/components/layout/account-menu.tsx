"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/layout/user-avatar";
import {
  ChevronUp,
  User,
  Plug,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  LogOut,
  Copy,
  Check,
  Mail,
} from "lucide-react";
import Link from "next/link";

const SUPPORT_EMAIL = "support@superalien.app";

export function AccountMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [planLabel, setPlanLabel] = useState<"Pro" | "Free" | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setPlanLabel(j.data?.subscription?.status === "ACTIVE" ? "Pro" : "Free");
        }
      })
      .catch(() => setPlanLabel("Free"));
  }, []);

  if (!isLoaded) {
    return <div className="h-8 w-32 animate-pulse rounded-lg bg-ps-surface-2" />;
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Account";

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleSignOut = () => {
    signOut(() => router.push("/sign-in"));
  };

  function handleCopyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ps-secondary transition-colors hover:bg-ps-surface-2 hover:text-ps-text focus:outline-none focus-visible:ring-2 focus-visible:ring-ps-accent">
            <UserAvatar size="sm" />
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-medium text-ps-text">{displayName}</p>
            </div>
            {planLabel && (
              <span className="shrink-0 rounded-full bg-ps-accent-light px-2 py-0.5 text-[10px] font-semibold text-ps-accent">
                {planLabel}
              </span>
            )}
            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-ps-muted" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-64 border-ps-border bg-ps-bg p-0 shadow-lg shadow-ps-text/10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-ps-border px-4 py-3.5">
            <UserAvatar size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ps-text">{displayName}</p>
              <p className="truncate text-xs text-ps-muted">{email}</p>
            </div>
          </div>

          <div className="p-1.5 space-y-0.5">
            {/* Plan */}
            <div className="flex items-center justify-between rounded-md px-2 py-2">
              <div className="flex items-center gap-2.5 text-sm text-ps-text">
                <CreditCard className="h-3.5 w-3.5 text-ps-accent" />
                {planLabel ?? "—"} plan
              </div>
              <Link
                href="/billing"
                className="text-[11px] font-medium text-ps-accent hover:underline"
              >
                Billing & usage
              </Link>
            </div>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/profile")}
            >
              <User className="h-3.5 w-3.5 text-ps-accent" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/profile#connected-accounts")}
            >
              <Plug className="h-3.5 w-3.5 text-ps-accent" />
              Connected accounts
            </DropdownMenuItem>

            {/* Theme */}
            {mounted && (
              <div className="flex items-center gap-1.5 rounded-md px-2 py-2">
                <span className="flex-1 text-xs font-medium text-ps-muted">Theme</span>
                {(["light", "dark", "system"] as const).map((t) => {
                  const Icon = t === "light" ? Sun : t === "dark" ? Moon : Monitor;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      title={t}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        theme === t
                          ? "bg-ps-accent-light text-ps-accent"
                          : "text-ps-secondary hover:bg-ps-surface"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </button>
                  );
                })}
              </div>
            )}

            <DropdownMenuSeparator className="my-1.5 bg-ps-border" />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onSelect={(e) => { e.preventDefault(); setHelpOpen(true); }}
            >
              <HelpCircle className="h-3.5 w-3.5 text-ps-accent" />
              Get help
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1.5 bg-ps-border" />

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
              onSelect={(e) => { e.preventDefault(); setSignOutOpen(true); }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Get Help dialog */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm border-ps-border bg-ps-bg">
          <DialogHeader>
            <DialogTitle className="text-ps-text">Get help</DialogTitle>
            <DialogDescription className="text-ps-muted">
              Reach out to us or report an issue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 rounded-xl border border-ps-border bg-ps-card px-4 py-3">
              <Mail className="h-4 w-4 shrink-0 text-ps-accent" />
              <span className="flex-1 text-sm text-ps-text">{SUPPORT_EMAIL}</span>
              <button
                onClick={handleCopyEmail}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-ps-secondary transition-colors hover:bg-ps-surface"
                title="Copy email"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=SuperAlien%20support%20request`}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ps-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ps-accent-dark"
            >
              <Mail className="h-4 w-4" />
              Send support email
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign out confirmation dialog */}
      <Dialog open={signOutOpen} onOpenChange={setSignOutOpen}>
        <DialogContent className="max-w-sm border-ps-border bg-ps-bg">
          <DialogHeader>
            <DialogTitle className="text-ps-text">Sign out of SuperAlien?</DialogTitle>
            <DialogDescription className="text-ps-muted">
              You&apos;ll need to sign in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setSignOutOpen(false)}
              className="flex-1 rounded-xl border border-ps-border px-4 py-2.5 text-sm font-medium text-ps-secondary transition-colors hover:bg-ps-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Sign out
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
