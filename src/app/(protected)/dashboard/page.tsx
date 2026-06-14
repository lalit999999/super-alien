import Link from "next/link";
import { Mail, CalendarDays, Clock, Inbox, Bot, ArrowRight, TrendingUp, Zap } from "lucide-react";

const stats = [
  {
    label: "Unread Emails",
    value: "—",
    icon: Mail,
    href: "/inbox",
    color: "bg-[#FEF0E7]",
    iconColor: "text-[#BE5103]",
  },
  {
    label: "Important",
    value: "—",
    icon: TrendingUp,
    href: "/inbox",
    color: "bg-[#FEF0E7]",
    iconColor: "text-[#BE5103]",
  },
  {
    label: "Meetings Today",
    value: "—",
    icon: CalendarDays,
    href: "/calendar",
    color: "bg-[#F8F2EA]",
    iconColor: "text-[#544823]",
  },
  {
    label: "Upcoming Events",
    value: "—",
    icon: Clock,
    href: "/calendar",
    color: "bg-[#F8F2EA]",
    iconColor: "text-[#544823]",
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
    <div className="min-h-full bg-[#FFFDF8] px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#332216]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#544823]">
          Your AI-powered productivity overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, color, iconColor }) => (
          <Link
            key={label}
            href={href}
            className="group flex items-start gap-4 rounded-2xl border border-[#E7D8C8] bg-white p-5 transition-shadow hover:shadow-md"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#8C4C1F]">{label}</p>
              <p className="mt-0.5 text-2xl font-semibold text-[#332216]">{value}</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-[#E7D8C8] transition-colors group-hover:text-[#BE5103]" />
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="rounded-2xl border border-[#E7D8C8] bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-[#332216]">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map(({ label, description, icon: Icon, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex items-center gap-3 rounded-xl border border-[#E7D8C8] p-3 transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8F2EA]">
                  <Icon className="h-4 w-4 text-[#BE5103]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#332216]">{label}</p>
                  <p className="truncate text-xs text-[#8C4C1F]">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#E7D8C8] group-hover:text-[#BE5103]" />
              </Link>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 rounded-2xl border border-[#E7D8C8] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FEF0E7]">
              <Zap className="h-3.5 w-3.5 text-[#BE5103]" />
            </div>
            <h2 className="text-sm font-semibold text-[#332216]">AI Insights</h2>
          </div>
          <div className="space-y-3">
            {aiInsights.map(({ title, body, badge, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex gap-4 rounded-xl border border-[#E7D8C8] p-4 transition-colors hover:border-[#BE5103]/30 hover:bg-[#FEF0E7]"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-[#FEF0E7] px-2 py-0.5 text-[11px] font-medium text-[#BE5103] border border-[#E7D8C8]">
                      {badge}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#332216]">{title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#544823]">{body}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#E7D8C8] transition-colors group-hover:text-[#BE5103]" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Getting started banner */}
      <div className="mt-6 rounded-2xl bg-[#332216] p-6 flex items-center justify-between gap-6">
        <div>
          <h3 className="font-semibold text-[#FFFDF8]">Get the most out of SuperAlien</h3>
          <p className="mt-1 text-sm text-[#8C4C1F]">
            Sync your inbox and start chatting with your AI agent to unlock all features.
          </p>
        </div>
        <Link
          href="/chat"
          className="shrink-0 rounded-xl bg-[#BE5103] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8C4C1F]"
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
