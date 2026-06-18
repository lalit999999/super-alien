"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CalendarDays, Clock, Users, Plus } from "lucide-react";
import { OnboardingEmptyState } from "@/components/onboarding/empty-state";
import { NewEventDialog } from "@/components/calendar/new-event-dialog";
import { isToday, isTomorrow } from "@/lib/date-buckets";

// ─── Color palette ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  "1":  "#7986CB",
  "2":  "#33B679",
  "3":  "#8E24AA",
  "4":  "#E67C73",
  "5":  "#F6BF26",
  "6":  "#F4511E",
  "7":  "#039BE5",
  "8":  "#616161",
  "9":  "#3F51B5",
  "10": "#0B8043",
  "11": "#D50000",
};

function getEventColor(colorId?: string | null): string {
  return COLOR_MAP[colorId ?? "7"] ?? COLOR_MAP["7"];
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type Attendee = {
  email?: string;
  displayName?: string;
  responseStatus?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  description: string | null;
  location: string | null;
  attendees: Attendee[] | null;
  colorId?: string | null;
  isAllDay?: boolean;
};

type ApiResponse =
  | { success: true; data: { events: CalendarEvent[] } }
  | { success: false; error: string; code: string };

type SyncResponse =
  | { success: true; data: { synced: number } }
  | { success: false; error: string; code: string };

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatEventTime(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${fmt(s)} – ${fmt(e)}`;
}

function getDayLabel(date: string): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return new Date(date).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function groupEventsByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const day = new Date(ev.startTime).toDateString();
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(ev);
  }
  return map;
}

// ─── Event card ────────────────────────────────────────────────────────────────

function EventCard({ event }: { event: CalendarEvent }) {
  const today = isToday(event.startTime);
  const color = getEventColor(event.colorId);
  return (
    <div
      className={`rounded-2xl border p-4 transition-shadow hover:shadow-sm sm:p-5 overflow-hidden ${today ? "border-ps-accent/30 bg-ps-accent-light" : "border-ps-border bg-ps-card"}`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-ps-text">{event.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ps-muted sm:gap-3">
            {event.isAllDay ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                All day
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatEventTime(event.startTime, event.endTime)}
              </span>
            )}
            {event.location && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="truncate max-w-37.5">{event.location}</span>
              </span>
            )}
            {(event.attendees?.length ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {event.attendees!.length} attendee{event.attendees!.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-2 text-xs leading-relaxed text-ps-secondary line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        {today && (
          <span className="shrink-0 rounded-full bg-ps-accent px-2.5 py-0.5 text-[11px] font-semibold text-white">
            Today
          </span>
        )}
      </div>
      {(event.attendees?.length ?? 0) > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {event.attendees!.slice(0, 5).map((a, i) => {
            const label = a.displayName ?? (a.email?.includes("@") ? a.email.split("@")[0] : a.email) ?? "?";
            return (
              <span
                key={i}
                className="rounded-full border border-ps-border bg-ps-surface px-2 py-0.5 text-[11px] text-ps-secondary"
              >
                {label}
              </span>
            );
          })}
          {event.attendees!.length > 5 && (
            <span className="rounded-full border border-ps-border bg-ps-surface px-2 py-0.5 text-[11px] text-ps-muted">
              +{event.attendees!.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-ps-border" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="rounded-2xl border border-ps-border bg-ps-card p-5">
                <div className="h-4 w-48 animate-pulse rounded bg-ps-border" />
                <div className="mt-3 flex gap-3">
                  <div className="h-3 w-28 animate-pulse rounded bg-ps-surface-2" />
                  <div className="h-3 w-20 animate-pulse rounded bg-ps-surface-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

const VIEWS = ["Today", "Tomorrow", "This Week", "Upcoming"] as const;
type View = (typeof VIEWS)[number];

export default function CalendarPage() {
  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("Today");
  const [showNewEvent, setShowNewEvent] = useState(false);

  useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((j) => { if (j.success) setCalendarConnected(j.data.calendarConnected); })
      .catch(() => setCalendarConnected(true));
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar");
      const json: ApiResponse = await res.json();
      if (!json.success) { setError(json.error); return; }
      setEvents(json.data.events);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const json: SyncResponse = await res.json();
      if (json.success) await fetchEvents();
    } finally {
      setSyncing(false);
    }
  }

  const filteredEvents = events.filter((ev) => {
    if (activeView === "Today") return isToday(ev.startTime);
    if (activeView === "Tomorrow") return isTomorrow(ev.startTime);
    const start = new Date(ev.startTime);
    const now = new Date();
    if (activeView === "This Week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      return start >= now && start <= endOfWeek;
    }
    return start >= now;
  });

  const grouped = groupEventsByDay(filteredEvents);
  const todayCount = events.filter((e) => isToday(e.startTime)).length;

  if (calendarConnected === false) {
    return (
      <OnboardingEmptyState
        icon={<CalendarDays className="h-7 w-7 text-ps-accent" />}
        title="Google Calendar not connected"
        description="SuperAlien requires Calendar access to show your events. Connect Calendar to continue."
        action={{ label: "Connect Calendar", href: "/onboarding" }}
      />
    );
  }

  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Calendar</h1>
          <p className="mt-1 text-sm text-ps-secondary" suppressHydrationWarning>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-ps-accent px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <button
            onClick={() => setShowNewEvent(true)}
            className="flex items-center gap-1.5 rounded-lg border border-ps-border bg-ps-card px-3 py-2 text-xs font-medium text-ps-secondary transition-colors hover:bg-ps-surface"
          >
            <Plus className="h-3.5 w-3.5" />
            New event
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid gap-3 grid-cols-3 sm:gap-4">
        {[
          { label: "Today", value: todayCount, sub: "meetings" },
          { label: "This week", value: events.filter((e) => { const d = new Date(e.startTime); const now = new Date(); const end = new Date(); end.setDate(now.getDate() + 7); return d >= now && d <= end; }).length, sub: "upcoming" },
          { label: "Total synced", value: events.length, sub: "events" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-ps-border bg-ps-card p-3 sm:p-4">
            <p className="text-[11px] text-ps-muted sm:text-xs">{label}</p>
            <p className="mt-1 text-xl font-semibold text-ps-text sm:text-2xl">{value}</p>
            <p className="text-[11px] text-ps-muted sm:text-xs">{sub}</p>
          </div>
        ))}
      </div>

      {/* View tabs — scrollable on mobile */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-ps-border bg-ps-surface p-1 overflow-x-auto scrollbar-hide">
        {VIEWS.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 ${
              activeView === view
                ? "bg-ps-card text-ps-text shadow-sm"
                : "text-ps-secondary hover:text-ps-text"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Events */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center sm:py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ps-surface">
            <CalendarDays className="h-6 w-6 text-ps-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-ps-text">No events for {activeView.toLowerCase()}</p>
            <p className="mt-1 text-xs text-ps-muted">Sync your calendar to see upcoming meetings</p>
          </div>
          <button
            onClick={handleSync}
            className="rounded-lg bg-ps-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-ps-accent-dark"
          >
            Sync calendar
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ps-text">
                  {getDayLabel(dayEvents[0].startTime)}
                </h2>
                <span className="rounded-full bg-ps-surface px-2 py-0.5 text-[11px] font-medium text-ps-muted border border-ps-border">
                  {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NewEventDialog
        open={showNewEvent}
        onClose={() => setShowNewEvent(false)}
        onCreated={fetchEvents}
      />
    </div>
  );
}
