import { redis } from "@/lib/redis";
import type { RateLimitResult, RateLimitAction, UserTier } from "./rate-limit.types";
import { RATE_LIMIT_CONFIGS } from "./rate-limit.constants";
import { buildRateLimitKey, resolveUserTier } from "./rate-limit.utils";
import { metricsService } from "@/modules/monitoring";

// Read-only peek: evicts expired entries then counts current ones without consuming a slot
const PEEK_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
return tonumber(redis.call('ZCARD', key))
`.trim();

// Atomic sliding-window via Lua: returns {1, remaining} or {0, 0}
const SLIDING_WINDOW_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local id = ARGV[4]
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = tonumber(redis.call('ZCARD', key))
if count < limit then
  redis.call('ZADD', key, now, id)
  redis.call('PEXPIRE', key, window)
  return {1, limit - count - 1}
else
  redis.call('PEXPIRE', key, window)
  return {0, 0}
end
`.trim();

export class RateLimitService {
  async check(
    userId: string,
    action: RateLimitAction,
    tier?: UserTier
  ): Promise<RateLimitResult> {
    const resolvedTier = tier ?? (await resolveUserTier(userId));
    const config = RATE_LIMIT_CONFIGS[action][resolvedTier];
    const key = buildRateLimitKey(userId, action);
    const nowMs = Date.now();
    const id = `${nowMs}:${Math.random().toString(36).slice(2, 9)}`;

    const result = (await redis.eval(SLIDING_WINDOW_SCRIPT, [key], [
      String(nowMs),
      String(config.windowMs),
      String(config.limit),
      id,
    ])) as [number, number];

    const allowed = result[0] === 1;
    const remaining = result[1] ?? 0;

    if (!allowed) {
      metricsService.trackRateLimitViolation(userId, action, config.limit);
    }

    return {
      allowed,
      remaining,
      limit: config.limit,
      resetAt: nowMs + config.windowMs,
    };
  }

  async checkApi(userId: string): Promise<RateLimitResult> {
    return this.check(userId, "api");
  }

  async checkChat(userId: string, tier?: UserTier): Promise<RateLimitResult> {
    return this.check(userId, "chat", tier);
  }

  async checkSummaries(userId: string): Promise<RateLimitResult> {
    return this.check(userId, "summaries");
  }

  async checkDrafts(userId: string): Promise<RateLimitResult> {
    return this.check(userId, "drafts");
  }

  async checkGmailActions(userId: string): Promise<RateLimitResult> {
    return this.check(userId, "gmail-actions");
  }

  async peek(
    userId: string,
    action: RateLimitAction,
    tier?: UserTier
  ): Promise<RateLimitResult> {
    const resolvedTier = tier ?? (await resolveUserTier(userId));
    const config = RATE_LIMIT_CONFIGS[action][resolvedTier];
    const key = buildRateLimitKey(userId, action);
    const nowMs = Date.now();

    const used = ((await redis.eval(PEEK_SCRIPT, [key], [
      String(nowMs),
      String(config.windowMs),
    ])) as number) ?? 0;

    const remaining = Math.max(0, config.limit - used);

    return {
      allowed: remaining > 0,
      remaining,
      limit: config.limit,
      resetAt: nowMs + config.windowMs,
    };
  }

  async peekChat(userId: string, tier?: UserTier): Promise<RateLimitResult> {
    return this.peek(userId, "chat", tier);
  }

  async peekSummaries(userId: string): Promise<RateLimitResult> {
    return this.peek(userId, "summaries");
  }

  async peekDrafts(userId: string): Promise<RateLimitResult> {
    return this.peek(userId, "drafts");
  }
}

export const rateLimitService = new RateLimitService();
