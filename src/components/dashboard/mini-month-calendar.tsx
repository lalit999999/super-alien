"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarEvent = {
  id: string;
  startTime: string;
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MiniMonthCalendar() {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const from = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const to = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);

    fetch(
      `/api/calendar?from=${from.toISOString()}&to=${to.toISOString()}`
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.events) setEvents(j.data.events);
      })
      .catch(() => {});
  }, [viewDate]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const eventDays = new Set(
    events.map((e) => {
      const d = new Date(e.startTime);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  const monthLabel = viewDate.toLocaleDateString([], { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-ps-border bg-ps-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-ps-text">{monthLabel}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ps-secondary transition-colors hover:bg-ps-surface"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextMonth}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ps-secondary transition-colors hover:bg-ps-surface"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 text-center text-[10px] font-medium text-ps-muted">
            {d}
          </div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const cellDate = new Date(year, month, day);
          const isToday = isSameDay(cellDate, today);
          const hasEvent = eventDays.has(`${year}-${month}-${day}`);

          return (
            <div key={day} className="flex flex-col items-center py-0.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                  isToday
                    ? "bg-ps-accent text-white"
                    : "text-ps-secondary hover:bg-ps-surface"
                }`}
              >
                {day}
              </span>
              {hasEvent && (
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    isToday ? "bg-white" : "bg-ps-accent"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
