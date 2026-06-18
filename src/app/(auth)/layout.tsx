import Image from "next/image";
import { Check } from "lucide-react";

const features = [
  "AI-powered email summaries and prioritization",
  "Smart calendar scheduling and conflict detection",
  "Natural language workflows and automation",
  "AI draft generation for emails and replies",
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-ps-bg">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden lg:flex lg:w-120 xl:w-130 flex-col justify-between overflow-hidden bg-ps-text dark:bg-ps-surface-2 px-10 py-12">
        {/* Subtle dot-grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Warm gradient orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-ps-accent opacity-20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-ps-accent-dark opacity-20 blur-3xl"
        />

        {/* Top: Logo + Hero */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <Image
              src="/Logo.png"
              alt="SuperAlien"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-lg font-semibold tracking-tight text-white">
              SuperAlien
            </span>
          </div>

          <div className="mt-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ps-accent">
              AI-Powered Productivity
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white xl:text-4xl">
              Your Personal AI
              <br />
              Executive Assistant
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/50">
              Manage emails, meetings, and workflows with the power of AI.
              Built for professionals who move fast.
            </p>
          </div>

          <ul className="mt-10 space-y-3.5">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ps-accent/20">
                  <Check className="h-3 w-3 text-ps-accent" />
                </span>
                <span className="text-sm leading-snug text-white/60">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom trust badge */}
        <div className="relative z-10 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
          <div className="flex -space-x-2">
            {(["bg-ps-accent", "bg-ps-accent-dark", "bg-ps-secondary"] as const).map(
              (color, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full ring-2 ring-ps-text dark:ring-ps-surface-2 ${color}`}
                />
              )
            )}
          </div>
          <div>
            <p className="text-xs font-medium text-white">
              Trusted by productivity teams
            </p>
            <p className="text-xs text-white/40">Gmail · Google Calendar · AI</p>
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        {/* Mobile-only logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Image
            src="/Logo.png"
            alt="SuperAlien"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold tracking-tight text-ps-text">
            SuperAlien
          </span>
        </div>

        <div className="w-full max-w-100">{children}</div>
      </div>
    </div>
  );
}
