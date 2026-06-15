"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CalendarDays, CheckCircle, Loader2, AlertCircle, Zap } from "lucide-react";
import { IntegrationCard } from "@/components/onboarding/integration-card";
import { IntegrationProgress } from "@/components/onboarding/integration-progress";

// ─── Types ─────────────────────────────────────────────────────────────────────

type IntegrationStatus = {
  gmailConnected: boolean;
  calendarConnected: boolean;
  onboardingCompleted: boolean;
  lastGmailSync: string | null;
  lastCalendarSync: string | null;
};

type Phase = "connect" | "syncing" | "done";

type SyncStep = {
  id: string;
  label: string;
  done: boolean;
};

// ─── Sync progress screen ──────────────────────────────────────────────────────

function SyncScreen({ steps }: { steps: SyncStep[] }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEF0E7] border border-[#E7D8C8]">
        <Zap className="h-8 w-8 text-[#BE5103]" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-[#332216]">Setting up your workspace</h2>
        <p className="mt-1 text-sm text-[#544823]">This only takes a moment…</p>
      </div>
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 rounded-xl border border-[#E7D8C8] bg-white px-4 py-3">
            {step.done ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#BE5103]" />
            )}
            <span className={`text-sm ${step.done ? "text-[#544823]" : "font-medium text-[#332216]"}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      <div className="flex-1 text-sm text-red-700">{message}</div>
      <button
        onClick={onDismiss}
        className="text-xs font-medium text-red-500 hover:text-red-700"
      >
        Dismiss
      </button>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingGmail, setConnectingGmail] = useState(false);
  const [connectingCalendar, setConnectingCalendar] = useState(false);
  const [phase, setPhase] = useState<Phase>("connect");
  const [error, setError] = useState<string | null>(null);
  const [syncSteps, setSyncSteps] = useState<SyncStep[]>([]);

  // Read query params set by OAuth callback
  const connected = searchParams.get("connected");
  const oauthError = searchParams.get("error");

  useEffect(() => {
    if (oauthError) {
      setError("Connection failed. Please try again.");
    }
  }, [oauthError]);

  useEffect(() => {
    fetchStatus();
  }, [connected]);

  async function fetchStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations");
      const json = await res.json();
      if (json.success) {
        const s: IntegrationStatus = json.data;
        setStatus(s);
        if (s.onboardingCompleted) {
          router.replace("/dashboard");
        }
      }
    } catch {
      setError("Failed to load integration status.");
    } finally {
      setLoading(false);
    }
  }

  function connectGmail() {
    setConnectingGmail(true);
    window.location.href = "/api/corsair/connect?plugin=gmail";
  }

  function connectCalendar() {
    setConnectingCalendar(true);
    window.location.href = "/api/corsair/connect?plugin=googlecalendar";
  }

  async function handleContinue() {
    if (!status?.gmailConnected || !status?.calendarConnected) return;

    setPhase("syncing");

    const steps: SyncStep[] = [
      { id: "gmail-connected", label: "Gmail connected", done: true },
      { id: "calendar-connected", label: "Calendar connected", done: true },
      { id: "sync-emails", label: "Syncing emails…", done: false },
      { id: "sync-calendar", label: "Syncing calendar…", done: false },
      { id: "preparing", label: "Preparing workspace…", done: false },
    ];
    setSyncSteps(steps);

    // Small delay so user sees the steps animate in
    await delay(600);

    try {
      // Sync both integrations
      const syncRes = await fetch("/api/integrations/sync", { method: "POST" });
      if (syncRes.ok) {
        setSyncSteps((prev) =>
          prev.map((s) =>
            s.id === "sync-emails" || s.id === "sync-calendar" ? { ...s, done: true } : s
          )
        );
      }

      await delay(400);

      // Mark onboarding complete
      await fetch("/api/integrations/complete", { method: "POST" });
      setSyncSteps((prev) => prev.map((s) => ({ ...s, done: true })));

      await delay(800);
      setPhase("done");

      await delay(600);
      router.replace("/dashboard");
    } catch {
      setError("Setup failed. Please try again.");
      setPhase("connect");
    }
  }

  const bothConnected = status?.gmailConnected && status?.calendarConnected;

  return (
    <div className="min-h-full bg-[#FFFDF8] px-6 py-12">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF0E7] border border-[#E7D8C8]">
            <Zap className="h-7 w-7 text-[#BE5103]" />
          </div>
          <h1 className="text-2xl font-bold text-[#332216]">Welcome to SuperAlien</h1>
          <p className="mt-2 text-sm text-[#544823]">
            Connect your workspace to unlock AI-powered email and calendar management.
          </p>
        </div>

        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        )}

        {phase === "syncing" || phase === "done" ? (
          <SyncScreen steps={syncSteps} />
        ) : loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[#BE5103]" />
          </div>
        ) : (
          <>
            {/* Integration cards */}
            <div className="space-y-4">
              <IntegrationCard
                icon={<Mail className="h-5 w-5 text-[#BE5103]" />}
                title="Gmail"
                description="Connect your inbox and email workflows. SuperAlien will read, classify, and help you manage your emails using AI."
                connected={status?.gmailConnected ?? false}
                connecting={connectingGmail}
                onConnect={connectGmail}
              />
              <IntegrationCard
                icon={<CalendarDays className="h-5 w-5 text-[#BE5103]" />}
                title="Google Calendar"
                description="Connect your events and meetings. SuperAlien will sync your schedule and provide AI-powered scheduling assistance."
                connected={status?.calendarConnected ?? false}
                connecting={connectingCalendar}
                onConnect={connectCalendar}
              />
            </div>

            {/* Progress */}
            <div className="my-8">
              <IntegrationProgress
                gmailConnected={status?.gmailConnected ?? false}
                calendarConnected={status?.calendarConnected ?? false}
              />
            </div>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              disabled={!bothConnected}
              className="w-full rounded-xl bg-[#BE5103] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8C4C1F] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {bothConnected ? "Continue to SuperAlien →" : "Connect both services to continue"}
            </button>

            <p className="mt-4 text-center text-xs text-[#8C4C1F]">
              Your data is encrypted and never sold. You can disconnect at any time from Settings.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
