import { z } from "zod";
import { GMAIL_DEFAULT_LIST_LIMIT, GMAIL_MAX_LIST_LIMIT } from "./gmail.constants";

export const gmailListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(GMAIL_MAX_LIST_LIMIT)
    .default(GMAIL_DEFAULT_LIST_LIMIT),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type GmailListQuery = z.infer<typeof gmailListQuerySchema>;

export const gmailSyncBodySchema = z.object({
  maxResults: z.number().int().positive().max(500).optional(),
});

export type GmailSyncBody = z.infer<typeof gmailSyncBodySchema>;
