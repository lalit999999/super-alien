"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CalendarDays, Clock, Users, Plus, ChevronLeft, ChevronRight } from "lucide-react";

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

function isToday(date: string): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function isTomorrow(date: string): boolean {
  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  );
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
  return (
    <div className={`rounded-2xl border p-5 transition-shadow hover:shadow-sm ${today ? "border-[#BE5103]/30 bg-[#FEF0E7]" : "border-[#E7D8C8] bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[#332216]">{event.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#8C4C1F]">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatEventTime(event.startTime, event.endTime)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {event.location}
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
            <p className="mt-2 text-xs leading-relaxed text-[#544823] line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
        {today && (
          <span className="shrink-0 rounded-full bg-[#BE5103] px-2.5 py-0.5 text-[11px] font-semibold text-white">
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
                className="rounded-full border border-[#E7D8C8] bg-[#F8F2EA] px-2 py-0.5 text-[11px] text-[#544823]"
              >
                {label}
              </span>
            );
          })}
          {event.attendees!.length > 5 && (
            <span className="rounded-full border border-[#E7D8C8] bg-[#F8F2EA] px-2 py-0.5 text-[11px] text-[#8C4C1F]">
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
          <div className="mb-3 h-4 w-24 animate-pulse rounded bg-[#E7D8C8]" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="rounded-2xl border border-[#E7D8C8] bg-white p-5">
                <div className="h-4 w-48 animate-pulse rounded bg-[#E7D8C8]" />
                <div className="mt-3 flex gap-3">
                  <div className="h-3 w-28 animate-pulse rounded bg-[#EFE5D5]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[#EFE5D5]" />
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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>("Today");

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
    const start = new Date(ev.startTime);
    const now = new Date();
    if (activeView === "Today") return isToday(ev.startTime);
    if (activeView === "Tomorrow") return isTomorrow(ev.startTime);
    if (activeView === "This Week") {
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      return start >= now && start <= endOfWeek;
    }
    return start >= now;
  });

  const grouped = groupEventsByDay(filteredEvents);
  const todayCount = events.filter((e) => isToday(e.startTime)).length;

  return (
    <div className="min-h-full bg-[#FFFDF8] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#332216]">Calendar</h1>
          <p className="mt-1 text-sm text-[#544823]">
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg bg-[#BE5103] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#8C4C1F] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync"}
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-[#E7D8C8] bg-white px-3 py-2 text-xs font-medium text-[#544823] transition-colors hover:bg-[#F8F2EA]">
            <Plus className="h-3.5 w-3.5" />
            New event
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Today", value: todayCount, sub: "meetings" },
          { label: "This week", value: events.filter((e) => { const d = new Date(e.startTime); const now = new Date(); const end = new Date(); end.setDate(now.getDate() + 7); return d >= now && d <= end; }).length, sub: "upcoming" },
          { label: "Total synced", value: events.length, sub: "events" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-2xl border border-[#E7D8C8] bg-white p-4">
            <p className="text-xs text-[#8C4C1F]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#332216]">{value}</p>
            <p className="text-xs text-[#8C4C1F]">{sub}</p>
          </div>
        ))}
      </div>

      {/* View tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-[#E7D8C8] bg-[#F8F2EA] p-1 w-fit">
        {VIEWS.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              activeView === view
                ? "bg-white text-[#332216] shadow-sm"
                : "text-[#544823] hover:text-[#332216]"
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Events */}
      {loading ? (
        <LoadingSkeleton />
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F8F2EA]">
            <CalendarDays className="h-6 w-6 text-[#BE5103]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#332216]">No events for {activeView.toLowerCase()}</p>
            <p className="mt-1 text-xs text-[#8C4C1F]">Sync your calendar to see upcoming meetings</p>
          </div>
          <button
            onClick={handleSync}
            className="rounded-lg bg-[#BE5103] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#8C4C1F]"
          >
            Sync calendar
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([day, dayEvents]) => (
            <div key={day}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#332216]">
                  {getDayLabel(dayEvents[0].startTime)}
                </h2>
                <span className="rounded-full bg-[#F8F2EA] px-2 py-0.5 text-[11px] font-medium text-[#8C4C1F] border border-[#E7D8C8]">
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
    </div>
  );
}
