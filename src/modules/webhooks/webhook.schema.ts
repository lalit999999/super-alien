import { z } from "zod";

export const webhookQuerySchema = z.object({
  tenantId: z.string().min(1, "tenantId is required"),
});

export type WebhookQueryInput = z.infer<typeof webhookQuerySchema>;
