import { z } from "zod";
import { CALENDAR_DEFAULT_LIST_LIMIT, CALENDAR_MAX_LIST_LIMIT } from "./calendar.constants";

const iso8601Schema = z
  .string()
  .datetime({ message: "Must be a valid ISO 8601 date (e.g. 2026-06-17T10:00:00Z)" });

// Page-based pagination (matches Gmail pattern)
export const calendarListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(CALENDAR_MAX_LIST_LIMIT)
    .default(CALENDAR_DEFAULT_LIST_LIMIT),
});

export type CalendarListQuery = z.infer<typeof calendarListQuerySchema>;

export const calendarSyncBodySchema = z.object({
  maxResults: z.number().int().positive().max(2500).optional(),
  timeMin: iso8601Schema.optional(),
  timeMax: iso8601Schema.optional(),
});

export type CalendarSyncBody = z.infer<typeof calendarSyncBodySchema>;

const calendarDateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
  timeZone: z.string().optional(),
});

const attendeeSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  optional: z.boolean().optional(),
  responseStatus: z.enum(["needsAction", "declined", "tentative", "accepted"]).optional(),
});

export const createCalendarEventSchema = z.object({
  summary: z.string().min(1, "Event title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  start: calendarDateTimeSchema,
  end: calendarDateTimeSchema,
  attendees: z.array(attendeeSchema).optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
  conferenceDataVersion: z.number().optional(),
  colorId: z.string().optional(),
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;

export const updateCalendarEventSchema = z.object({
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  start: calendarDateTimeSchema.optional(),
  end: calendarDateTimeSchema.optional(),
  attendees: z.array(attendeeSchema).optional(),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
});

export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;
