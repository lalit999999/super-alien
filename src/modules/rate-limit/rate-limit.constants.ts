import type { RateLimitConfig, UserTier } from "./rate-limit.types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const RATE_LIMIT_CONFIGS: Record<string, Record<UserTier, RateLimitConfig>> = {
  chat: {
    FREE: { limit: 100, windowMs: DAY_MS },
    PAID: { limit: 5000, windowMs: DAY_MS },
  },
  summaries: {
    FREE: { limit: 200, windowMs: DAY_MS },
    PAID: { limit: 200, windowMs: DAY_MS },
  },
  drafts: {
    FREE: { limit: 50, windowMs: DAY_MS },
    PAID: { limit: 50, windowMs: DAY_MS },
  },
  "gmail-actions": {
    FREE: { limit: 20, windowMs: MINUTE_MS },
    PAID: { limit: 20, windowMs: MINUTE_MS },
  },
  api: {
    FREE: { limit: 60, windowMs: MINUTE_MS },
    PAID: { limit: 60, windowMs: MINUTE_MS },
  },
};

export const RATE_LIMIT_ERRORS = {
  EXCEEDED: "Rate limit exceeded",
  CODE: "RATE_LIMIT_EXCEEDED",
} as const;
