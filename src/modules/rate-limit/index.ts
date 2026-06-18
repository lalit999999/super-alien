export { RateLimitService, rateLimitService } from "./rate-limit.service";
// peek variants are methods on rateLimitService — re-exported here for discoverability
export { RATE_LIMIT_CONFIGS, RATE_LIMIT_ERRORS } from "./rate-limit.constants";
export { buildRateLimitKey, getRateLimitHeaders, resolveUserTier } from "./rate-limit.utils";
export type { UserTier, RateLimitAction, RateLimitResult, RateLimitConfig } from "./rate-limit.types";
