"use client";

import { useState, useEffect } from "react";
import { Clock, Users } from "lucide-react";
import { isToday, isTomorrow, isThisWeek, isUpcoming } from "@/lib/date-buckets";

type Attendee = { email?: string; displayName?: string };

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees?: Attendee[] | null;
  isAllDay?: boolean;
};

const TABS = ["Today", "Tomorrow", "This Week", "Upcoming"] as const;
type Tab = (typeof TABS)[number];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function filterEvents(events: CalendarEvent[], tab: Tab): CalendarEvent[] {
  return events.filter((e) => {
    if (tab === "Today") return isToday(e.startTime);
    if (tab === "Tomorrow") return isTomorrow(e.startTime);
    if (tab === "This Week") return isThisWeek(e.startTime);
    return isUpcoming(e.startTime);
  });
}

export function EventsPanel() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  const filtered = filterEvents(events, activeTab);

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card">
      {/* Tab bar */}
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
          filtered.map((event) => (
            <div key={event.id} className="flex items-start gap-3 px-4 py-3">
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
          ))
        )}
      </div>
    </div>
  );
}
