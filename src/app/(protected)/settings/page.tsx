"use client";

import { useState, useEffect } from "react";
import { Shield, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ps-secondary">
          Appearance, notifications, and privacy
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Appearance */}
        <AppearanceSection />

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
      </div>
    </div>
  );
}
