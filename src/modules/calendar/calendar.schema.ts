import { z } from "zod";
import { CALENDAR_DEFAULT_LIST_LIMIT, CALENDAR_MAX_LIST_LIMIT } from "./calendar.constants";

export const calendarListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(CALENDAR_MAX_LIST_LIMIT)
    .default(CALENDAR_DEFAULT_LIST_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type CalendarListQuery = z.infer<typeof calendarListQuerySchema>;

export const calendarSyncBodySchema = z.object({
  maxResults: z.number().int().positive().max(2500).optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
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
});

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
