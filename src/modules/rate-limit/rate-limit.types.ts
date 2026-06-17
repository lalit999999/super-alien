export type UserTier = "FREE" | "PAID";

export type RateLimitAction =
  | "chat"
  | "summaries"
  | "drafts"
  | "gmail-actions"
  | "api";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number; // epoch ms
}

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}
