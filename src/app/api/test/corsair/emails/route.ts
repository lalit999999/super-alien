/**
 * GET /api/test/corsair/emails?userId=<clerkUserId>
 *
 * Hits Corsair → Gmail and returns the first 20 INBOX messages.
 * Pass ?userId= when testing via curl (no Clerk session needed).
 *
 * cURL:
 *   curl "http://localhost:3000/api/test/corsair/emails?userId=user_xxx"
 *
 * Expected:
 *   { "success": true, "data": { "count": 5, "messages": [...] } }
 *
 * Failures:
 *   - userId not connected to Corsair → tenant not found error
 *   - CORSAIR_KEK missing → instance initialisation error
 */

import { getEmails } from "@/modules/corsair";
import { ok, fail } from "@/lib/response";
import { resolveClerkUserId } from "../../_utils";

export async function GET(req: Request) {
  try {
    const userId = await resolveClerkUserId(req);
    if (!userId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);

    const result = await getEmails(userId, { labelIds: ["INBOX"], maxResults: 20 });

    return ok({
      userId,
      count: result.messages?.length ?? 0,
      messages: result.messages ?? [],
    });
  } catch (error) {
    return fail(String(error), "CORSAIR_ERROR", 500);
  }
}
