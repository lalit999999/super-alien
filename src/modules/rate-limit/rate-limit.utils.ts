import type { RateLimitAction, UserTier } from "./rate-limit.types";

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

export function resolveUserTier(_userId: string): UserTier {
  // Future: look up user plan from DB or Clerk metadata
  return "FREE";
}
