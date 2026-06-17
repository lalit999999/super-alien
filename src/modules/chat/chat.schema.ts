import { z } from "zod";

export const createSessionSchema = z.object({
  title: z.string().min(1).max(80).optional(),
});

export const sendMessageSchema = z.object({
  prompt: z.string().min(1, "Message is required").max(4000, "Message too long"),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
