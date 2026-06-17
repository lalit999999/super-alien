import { z } from "zod";

export const triggerSyncSchema = z.object({
  integration: z.enum(["gmail", "calendar"]),
});

export const syncStatusSchema = z.object({
  gmailStatus: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).nullable(),
  calendarStatus: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED"]).nullable(),
});

export type TriggerSyncInput = z.infer<typeof triggerSyncSchema>;
