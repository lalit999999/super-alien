/**
 * POST /api/test/gmail/sync?userId=<clerkUserId>
 *
 * Tests the full Gmail sync stack:
 *   Corsair → GmailService → GmailRepository → Prisma (Email table)
 *
 * Body (optional):
 *   { "maxResults": 50 }
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/gmail/sync?userId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{"maxResults": 10}'
 *
 * Expected:
 *   { "success": true, "data": { "synced": 10, "skipped": 0 } }
 *
 * Verification checklist:
 *   1. synced > 0 confirms Corsair is reachable and the Email table is writable
 *   2. Run GET /api/test/gmail to see the synced rows
 *   3. Check DB: SELECT count(*) FROM "Email" WHERE "userId" = '<dbUserId>'
 *
 * Failures:
 *   - User not in DB → USER_NOT_FOUND
 *   - Corsair unreachable / no Gmail connection → GMAIL_ERROR (synced=0, skipped=N)
 *   - Prisma schema mismatch → DB_ERROR (run prisma migrate dev)
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { GmailRepository } from "@/modules/gmail/gmail.repository";
import { GmailService } from "@/modules/gmail/gmail.service";
import { AiService, AiRepository, openai } from "@/modules/ai";
import { resolveDbUser } from "../../_utils";
import { z } from "zod";

const bodySchema = z.object({
  maxResults: z.number().int().positive().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { clerkUserId, dbUser } = await resolveDbUser(req);
    if (!clerkUserId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);
    if (!dbUser) return fail("User not found in database", "USER_NOT_FOUND", 404);

    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const ai = new AiService(openai, new AiRepository(prisma));
    const service = new GmailService(new GmailRepository(prisma), ai);
    const result = await service.syncEmailsFromCorsair(clerkUserId, parsed.data.maxResults);

    return ok({ synced: result.synced, skipped: result.skipped });
  } catch (error) {
    return fail(String(error), "GMAIL_ERROR", 500);
  }
}
