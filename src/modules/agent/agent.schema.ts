import { z } from "zod";

export const agentChatRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(4000, "Prompt too long"),
});

export type AgentChatRequest = z.infer<typeof agentChatRequestSchema>;

export const sendEmailArgsSchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  threadId: z.string().optional(),
});

export const createEventArgsSchema = z.object({
  summary: z.string().min(1, "Event title is required"),
  startDateTime: z.string().min(1, "Start time is required"),
  endDateTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  timeZone: z.string().optional(),
});

export const getEventsArgsSchema = z.object({
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
  maxResults: z.number().int().positive().max(50).optional(),
});
