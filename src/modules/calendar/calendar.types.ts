import type { CalendarEventModel } from "@/config/generated/prisma/models/CalendarEvent";

export type DbCalendarEvent = CalendarEventModel;

export type CalendarEventUpsertInput = {
  corsairEventId: string;
  userId: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  meetingLink?: string | null;
  status?: string | null;
  organizer?: string | null;
  attendees?: unknown;
  colorId?: string | null;
  isAllDay?: boolean;
};

export type CalendarListOptions = {
  limit?: number;
  offset?: number;
};

export type CalendarSyncResult = {
  synced: number;
  skipped: number;
};
