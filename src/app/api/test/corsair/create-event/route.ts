/**
 * POST /api/test/corsair/create-event?userId=<clerkUserId>
 *
 * Creates a calendar event via Corsair → Google Calendar.
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/corsair/create-event?userId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *       "summary": "Corsair Test Event",
 *       "start": { "dateTime": "2026-06-15T10:00:00Z" },
 *       "end":   { "dateTime": "2026-06-15T11:00:00Z" }
 *     }'
 *
 * Expected:
 *   { "success": true, "data": { "id": "...", "summary": "Corsair Test Event", ... } }
 *
 * Verification:
 *   - Check Google Calendar UI for the new event
 *   - Event id will appear in the response
 *
 * Failures:
 *   - Missing summary/start/end → VALIDATION_ERROR
 *   - User not connected to Google Calendar → Corsair tenant error
 */

import { z } from "zod";
import { createEvent } from "@/modules/corsair";
import { ok, fail } from "@/lib/response";
import { resolveClerkUserId } from "../../_utils";

const dateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
  timeZone: z.string().optional(),
});

const bodySchema = z.object({
  summary: z.string().min(1, "summary required"),
  description: z.string().optional(),
  start: dateTimeSchema,
  end: dateTimeSchema,
});

export async function POST(req: Request) {
  try {
    const userId = await resolveClerkUserId(req);
    if (!userId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);

    const json = await req.json().catch(() => null);
    if (!json) return fail("Invalid JSON body", "VALIDATION_ERROR", 400);

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const result = await createEvent(userId, { event: parsed.data });
    return ok({ userId, event: result });
  } catch (error) {
    return fail(String(error), "CORSAIR_ERROR", 500);
  }
}
