"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  CalendarDays,
  Clock,
  Inbox,
  Bot,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { CalendarSidebar } from "@/components/dashboard/calendar-sidebar";
import { ImportantEmails } from "@/components/dashboard/important-emails";
import { TodoList } from "@/components/dashboard/todo-list";
import { Spinner } from "@/components/loaders/spinner";

type Stat = {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  iconColor: string;
};

const INITIAL_STATS: Stat[] = [
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stat[]>(INITIAL_STATS);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const { unreadCount, importantCount, meetingsToday, upcomingEvents } =
            data.data.stats;
          setStats((prev) =>
            prev.map((stat) => {
              if (stat.label === "Unread Emails") return { ...stat, value: unreadCount };
              if (stat.label === "Important") return { ...stat, value: importantCount };
              if (stat.label === "Meetings Today") return { ...stat, value: meetingsToday };
              if (stat.label === "Upcoming Events") return { ...stat, value: upcomingEvents };
              return stat;
            })
          );
        }
      })
      .catch((err) => console.error("Failed to fetch stats:", err))
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ps-secondary">
          Your AI-powered productivity overview
        </p>
      </div>

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
              <p className="mt-0.5 text-xl font-semibold text-ps-text sm:text-2xl">
                {loadingStats ? <Spinner size="sm" /> : value}
              </p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ps-border transition-colors group-hover:text-ps-accent" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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

          <ImportantEmails />
          <TodoList />
        </div>

        <aside className="space-y-4 sm:space-y-6 lg:sticky lg:top-20 lg:self-start">
          <CalendarSidebar />
        </aside>
      </div>

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
