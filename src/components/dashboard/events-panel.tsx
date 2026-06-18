"use client";

import { useState, useEffect } from "react";
import { Clock, Users, X } from "lucide-react";
import { isToday, isTomorrow, isThisWeek, isUpcoming } from "@/lib/date-buckets";
import type { DashboardCalendarEvent } from "./types";

const TABS = ["Today", "Tomorrow", "This Week", "Upcoming"] as const;
type Tab = (typeof TABS)[number];

type Props = {
  override: { date: Date; events: DashboardCalendarEvent[] } | null;
  onClearOverride: () => void;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function filterEvents(events: DashboardCalendarEvent[], tab: Tab): DashboardCalendarEvent[] {
  return events.filter((e) => {
    if (tab === "Today") return isToday(e.startTime);
    if (tab === "Tomorrow") return isTomorrow(e.startTime);
    if (tab === "This Week") return isThisWeek(e.startTime);
    return isUpcoming(e.startTime);
  });
}

function EventCard({ event }: { event: DashboardCalendarEvent }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-ps-text">{event.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ps-muted">
          {event.isAllDay ? (
            <span>All day</span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(event.startTime)}
            </span>
          )}
          {(event.attendees?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.attendees!.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventsPanel({ override, onClearOverride }: Props) {
  const [events, setEvents] = useState<DashboardCalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Today");

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);

    fetch(`/api/calendar?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.events) setEvents(j.data.events);
      })
      .catch(() => {});
  }, []);

  if (override) {
    const label = override.date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return (
      <div className="rounded-2xl border border-ps-border bg-ps-card">
        <div className="flex items-center justify-between border-b border-ps-border px-4 py-2.5">
          <span className="text-xs font-semibold text-ps-text">Events on {label}</span>
          <button
            onClick={onClearOverride}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-ps-muted transition-colors hover:bg-ps-surface hover:text-ps-secondary"
          >
            <X className="h-3 w-3" />
            Back to today
          </button>
        </div>
        <div className="divide-y divide-ps-border">
          {override.events.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-ps-muted">No events on this day</p>
          ) : (
            override.events.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </div>
    );
  }

  const filtered = filterEvents(events, activeTab);

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card">
      <div className="flex gap-0.5 overflow-x-auto border-b border-ps-border p-1.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "bg-ps-surface text-ps-text shadow-sm"
                : "text-ps-muted hover:text-ps-secondary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="divide-y divide-ps-border">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-ps-muted">No events</p>
        ) : (
          filtered.map((event) => <EventCard key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
