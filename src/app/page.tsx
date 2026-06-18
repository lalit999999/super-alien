import Image from "next/image";
import Link from "next/link";
import {
  Mail,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Brain,
  Clock,
  Shield,
} from "lucide-react";
import { Pricing } from "@/components/Pricing";

function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-ps-border bg-ps-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <Image
            src="/Logo.png"
            alt="SuperAlien"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-[15px] font-semibold text-ps-text">SuperAlien</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-ps-secondary hover:text-ps-accent transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-ps-secondary hover:text-ps-accent transition-colors">
            How it works
          </a>
          <a href="#pricing" className="text-sm font-medium text-ps-secondary hover:text-ps-accent transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-ps-secondary hover:text-ps-text transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-ps-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ps-accent-dark"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24">
      {/* Subtle warm gradient background */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-ps-accent-light) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-ps-border bg-ps-surface px-3 py-1 text-xs font-medium text-ps-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-ps-accent" />
          AI-powered Gmail & Calendar
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-ps-text sm:text-6xl lg:text-7xl">
          Your Personal AI{" "}
          <span className="text-ps-accent">Executive Assistant</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-ps-secondary">
          SuperAlien reads your inbox, tracks your calendar, and handles the
          busywork — drafting replies, flagging what's urgent, and keeping
          your day straight — so you're managing outcomes, not email.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-xl bg-ps-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ps-accent-dark hover:shadow-md"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 rounded-xl border border-ps-border bg-ps-card px-6 py-3 text-sm font-semibold text-ps-text transition-colors hover:bg-ps-surface"
          >
            View demo
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-ps-muted">
          No credit card required · Connect in 30 seconds
        </p>

        {/* Product preview */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-ps-border bg-ps-surface shadow-xl">
          <div className="flex h-8 items-center gap-2 border-b border-ps-border bg-ps-surface-2 px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-ps-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-ps-border" />
            <div className="h-2.5 w-2.5 rounded-full bg-ps-border" />
          </div>
          <div className="flex h-[400px]">
            {/* Sidebar mock */}
            <div className="w-[180px] shrink-0 border-r border-ps-border bg-ps-surface p-3">
              <div className="mb-4 flex items-center gap-2 px-2">
                <div className="h-5 w-5 rounded bg-ps-accent" />
                <div className="h-3 w-20 rounded bg-ps-border" />
              </div>
              {["Dashboard", "Inbox", "Calendar", "Chat"].map((item, i) => (
                <div
                  key={item}
                  className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 ${
                    i === 1
                      ? "bg-ps-accent"
                      : "hover:bg-ps-surface-2"
                  }`}
                >
                  <div
                    className={`h-3 w-3 rounded ${
                      i === 1 ? "bg-white/60" : "bg-ps-border"
                    }`}
                  />
                  <div
                    className={`h-2.5 w-14 rounded ${
                      i === 1 ? "bg-white/60" : "bg-ps-border"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Email list mock */}
            <div className="w-[260px] shrink-0 border-r border-ps-border bg-ps-card p-3">
              <div className="mb-3 h-7 rounded-lg bg-ps-surface px-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-ps-border" />
                <div className="h-2 w-24 rounded bg-ps-border" />
              </div>
              {[
                { unread: true, colorClass: "bg-ps-accent" },
                { unread: true, colorClass: "bg-ps-secondary" },
                { unread: false, colorClass: "bg-ps-muted" },
                { unread: false, colorClass: "bg-ps-surface-2" },
                { unread: false, colorClass: "bg-ps-border" },
              ].map((email, i) => (
                <div
                  key={i}
                  className={`mb-1 flex gap-2.5 rounded-lg px-2 py-2 ${
                    i === 0 ? "bg-ps-accent-light" : ""
                  }`}
                >
                  <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-full ${email.colorClass}`} />
                  <div className="flex-1 space-y-1">
                    <div
                      className={`h-2.5 w-20 rounded ${
                        email.unread ? "bg-ps-text/30" : "bg-ps-border"
                      }`}
                    />
                    <div className="h-2 w-32 rounded bg-ps-border" />
                    <div className="h-2 w-28 rounded bg-ps-surface-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Email detail mock */}
            <div className="flex-1 bg-ps-card p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-48 rounded bg-ps-text/20" />
                  <div className="h-2.5 w-32 rounded bg-ps-border" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-14 rounded-lg bg-ps-accent-light border border-ps-border" />
                  <div className="h-6 w-14 rounded-lg bg-ps-accent" />
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="h-2.5 w-full rounded bg-ps-surface-2" />
                <div className="h-2.5 w-5/6 rounded bg-ps-surface-2" />
                <div className="h-2.5 w-4/6 rounded bg-ps-surface-2" />
              </div>
              {/* AI Summary box */}
              <div className="rounded-xl border border-ps-border bg-ps-accent-light p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-ps-accent" />
                  <div className="h-2.5 w-16 rounded bg-ps-accent/40" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded bg-ps-border" />
                  <div className="h-2 w-4/5 rounded bg-ps-border" />
                  <div className="h-2 w-3/5 rounded bg-ps-border" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Brain,
    title: "AI Inbox",
    description:
      "Every email gets classified and prioritized the moment it lands — so the one thing that matters doesn't get buried under twelve that don't.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    description:
      "Your Google Calendar synced and AI-aware: it catches double-bookings, schedules around your real availability, and tells you what's next before you have to ask.",
  },
  {
    icon: MessageSquare,
    title: "Agent Chat",
    description:
      'Type it like you\'d ask a person — "draft a reply to John," "show me finance emails from last week" — and get the answer, not a search results page.',
  },
  {
    icon: Clock,
    title: "Zero Inbox",
    description:
      "Routine email — replies, filing, follow-ups — handled automatically, so your inbox reflects decisions made, not messages piling up.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-ps-surface">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-ps-text sm:text-4xl">
            Built for how you actually work
          </h2>
          <p className="mt-3 text-ps-secondary">
            AI features designed around your real workflow, not a generic email client.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-ps-border bg-ps-bg p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ps-accent-light">
                <Icon className="h-5 w-5 text-ps-accent" />
              </div>
              <h3 className="mb-2 font-semibold text-ps-text">{title}</h3>
              <p className="text-sm leading-relaxed text-ps-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    step: "01",
    title: "Connect Gmail",
    description: "Link your Google account in one click. SuperAlien syncs your inbox in seconds.",
    icon: Mail,
  },
  {
    step: "02",
    title: "Sync Calendar",
    description: "Connect Google Calendar and see all your meetings, deadlines, and events in one place.",
    icon: Calendar,
  },
  {
    step: "03",
    title: "Chat with AI",
    description: 'Ask anything in plain language — "what did I miss today," "schedule a call with the team" — and get it done, not just answered.',
    icon: MessageSquare,
  },
  {
    step: "04",
    title: "Get Work Done",
    description: "Let AI handle the inbox while you focus on the work only you can do.",
    icon: CheckCircle,
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-ps-bg">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-ps-text sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-ps-secondary">
            No complex setup. No learning curve. Just connect and go.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, title, description, icon: Icon }, i) => (
            <div key={step} className="relative flex flex-col">
              {i < steps.length - 1 && (
                <div className="absolute left-8 top-5 hidden h-px w-full bg-ps-border lg:block" />
              )}
              <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ps-border bg-ps-bg">
                <Icon className="h-4.5 w-4.5 text-ps-accent" />
              </div>
              <span className="mb-1 text-xs font-semibold tracking-widest text-ps-accent">
                {step}
              </span>
              <h3 className="mb-2 font-semibold text-ps-text">{title}</h3>
              <p className="text-sm leading-relaxed text-ps-secondary">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 bg-ps-text dark:bg-ps-surface-2">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold text-ps-bg dark:text-ps-text sm:text-4xl">
          Stop managing email.
          <br />
          <span className="text-ps-accent">Start delegating it.</span>
        </h2>
        <p className="mt-4 text-ps-muted text-lg">
          Your inbox doesn't need more willpower from you. It needs an assistant.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-xl bg-ps-accent px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-ps-accent-dark"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-ps-border px-8 py-3.5 text-sm font-semibold text-ps-bg dark:text-ps-text transition-colors hover:bg-ps-secondary/20"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-xs text-ps-muted">
          No credit card · Cancel anytime · GDPR compliant
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ps-border bg-ps-surface/50 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3 md:grid-cols-5">
        <div>
          <div className="mb-3 flex items-center gap-2.5">
            <Image src="/Logo.png" alt="SuperAlien" width={24} height={24} className="rounded-lg" />
            <span className="font-semibold text-ps-text">SuperAlien</span>
          </div>
          <p className="text-xs text-ps-secondary">
            Your AI-powered executive assistant for Gmail and Calendar.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ps-text">Product</h4>
          <ul className="space-y-2 text-xs text-ps-secondary">
            <li><a href="#features" className="transition-colors hover:text-ps-text">Features</a></li>
            <li><a href="#how-it-works" className="transition-colors hover:text-ps-text">How it works</a></li>
            <li><a href="#pricing" className="transition-colors hover:text-ps-text">Pricing</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ps-text">Company</h4>
          <ul className="space-y-2 text-xs text-ps-secondary">
            <li><a href="/sign-up" className="transition-colors hover:text-ps-text">Sign Up</a></li>
            <li><a href="/sign-in" className="transition-colors hover:text-ps-text">Sign In</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ps-text">Legal</h4>
          <ul className="space-y-2 text-xs text-ps-secondary">
            <li><a href="/legal/terms" className="transition-colors hover:text-ps-text">Terms</a></li>
            <li><a href="/legal/privacy" className="transition-colors hover:text-ps-text">Privacy</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-ps-text">Contact</h4>
          <ul className="space-y-2 text-xs text-ps-secondary">
            <li>
              <a href="mailto:support@superalien.io" className="transition-colors hover:text-ps-text">
                support@superalien.io
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ps-border px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-ps-muted">
            © {new Date().getFullYear()} SuperAlien. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-ps-muted">
            <Shield className="h-3 w-3" />
            <span>SOC 2 Type II · GDPR · End-to-end encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ps-bg">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
