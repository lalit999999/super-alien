import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: {
        lastGmailSync: true,
        lastCalendarSync: true,
        gmailConnected: true,
        calendarConnected: true,
      },
    });
    if (!user) return fail("User not found", "NOT_FOUND", 404);
    return ok(user);
  } catch (err) {
    return fail(String(err), "INTERNAL_ERROR", 500);
  }
}
