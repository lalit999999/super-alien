/**
 * GET /api/test/calendar?userId=<clerkUserId>&limit=20&offset=0
 *
 * Tests the full Calendar module stack:
 *   Route → CalendarService → CalendarRepository → Prisma (DB events)
 *
 * NOTE: Returns events already synced to the database, NOT live from Google Calendar.
 *       Run POST /api/test/calendar/sync first to populate the database.
 *
 * cURL:
 *   curl "http://localhost:3000/api/test/calendar?userId=user_xxx"
 *
 * Expected:
 *   { "success": true, "data": { "events": [...], "total": 3, "limit": 20, "offset": 0 } }
 *
 * Failures:
 *   - User not in DB → USER_NOT_FOUND
 *   - No events → empty array (run calendar sync first)
 */

import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { CalendarRepository } from "@/modules/calendar/calendar.repository";
import { CalendarService } from "@/modules/calendar/calendar.service";
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
    if (!dbUser) return fail("User not found in database", "USER_NOT_FOUND", 404);

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
    });
    if (!parsed.success) {
      return fail(parsed.error.issues.map((i) => i.message).join(", "), "VALIDATION_ERROR", 400);
    }

    const service = new CalendarService(new CalendarRepository(prisma));
    const { events, total } = await service.getUserEvents(dbUser.id, {
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return ok({ events, total, limit: parsed.data.limit, offset: parsed.data.offset });
  } catch (error) {
    return fail(String(error), "CALENDAR_ERROR", 500);
  }
}
