/**
 * GET /api/test/db
 *
 * Verifies the Prisma connection and returns total user count.
 *
 * cURL:
 *   curl http://localhost:3000/api/test/db
 *
 * Expected:
 *   { "success": true, "data": { "status": "ok", "userCount": 1 } }
 *
 * Failures:
 *   - DATABASE_URL misconfigured → Prisma connection error
 *   - Migrations not run → relation does not exist
 */

import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/response";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    return ok({ status: "ok", userCount });
  } catch (error) {
    return fail(`Database error: ${String(error)}`, "DB_ERROR", 500);
  }
}
