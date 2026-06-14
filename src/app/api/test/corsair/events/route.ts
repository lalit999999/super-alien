/**
 * GET /api/test/corsair/events?userId=<clerkUserId>
 *
 * Lists upcoming calendar events via Corsair → Google Calendar.
 *
 * cURL:
 *   curl "http://localhost:3000/api/test/corsair/events?userId=user_xxx"
 *
 * Expected:
 *   { "success": true, "data": { "count": 3, "items": [...] } }
 *
 * Failures:
 *   - User not connected to Google Calendar → Corsair tenant error
 */

import { getEvents } from "@/modules/corsair";
import { ok, fail } from "@/lib/response";
import { resolveClerkUserId } from "../../_utils";

export async function GET(req: Request) {
  try {
    const userId = await resolveClerkUserId(req);
    if (!userId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);

    const result = await getEvents(userId, {
      maxResults: 20,
      timeMin: new Date().toISOString(),
    });

    return ok({
      userId,
      count: result.items?.length ?? 0,
      items: result.items ?? [],
    });
  } catch (error) {
    return fail(String(error), "CORSAIR_ERROR", 500);
  }
}
