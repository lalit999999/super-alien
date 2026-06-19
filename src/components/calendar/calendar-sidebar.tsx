"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COLOR_MAP } from "@/app/(protected)/calendar/page";

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

type View = "Monthly" | "Weekly" | "Daily";

function getEventColor(colorId?: string | null): string {
  return COLOR_MAP[colorId ?? "7"] ?? COLOR_MAP["7"];
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Day event list ────────────────────────────────────────────────────────────

function DayEventList({ events, date }: { events: CalendarEvent[]; date: Date }) {
  const dayEvents = useMemo(
    () =>
      events
        .filter((e) => sameDay(new Date(e.startTime), date))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [events, date]
  );

  if (dayEvents.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-ps-muted">No events</p>
    );
  }

  return (
    <div className="space-y-1.5 overflow-y-auto max-h-48 pr-0.5">
      {dayEvents.map((ev) => (
        <div
          key={ev.id}
          className="flex items-start gap-2 rounded-lg border border-ps-border bg-ps-surface px-2 py-1.5"
          style={{ borderLeft: `3px solid ${getEventColor(ev.colorId)}` }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-ps-text">{ev.title}</p>
            <p className="text-[11px] text-ps-muted">
              {ev.isAllDay ? "All day" : fmtTime(ev.startTime)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Monthly view ──────────────────────────────────────────────────────────────

function MonthlyView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // offset so week starts on Monday (0=Mon…6=Sun)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const cells = Math.ceil(totalCells / 7) * 7;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const k = toDateKey(new Date(ev.startTime));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return map;
  }, [events]);

  const monthName = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-ps-text">{monthName}</span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="text-[10px] font-medium text-ps-muted py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: cells }).map((_, i) => {
          const dayOffset = i - startOffset;
          if (dayOffset < 0 || dayOffset >= lastDay.getDate()) {
            return <div key={i} />;
          }
          const date = new Date(year, month, dayOffset + 1);
          const isToday = sameDay(date, today);
          const isSel = sameDay(date, selected);
          const key = toDateKey(date);
          const dayEvs = eventsByDay.get(key) ?? [];
          const hasEvents = dayEvs.length > 0;
          const dotColor = hasEvents ? getEventColor(dayEvs[0].colorId) : undefined;

          return (
            <button
              key={i}
              onClick={() => setSelected(date)}
              className={`relative mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                isToday
                  ? "bg-ps-accent text-white font-semibold"
                  : isSel
                  ? "bg-ps-accent-light text-ps-accent border border-ps-accent font-medium"
                  : "text-ps-text hover:bg-ps-surface"
              }`}
            >
              {dayOffset + 1}
              {hasEvents && !isToday && !isSel && (
                <span
                  className="absolute bottom-1 h-[3px] w-[3px] rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="mt-1 border-t border-ps-border pt-3">
        <p className="mb-2 text-[11px] font-semibold text-ps-muted uppercase tracking-wide">
          {selected.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
        <DayEventList events={events} date={selected} />
      </div>
    </div>
  );
}

// ─── Weekly view ───────────────────────────────────────────────────────────────

function WeeklyView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();

  // Get the Monday of a given date's week
  function getMonday(d: Date) {
    const day = (d.getDay() + 6) % 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - day);
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  const [weekStart, setWeekStart] = useState(() => getMonday(today));
  const [selected, setSelected] = useState(today);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const rangeLabel = `${weekDays[0].toLocaleDateString([], { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString([], { month: "short", day: "numeric" })}`;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const k = toDateKey(new Date(ev.startTime));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    }
    return map;
  }, [events]);

  const DAY_ABBR = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="flex flex-col gap-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const w = new Date(weekStart); w.setDate(w.getDate() - 7); setWeekStart(w); }}
          className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-ps-text">{rangeLabel}</span>
        <button
          onClick={() => { const w = new Date(weekStart); w.setDate(w.getDate() + 7); setWeekStart(w); }}
          className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((date, i) => {
          const key = toDateKey(date);
          const dayEvs = (eventsByDay.get(key) ?? []).sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );
          const isToday = sameDay(date, today);
          const isSel = sameDay(date, selected);
          const hasEvents = dayEvs.length > 0;
          const dotColor = hasEvents ? getEventColor(dayEvs[0].colorId) : undefined;
          const visible = dayEvs.slice(0, 3);
          const extra = dayEvs.length - 3;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-ps-muted">{DAY_ABBR[i]}</span>
              <button
                onClick={() => setSelected(date)}
                className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                  isToday
                    ? "bg-ps-accent text-white font-semibold"
                    : isSel
                    ? "bg-ps-accent-light text-ps-accent border border-ps-accent font-medium"
                    : "text-ps-text hover:bg-ps-surface"
                }`}
              >
                {date.getDate()}
                {hasEvents && !isToday && !isSel && (
                  <span
                    className="absolute -bottom-0.5 h-[3px] w-[3px] rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                )}
              </button>
              <div className="w-full space-y-0.5">
                {visible.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded px-1 py-0.5 text-[9px] truncate leading-tight border-l-2"
                    style={{
                      borderColor: getEventColor(ev.colorId),
                      backgroundColor: `${getEventColor(ev.colorId)}18`,
                      color: "var(--ps-text)",
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
                {extra > 0 && (
                  <p className="text-[9px] text-ps-muted text-center">+{extra}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day events */}
      <div className="mt-1 border-t border-ps-border pt-3">
        <p className="mb-2 text-[11px] font-semibold text-ps-muted uppercase tracking-wide">
          {selected.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
        </p>
        <DayEventList events={events} date={selected} />
      </div>
    </div>
  );
}

// ─── Daily view ────────────────────────────────────────────────────────────────

function DailyView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [selected, setSelected] = useState(today);

  const allDayEvents = useMemo(
    () => events.filter((e) => e.isAllDay && sameDay(new Date(e.startTime), selected)),
    [events, selected]
  );

  const eventsByHour = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    for (const ev of events) {
      if (ev.isAllDay) continue;
      const d = new Date(ev.startTime);
      if (!sameDay(d, selected)) continue;
      const h = d.getHours();
      if (!map.has(h)) map.set(h, []);
      map.get(h)!.push(ev);
    }
    return map;
  }, [events, selected]);

  const dayLabel = selected.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  function prev() {
    const d = new Date(selected);
    d.setDate(d.getDate() - 1);
    setSelected(d);
  }
  function next() {
    const d = new Date(selected);
    d.setDate(d.getDate() + 1);
    setSelected(d);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-ps-text">{dayLabel}</span>
        <button onClick={next} className="rounded-lg p-1 text-ps-muted hover:bg-ps-surface">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Timeline */}
      <div className="overflow-y-auto max-h-[420px] space-y-0 pr-0.5">
        {/* All-day row */}
        {allDayEvents.length > 0 && (
          <div className="flex items-start gap-2 py-1 border-b border-ps-border">
            <span className="w-10 shrink-0 text-[10px] text-ps-muted pt-0.5">All day</span>
            <div className="flex-1 space-y-0.5">
              {allDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded px-1.5 py-0.5 text-[10px] truncate border-l-2 bg-ps-accent-light border-ps-accent text-ps-accent"
                >
                  {ev.title}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hour rows */}
        {Array.from({ length: 24 }, (_, h) => {
          const hourEvs = eventsByHour.get(h) ?? [];
          const label = `${String(h).padStart(2, "0")}:00`;
          return (
            <div key={h} className="flex items-start gap-2 h-10 border-b border-ps-border/50">
              <span className="w-10 shrink-0 text-[10px] text-ps-muted pt-1">{label}</span>
              <div className="flex-1 flex flex-wrap gap-1 pt-0.5 overflow-hidden">
                {hourEvs.map((ev) => (
                  <div
                    key={ev.id}
                    className="rounded px-1.5 py-0.5 text-[10px] truncate max-w-full border-l-2 bg-ps-accent-light border-ps-accent"
                    style={{
                      borderColor: getEventColor(ev.colorId),
                      backgroundColor: `${getEventColor(ev.colorId)}18`,
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

const VIEWS: View[] = ["Monthly", "Weekly", "Daily"];

export function CalendarSidebar({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = useState<View>("Monthly");

  return (
    <div className="sticky top-6 h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-ps-border bg-ps-card p-4">
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-ps-border bg-ps-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              view === v
                ? "bg-ps-card text-ps-text shadow-sm"
                : "text-ps-secondary hover:text-ps-text"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {view === "Monthly" && <MonthlyView events={events} />}
      {view === "Weekly" && <WeeklyView events={events} />}
      {view === "Daily" && <DailyView events={events} />}
    </div>
  );
}
