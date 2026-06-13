import { z } from "zod";

// ─── Gmail ────────────────────────────────────────────────────────────────────

export const sendEmailSchema = z.object({
  to: z.string().email("Invalid recipient email address"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  threadId: z.string().optional(),
});

export type SendEmailPayload = z.infer<typeof sendEmailSchema>;

export const getEmailsSchema = z.object({
  maxResults: z.number().int().positive().max(500).optional(),
  pageToken: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  q: z.string().optional(),
  includeSpamTrash: z.boolean().optional(),
});

export type GetEmailsPayload = z.infer<typeof getEmailsSchema>;

// ─── Calendar ─────────────────────────────────────────────────────────────────

const calendarDateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
  timeZone: z.string().optional(),
});

const attendeeSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  optional: z.boolean().optional(),
  responseStatus: z
    .enum(["needsAction", "declined", "tentative", "accepted"])
    .optional(),
});

export const createEventSchema = z.object({
  calendarId: z.string().optional(),
  event: z.object({
    summary: z.string().min(1, "Event title is required"),
    description: z.string().optional(),
    location: z.string().optional(),
    start: calendarDateTimeSchema,
    end: calendarDateTimeSchema,
    attendees: z.array(attendeeSchema).optional(),
    recurrence: z.array(z.string()).optional(),
    reminders: z
      .object({
        useDefault: z.boolean().optional(),
        overrides: z
          .array(
            z.object({
              method: z.enum(["email", "popup"]),
              minutes: z.number().int().nonnegative(),
            })
          )
          .optional(),
      })
      .optional(),
  }),
  sendUpdates: z.enum(["all", "externalOnly", "none"]).optional(),
  conferenceDataVersion: z.number().optional(),
});

export type CreateEventPayload = z.infer<typeof createEventSchema>;

export const getEventsSchema = z.object({
  calendarId: z.string().optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  timeZone: z.string().optional(),
  singleEvents: z.boolean().optional(),
  maxResults: z.number().int().positive().max(2500).optional(),
  pageToken: z.string().optional(),
  q: z.string().optional(),
  orderBy: z.enum(["startTime", "updated"]).optional(),
  showDeleted: z.boolean().optional(),
});

export type GetEventsPayload = z.infer<typeof getEventsSchema>;
