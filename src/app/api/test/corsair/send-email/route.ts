/**
 * POST /api/test/corsair/send-email?userId=<clerkUserId>
 *
 * Sends a real email via Corsair → Gmail on behalf of the user.
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/corsair/send-email?userId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{"to":"test@example.com","subject":"Test","body":"Hello from SuperAlien"}'
 *
 * Postman:
 *   POST /api/test/corsair/send-email?userId=user_xxx
 *   Body (JSON): { "to": "...", "subject": "...", "body": "..." }
 *
 * Expected:
 *   { "success": true, "data": { "id": "...", "threadId": "..." } }
 *
 * Failures:
 *   - to/subject/body missing → VALIDATION_ERROR
 *   - Invalid recipient → Gmail API error via Corsair
 */

import { z } from "zod";
import { sendEmail } from "@/modules/corsair";
import { ok, fail } from "@/lib/response";
import { resolveClerkUserId } from "../../_utils";

const bodySchema = z.object({
  to: z.string().email("Invalid recipient email"),
  subject: z.string().min(1, "Subject required"),
  body: z.string().min(1, "Body required"),
  threadId: z.string().optional(),
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

    const result = await sendEmail(userId, parsed.data);
    return ok({ userId, messageId: result.id, threadId: result.threadId });
  } catch (error) {
    return fail(String(error), "CORSAIR_ERROR", 500);
  }
}
