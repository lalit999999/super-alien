import { z } from "zod";
import { GMAIL_DEFAULT_LIST_LIMIT, GMAIL_MAX_LIST_LIMIT } from "./gmail.constants";

export const gmailListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(GMAIL_MAX_LIST_LIMIT)
    .default(GMAIL_DEFAULT_LIST_LIMIT),
});

export type GmailListQuery = z.infer<typeof gmailListQuerySchema>;

export const gmailSyncBodySchema = z.object({
  maxResults: z.number().int().positive().max(500).optional(),
});

export type GmailSyncBody = z.infer<typeof gmailSyncBodySchema>;

export const sendEmailBodySchema = z.object({
  to: z.string().email({ message: "Invalid recipient email address" }),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required"),
  threadId: z.string().optional(),
});

export type SendEmailBody = z.infer<typeof sendEmailBodySchema>;

export const searchEmailsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  maxResults: z.coerce.number().int().positive().max(500).optional(),
});

export type SearchEmailsQuery = z.infer<typeof searchEmailsQuerySchema>;
