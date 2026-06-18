import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { AuthRepository } from "@/modules/auth";
import { DashboardService } from "@/modules/dashboard/dashboard.service";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest) {
  try {
    const { userId: clerkUserId } = await requireAuth();

    const dbUser = await new AuthRepository(prisma).findByClerkUserId(clerkUserId);
    if (!dbUser) {
      return fail("User not found", "USER_NOT_FOUND", 404);
    }

    const stats = await new DashboardService(prisma).getDashboardStats(dbUser.id);
    return ok({ stats });
  } catch (error) {
    console.error("[Dashboard Stats Error]", error);
    return fail("Failed to fetch dashboard stats", "FETCH_FAILED", 500);
  }
}
