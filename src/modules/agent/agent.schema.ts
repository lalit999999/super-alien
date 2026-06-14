import { z } from "zod";

// ─── Chat request ─────────────────────────────────────────────────────────────

export const agentChatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(4000, "Prompt too long"),
});

export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;

// ─── Email read tool schemas (DB-first) ───────────────────────────────────────

export const searchEmailsArgsSchema = z.object({
  q: z.string().optional(),
  sender: z.string().optional(),
  category: z
    .enum(["IMPORTANT", "FINANCE", "MEETING", "SOCIAL", "PROMOTION", "NEWSLETTER", "ORDER", "OTHER"])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.number().int().positive().max(50).optional().default(10),
});

export const getEmailArgsSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const summarizeEmailArgsSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const classifyEmailArgsSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const generateDraftArgsSchema = z.object({
  emailId: z.string().optional(),
  tone: z.enum(["professional", "friendly", "short", "detailed"]).default("professional"),
  prompt: z.string().optional(),
  context: z.string().optional(),
});

// ─── Email action tool schemas (Corsair) ──────────────────────────────────────

export const sendEmailArgsSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  threadId: z.string().optional(),
});

// ─── Calendar read tool schemas (DB-first) ────────────────────────────────────

export const getEventsArgsSchema = z.object({
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  limit: z.number().int().positive().max(50).optional().default(10),
});

// ─── Calendar action tool schemas (Corsair) ───────────────────────────────────

export const createEventArgsSchema = z.object({
  summary: z.string().min(1, "Event title is required"),
  startDateTime: z.string().min(1, "Start time is required"),
  endDateTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timeZone: z.string().optional().default("UTC"),
});

export const updateEventArgsSchema = z.object({
  corsairEventId: z.string().min(1, "corsairEventId is required"),
  summary: z.string().optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timeZone: z.string().optional(),
});

export const deleteEventArgsSchema = z.object({
  corsairEventId: z.string().min(1, "corsairEventId is required"),
});

// ─── Composite tool schema ────────────────────────────────────────────────────

export const scheduleMeetingAndInviteArgsSchema = z.object({
  summary: z.string().min(1, "Meeting title is required"),
  startDateTime: z.string().min(1, "Start time is required"),
  endDateTime: z.string().min(1, "End time is required"),
  attendeeEmails: z.array(z.string().email()).min(1, "At least one attendee required"),
  description: z.string().optional(),
  location: z.string().optional(),
  timeZone: z.string().optional().default("UTC"),
  invitationBody: z.string().optional(),
});
