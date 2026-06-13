import { z } from "zod";

// Used when syncing a Clerk user into our own database (e.g. from a webhook)
export const upsertUserSchema = z.object({
  clerkUserId: z.string().min(1),
  email: z.string().email(),
});

export type UpsertUserInput = z.infer<typeof upsertUserSchema>;
