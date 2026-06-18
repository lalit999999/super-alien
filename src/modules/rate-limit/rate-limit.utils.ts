import type { RateLimitAction, UserTier } from "./rate-limit.types";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/config/generated/prisma/client";

export function buildRateLimitKey(userId: string, action: RateLimitAction): string {
  return `rate:user:${userId}:${action}`;
}

export function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
    "Retry-After": String(Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))),
  };
}

// userId here is the internal DB userId (not clerkUserId)
export async function resolveUserTier(userId: string): Promise<UserTier> {
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      select: { id: true },
    });
    return sub ? "PAID" : "FREE";
  } catch {
    return "FREE";
  }
}
