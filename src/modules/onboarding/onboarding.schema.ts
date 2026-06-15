import { z } from "zod";

export const disconnectSchema = z.object({
  plugin: z.enum(["gmail", "calendar", "all"]),
});

export type DisconnectInput = z.infer<typeof disconnectSchema>;

export const markConnectedSchema = z.object({
  plugin: z.enum(["gmail", "googlecalendar"]),
  tenantId: z.string().min(1),
});

export type MarkConnectedInput = z.infer<typeof markConnectedSchema>;
