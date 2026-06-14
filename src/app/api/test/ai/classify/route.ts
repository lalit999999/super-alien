/**
 * POST /api/test/ai/classify?userId=<clerkUserId>
 *
 * Tests the AI classification stack:
 *   Route → AiService → OpenAI → AiRepository → Prisma (EmailClassification table)
 *
 * Body:
 *   { "emailId": "<UUID of an Email row in the database>" }
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/ai/classify?userId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{"emailId": "clx..."}'
 *
 * Expected:
 *   {
 *     "success": true,
 *     "data": {
 *       "emailId": "...",
 *       "priority": "NORMAL",
 *       "reason": "...",
 *       "summary": "..."
 *     }
 *   }
 *
 * Verification checklist:
 *   1. priority is one of URGENT / IMPORTANT / NORMAL / LOW
 *   2. Check DB: SELECT * FROM "EmailClassification" WHERE "emailId" = '...'
 *   3. Re-running with the same emailId upserts — no duplicates
 *
 * Failures:
 *   - emailId not found → EMAIL_NOT_FOUND
 *   - OPENAI_API_KEY missing → AI_ERROR
 *   - OpenAI quota exceeded → AI_ERROR with rate-limit message
 *
 * Debugging:
 *   - Run POST /api/test/gmail/sync first to populate emails
 *   - Then GET /api/test/gmail to get a valid emailId
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { AiService, AiRepository, openai } from "@/modules/ai";
import { GmailRepository } from "@/modules/gmail/gmail.repository";
import { resolveDbUser } from "../../_utils";
import { z } from "zod";

const bodySchema = z.object({
  emailId: z.string().min(1, "emailId required"),
});

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId, dbUser } = await resolveDbUser(req);
    if (!clerkUserId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);
    if (!dbUser) return fail("User not found in database", "USER_NOT_FOUND", 404);

    const json = await req.json().catch(() => null);
    if (!json) return fail("Invalid JSON body", "VALIDATION_ERROR", 400);

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const gmailRepo = new GmailRepository(prisma);
    const email = await gmailRepo.getEmailById(parsed.data.emailId, dbUser.id);
    if (!email) {
      return fail(
        `Email ${parsed.data.emailId} not found for this user. Run POST /api/test/gmail/sync first.`,
        "EMAIL_NOT_FOUND",
        404
      );
    }

    const aiService = new AiService(openai, new AiRepository(prisma));
    const result = await aiService.classifyAndSummarizeEmail(email.id, {
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet ?? undefined,
      body: email.body ?? undefined,
    });

    return ok(result);
  } catch (error) {
    return fail(String(error), "AI_ERROR", 500);
  }
}
