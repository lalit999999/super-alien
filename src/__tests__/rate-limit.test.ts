import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildRateLimitKey, getRateLimitHeaders, resolveUserTier } from "@/modules/rate-limit/rate-limit.utils";
import { RATE_LIMIT_CONFIGS } from "@/modules/rate-limit/rate-limit.constants";

vi.mock("@/lib/redis", () => ({
  redis: {
    eval: vi.fn(),
  },
}));

vi.mock("@/modules/monitoring", () => ({
  metricsService: {
    trackRateLimitViolation: vi.fn(),
    trackCacheHit: vi.fn(),
    trackCacheMiss: vi.fn(),
  },
}));

describe("Rate Limit Utils — key generation", () => {
  it("builds correct rate limit key", () => {
    expect(buildRateLimitKey("user-abc", "chat")).toBe("rate:user:user-abc:chat");
    expect(buildRateLimitKey("user-abc", "summaries")).toBe("rate:user:user-abc:summaries");
    expect(buildRateLimitKey("user-abc", "gmail-actions")).toBe("rate:user:user-abc:gmail-actions");
  });
});

describe("Rate Limit Utils — headers", () => {
  it("returns correct headers", () => {
    const resetAt = Date.now() + 60000;
    const headers = getRateLimitHeaders(100, 42, resetAt);
    expect(headers["X-RateLimit-Limit"]).toBe("100");
    expect(headers["X-RateLimit-Remaining"]).toBe("42");
    expect(headers["Retry-After"]).toBeDefined();
  });
});

describe("Rate Limit Constants", () => {
  it("free tier chat limit is 100/day", () => {
    expect(RATE_LIMIT_CONFIGS.chat.FREE.limit).toBe(100);
    expect(RATE_LIMIT_CONFIGS.chat.FREE.windowMs).toBe(86400000);
  });

  it("paid tier chat limit is 5000/day", () => {
    expect(RATE_LIMIT_CONFIGS.chat.PAID.limit).toBe(5000);
  });

  it("summaries limit is 200/day", () => {
    expect(RATE_LIMIT_CONFIGS.summaries.FREE.limit).toBe(200);
  });

  it("drafts limit is 50/day", () => {
    expect(RATE_LIMIT_CONFIGS.drafts.FREE.limit).toBe(50);
  });

  it("gmail-actions limit is 20/minute", () => {
    expect(RATE_LIMIT_CONFIGS["gmail-actions"].FREE.limit).toBe(20);
    expect(RATE_LIMIT_CONFIGS["gmail-actions"].FREE.windowMs).toBe(60000);
  });

  it("api limit is 60/minute", () => {
    expect(RATE_LIMIT_CONFIGS.api.FREE.limit).toBe(60);
    expect(RATE_LIMIT_CONFIGS.api.FREE.windowMs).toBe(60000);
  });
});

describe("resolveUserTier", () => {
  it("defaults to FREE tier when no subscription exists", async () => {
    await expect(resolveUserTier("any-user-id")).resolves.toBe("FREE");
  });
});

describe("RateLimitService", () => {
  let redisMock: { eval: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    redisMock = mod.redis as unknown as typeof redisMock;
  });

  it("returns allowed=true when under the limit", async () => {
    redisMock.eval.mockResolvedValue([1, 49]);
    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();
    const result = await svc.check("user-1", "drafts");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(49);
    expect(result.limit).toBe(50);
  });

  it("returns allowed=false when limit exceeded", async () => {
    redisMock.eval.mockResolvedValue([0, 0]);
    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();
    const result = await svc.check("user-1", "drafts");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("calls redis.eval with correct keys and args", async () => {
    redisMock.eval.mockResolvedValue([1, 99]);
    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();
    await svc.check("user-xyz", "chat");
    expect(redisMock.eval).toHaveBeenCalledOnce();
    const [script, keys, args] = redisMock.eval.mock.calls[0];
    expect(typeof script).toBe("string");
    expect(keys).toEqual(["rate:user:user-xyz:chat"]);
    expect(args[2]).toBe("100"); // FREE tier limit
  });

  it("tracks violation metric when denied", async () => {
    redisMock.eval.mockResolvedValue([0, 0]);
    const { metricsService } = await import("@/modules/monitoring");
    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();
    await svc.check("user-1", "summaries");
    expect(metricsService.trackRateLimitViolation).toHaveBeenCalledWith(
      "user-1",
      "summaries",
      200
    );
  });
});

describe("Rate Limit Security — burst protection", () => {
  it("blocks concurrent requests beyond limit", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMod = mod.redis as unknown as { eval: ReturnType<typeof vi.fn> };

    let callCount = 0;
    redisMod.eval.mockImplementation(async () => {
      callCount++;
      // Allow first 20, deny rest (gmail-actions limit = 20)
      return callCount <= 20 ? [1, 20 - callCount] : [0, 0];
    });

    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();

    const requests = Array.from({ length: 25 }, () =>
      svc.check("burst-user", "gmail-actions")
    );
    const results = await Promise.all(requests);
    const denied = results.filter((r) => !r.allowed);
    expect(denied.length).toBeGreaterThan(0);
  });
});
