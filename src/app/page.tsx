import Link from "next/link";
import {
  Zap,
  Mail,
  Calendar,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Brain,
  Clock,
  Shield,
  ChevronRight,
} from "lucide-react";

function Navbar() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-[#E7D8C8] bg-[#FFFDF8]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#BE5103]">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#332216]">SuperAlien</span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-[#544823] hover:text-[#BE5103] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-[#544823] hover:text-[#BE5103] transition-colors">
            How it works
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-[#544823] hover:text-[#332216] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg bg-[#BE5103] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#8C4C1F]"
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
            "radial-gradient(ellipse 80% 60% at 50% -10%, #FEF0E7 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#E7D8C8] bg-[#F8F2EA] px-3 py-1 text-xs font-medium text-[#BE5103]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#BE5103]" />
          AI-powered Gmail & Calendar
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tight text-[#332216] sm:text-6xl lg:text-7xl">
          Your Personal AI{" "}
          <span className="text-[#BE5103]">Executive Assistant</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-[#544823]">
          Manage emails, meetings, and workflows using AI. SuperAlien reads
          your inbox, understands your calendar, and acts on your behalf so
          you can focus on work that matters.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-xl bg-[#BE5103] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#8C4C1F] hover:shadow-md"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 rounded-xl border border-[#E7D8C8] bg-white px-6 py-3 text-sm font-semibold text-[#332216] transition-colors hover:bg-[#F8F2EA]"
          >
            View demo
          </Link>
        </div>

        {/* Social proof */}
        <p className="mt-8 text-xs text-[#8C4C1F]">
          No credit card required · Connect in 30 seconds
        </p>

        {/* Product preview */}
        <div className="mt-16 overflow-hidden rounded-2xl border border-[#E7D8C8] bg-[#F8F2EA] shadow-xl">
          <div className="flex h-8 items-center gap-2 border-b border-[#E7D8C8] bg-[#EFE5D5] px-4">
            <div className="h-2.5 w-2.5 rounded-full bg-[#E7D8C8]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#E7D8C8]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#E7D8C8]" />
          </div>
          <div className="flex h-[400px]">
            {/* Sidebar mock */}
            <div className="w-[180px] shrink-0 border-r border-[#E7D8C8] bg-[#F8F2EA] p-3">
              <div className="mb-4 flex items-center gap-2 px-2">
                <div className="h-5 w-5 rounded bg-[#BE5103]" />
                <div className="h-3 w-20 rounded bg-[#E7D8C8]" />
              </div>
              {["Dashboard", "Inbox", "Calendar", "Chat"].map((item, i) => (
                <div
                  key={item}
                  className={`mb-1 flex items-center gap-2 rounded-lg px-3 py-2 ${
                    i === 1
                      ? "bg-[#BE5103]"
                      : "hover:bg-[#EFE5D5]"
                  }`}
                >
                  <div
                    className={`h-3 w-3 rounded ${
                      i === 1 ? "bg-white/60" : "bg-[#E7D8C8]"
                    }`}
                  />
                  <div
                    className={`h-2.5 w-14 rounded ${
                      i === 1 ? "bg-white/60" : "bg-[#E7D8C8]"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Email list mock */}
            <div className="w-[260px] shrink-0 border-r border-[#E7D8C8] bg-white p-3">
              <div className="mb-3 h-7 rounded-lg bg-[#F8F2EA] px-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-[#E7D8C8]" />
                <div className="h-2 w-24 rounded bg-[#E7D8C8]" />
              </div>
              {[
                { unread: true, color: "bg-[#BE5103]" },
                { unread: true, color: "bg-[#544823]" },
                { unread: false, color: "bg-[#8C4C1F]" },
                { unread: false, color: "bg-[#EFE5D5]" },
                { unread: false, color: "bg-[#E7D8C8]" },
              ].map((email, i) => (
                <div
                  key={i}
                  className={`mb-1 flex gap-2.5 rounded-lg px-2 py-2 ${
                    i === 0 ? "bg-[#FEF0E7]" : ""
                  }`}
                >
                  <div className={`mt-0.5 h-7 w-7 shrink-0 rounded-full ${email.color}`} />
                  <div className="flex-1 space-y-1">
                    <div
                      className={`h-2.5 w-20 rounded ${
                        email.unread ? "bg-[#332216]" : "bg-[#E7D8C8]"
                      }`}
                    />
                    <div className="h-2 w-32 rounded bg-[#E7D8C8]" />
                    <div className="h-2 w-28 rounded bg-[#EFE5D5]" />
                  </div>
                </div>
              ))}
            </div>

            {/* Email detail mock */}
            <div className="flex-1 bg-white p-5">
              <div className="mb-4 flex items-start justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-48 rounded bg-[#332216]/20" />
                  <div className="h-2.5 w-32 rounded bg-[#E7D8C8]" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-14 rounded-lg bg-[#FEF0E7] border border-[#E7D8C8]" />
                  <div className="h-6 w-14 rounded-lg bg-[#BE5103]" />
                </div>
              </div>
              <div className="mb-4 space-y-2">
                <div className="h-2.5 w-full rounded bg-[#EFE5D5]" />
                <div className="h-2.5 w-5/6 rounded bg-[#EFE5D5]" />
                <div className="h-2.5 w-4/6 rounded bg-[#EFE5D5]" />
              </div>
              {/* AI Summary box */}
              <div className="rounded-xl border border-[#E7D8C8] bg-[#FEF0E7] p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="h-3.5 w-3.5 rounded bg-[#BE5103]" />
                  <div className="h-2.5 w-16 rounded bg-[#BE5103]/40" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded bg-[#E7D8C8]" />
                  <div className="h-2 w-4/5 rounded bg-[#E7D8C8]" />
                  <div className="h-2 w-3/5 rounded bg-[#E7D8C8]" />
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
      "Every email is classified, summarized, and prioritized automatically. Focus on what matters, skip the noise.",
  },
  {
    icon: Calendar,
    title: "Smart Calendar",
    description:
      "Sync your Google Calendar and let AI schedule meetings, surface conflicts, and remind you of what's next.",
  },
  {
    icon: MessageSquare,
    title: "Agent Chat",
    description:
      'Ask natural questions like "Draft a reply to John" or "Show me finance emails from last week" and get instant results.',
  },
  {
    icon: Clock,
    title: "Zero Inbox",
    description:
      "AI drafts replies, categorizes threads, and handles routine emails on your behalf — automatically.",
  },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-[#F8F2EA]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-[#332216] sm:text-4xl">
            Built for how you actually work
          </h2>
          <p className="mt-3 text-[#544823]">
            AI features designed around your real workflow, not a generic email client.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-[#E7D8C8] bg-[#FFFDF8] p-6 transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF0E7]">
                <Icon className="h-5 w-5 text-[#BE5103]" />
              </div>
              <h3 className="mb-2 font-semibold text-[#332216]">{title}</h3>
              <p className="text-sm leading-relaxed text-[#544823]">{description}</p>
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
    description: 'Ask the agent anything: "What did I miss today?" or "Schedule a call with the team."',
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
    <section id="how-it-works" className="py-24 bg-[#FFFDF8]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-[#332216] sm:text-4xl">
            Up and running in minutes
          </h2>
          <p className="mt-3 text-[#544823]">
            No complex setup. No learning curve. Just connect and go.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(({ step, title, description, icon: Icon }, i) => (
            <div key={step} className="relative flex flex-col">
              {i < steps.length - 1 && (
                <div className="absolute left-8 top-5 hidden h-px w-full bg-[#E7D8C8] lg:block" />
              )}
              <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#E7D8C8] bg-[#FFFDF8]">
                <Icon className="h-4.5 w-4.5 text-[#BE5103]" />
              </div>
              <span className="mb-1 text-xs font-semibold tracking-widest text-[#BE5103]">
                {step}
              </span>
              <h3 className="mb-2 font-semibold text-[#332216]">{title}</h3>
              <p className="text-sm leading-relaxed text-[#544823]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 bg-[#332216]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-semibold text-[#FFFDF8] sm:text-4xl">
          Stop managing email.
          <br />
          <span className="text-[#BE5103]">Start delegating it.</span>
        </h2>
        <p className="mt-4 text-[#8C4C1F] text-lg">
          Join professionals who use SuperAlien to reclaim their time and inbox.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 rounded-xl bg-[#BE5103] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#8C4C1F]"
          >
            Get started free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/sign-in"
            className="rounded-xl border border-[#544823] px-8 py-3.5 text-sm font-semibold text-[#FFFDF8] transition-colors hover:border-[#8C4C1F] hover:bg-[#544823]/20"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-6 text-xs text-[#544823]">
          No credit card · Cancel anytime · GDPR compliant
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#E7D8C8] bg-[#FFFDF8] py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#BE5103]">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#332216]">SuperAlien</span>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-[#544823]">
            <a href="#" className="hover:text-[#BE5103] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#BE5103] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#BE5103] transition-colors">Security</a>
            <a href="#" className="hover:text-[#BE5103] transition-colors">Contact</a>
          </div>
        </div>

        <div className="mt-8 border-t border-[#E7D8C8] pt-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-[#8C4C1F]">
            © {new Date().getFullYear()} SuperAlien. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-[#8C4C1F]">
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
    <div className="min-h-screen bg-[#FFFDF8]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  );
}
