"use client";

import { useState } from "react";
import { MiniMonthCalendar } from "./mini-month-calendar";
import { EventsPanel } from "./events-panel";
import type { DashboardCalendarEvent } from "./types";

export function CalendarSidebar() {
  const [override, setOverride] = useState<{
    date: Date;
    events: DashboardCalendarEvent[];
  } | null>(null);

  return (
    <>
      <MiniMonthCalendar
        selectedDate={override?.date ?? null}
        onSelectDate={(date, events) => setOverride({ date, events })}
      />
      <EventsPanel
        override={override}
        onClearOverride={() => setOverride(null)}
      />
    </>
  );
}
