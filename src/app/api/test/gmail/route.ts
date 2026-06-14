/**
 * GET /api/test/gmail?userId=<clerkUserId>&limit=20&offset=0
 *
 * Tests the full Gmail module stack:
 *   Route → GmailService → GmailRepository → Prisma (DB emails)
 *
 * NOTE: Returns emails already synced to the database, NOT live from Gmail.
 *       Run POST /api/test/gmail/sync first to populate the database.
 *
 * cURL:
 *   curl "http://localhost:3000/api/test/gmail?userId=user_xxx&limit=20"
 *
 * Expected:
 *   { "success": true, "data": { "emails": [...], "total": 5, "limit": 20, "offset": 0 } }
 *
 * Failures:
 *   - User not in DB → USER_NOT_FOUND (run POST /api/test/db first to check)
 *   - No emails → empty array (run sync first)
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { GmailRepository } from "@/modules/gmail/gmail.repository";
import { GmailService } from "@/modules/gmail/gmail.service";
import { resolveDbUser } from "../_utils";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { clerkUserId, dbUser } = await resolveDbUser(req);
    if (!clerkUserId) return fail("userId required — pass ?userId= or sign in", "AUTH_REQUIRED", 401);
    if (!dbUser) return fail("User not found in database — ensure the user exists via Clerk webhook", "USER_NOT_FOUND", 404);

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const service = new GmailService(new GmailRepository(prisma));
    const { emails, total } = await service.getUserEmails(dbUser.id, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return ok({ emails, total, limit: parsed.data.limit, offset: parsed.data.offset });
  } catch (error) {
    return fail(String(error), "GMAIL_ERROR", 500);
  }
}
