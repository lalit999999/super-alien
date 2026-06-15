import Link from "next/link";
import { Mail, CalendarDays, Clock, Inbox, Bot, ArrowRight, TrendingUp, Zap } from "lucide-react";

const stats = [
  {
    label: "Unread Emails",
    value: "—",
    icon: Mail,
    href: "/inbox",
    color: "bg-ps-accent-light",
    iconColor: "text-ps-accent",
  },
  {
    label: "Important",
    value: "—",
    icon: TrendingUp,
    href: "/inbox",
    color: "bg-ps-accent-light",
    iconColor: "text-ps-accent",
  },
  {
    label: "Meetings Today",
    value: "—",
    icon: CalendarDays,
    href: "/calendar",
    color: "bg-ps-surface",
    iconColor: "text-ps-secondary",
  },
  {
    label: "Upcoming Events",
    value: "—",
    icon: Clock,
    href: "/calendar",
    color: "bg-ps-surface",
    iconColor: "text-ps-secondary",
  },
];

const quickActions = [
  {
    label: "Sync Inbox",
    description: "Pull latest emails from Gmail",
    icon: Inbox,
    href: "/inbox",
  },
  {
    label: "Ask AI Agent",
    description: "Chat with your AI assistant",
    icon: Bot,
    href: "/chat",
  },
  {
    label: "View Calendar",
    description: "See upcoming meetings",
    icon: CalendarDays,
    href: "/calendar",
  },
];

const aiInsights = [
  {
    title: "Action Required",
    body: "You have unread emails that may need replies. Open your inbox to review them.",
    badge: "Inbox",
    href: "/inbox",
  },
  {
    title: "Try the AI Agent",
    body: 'Ask your agent: "Summarize my important emails from today" to get started.',
    badge: "Chat",
    href: "/chat",
  },
  {
    title: "Calendar Sync",
    body: "Connect your Google Calendar to see meetings and get AI-powered scheduling help.",
    badge: "Calendar",
    href: "/calendar",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ps-secondary">
          Your AI-powered productivity overview
        </p>
      </div>

      {/* Stats grid — 1 col mobile, 2 col tablet, 4 col desktop */}
      <div className="mb-6 grid gap-3 sm:mb-8 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color, iconColor }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-start gap-3 rounded-2xl border border-ps-border bg-ps-card p-4 transition-shadow hover:shadow-md sm:gap-4 sm:p-5"
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${color}`}>
              <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-ps-muted sm:text-xs">{label}</p>
              <p className="mt-0.5 text-xl font-semibold text-ps-text sm:text-2xl">{value}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ps-border transition-colors group-hover:text-ps-accent" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-ps-text">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map(({ label, description, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-ps-border p-3 transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ps-surface">
                  <Icon className="h-4 w-4 text-ps-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ps-text">{label}</p>
                  <p className="truncate text-xs text-ps-muted">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ps-border group-hover:text-ps-accent" />
              </Link>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-ps-accent-light">
              <Zap className="h-3.5 w-3.5 text-ps-accent" />
            </div>
            <h2 className="text-sm font-semibold text-ps-text">AI Insights</h2>
          </div>
          <div className="space-y-3">
            {aiInsights.map(({ title, body, badge, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex gap-4 rounded-xl border border-ps-border p-4 transition-colors hover:border-ps-accent/30 hover:bg-ps-accent-light"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-ps-accent-light px-2 py-0.5 text-[11px] font-medium text-ps-accent border border-ps-border">
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ps-text">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ps-secondary">{body}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-ps-border transition-colors group-hover:text-ps-accent" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting started banner */}
      <div className="mt-4 rounded-2xl bg-ps-text p-5 flex flex-col gap-4 sm:mt-6 sm:p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div>
          <h3 className="font-semibold text-ps-bg">Get the most out of SuperAlien</h3>
          <p className="mt-1 text-sm text-ps-muted">
            Sync your inbox and start chatting with your AI agent to unlock all features.
          </p>
        </div>
        <Link
          href="/chat"
          className="shrink-0 rounded-xl bg-ps-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ps-accent-dark text-center"
        >
          Chat with AI
        </Link>
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}
