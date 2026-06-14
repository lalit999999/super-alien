/**
 * POST /api/test/calendar/sync?userId=<clerkUserId>
 *
 * Tests the full Calendar sync stack:
 *   Corsair → CalendarService → CalendarRepository → Prisma (CalendarEvent table)
 *
 * Body (optional):
 *   { "maxResults": 50, "timeMin": "2026-01-01T00:00:00Z" }
 *
 * cURL:
 *   curl -X POST "http://localhost:3000/api/test/calendar/sync?userId=user_xxx" \
 *     -H "Content-Type: application/json" \
 *     -d '{}'
 *
 * Expected:
 *   { "success": true, "data": { "synced": 5, "skipped": 0 } }
 *
 * Verification checklist:
 *   1. synced > 0 confirms Corsair calendar access works and CalendarEvent table is writable
 *   2. Run GET /api/test/calendar to see the synced rows
 *   3. Check DB: SELECT count(*) FROM "CalendarEvent" WHERE "userId" = '<dbUserId>'
 *
 * Failures:
 *   - User not in DB → USER_NOT_FOUND
 *   - User has no upcoming events → synced=0 skipped=0 (valid, not an error)
 *   - Corsair calendar not connected → CALENDAR_ERROR
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { CalendarRepository } from "@/modules/calendar/calendar.repository";
import { CalendarService } from "@/modules/calendar/calendar.service";
import { resolveDbUser } from "../../_utils";
import { z } from "zod";

const bodySchema = z.object({
  maxResults: z.number().int().positive().max(2500).optional(),
  timeMin: z.string().optional(),
  timeMax: z.string().optional(),
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

    const service = new CalendarService(new CalendarRepository(prisma));
    const result = await service.syncEventsFromCorsair(clerkUserId, dbUser.id, {
      maxResults: parsed.data.maxResults,
      timeMin: parsed.data.timeMin,
      timeMax: parsed.data.timeMax,
    });

    return ok({ synced: result.synced, skipped: result.skipped });
  } catch (error) {
    return fail(String(error), "CALENDAR_ERROR", 500);
  }
}
