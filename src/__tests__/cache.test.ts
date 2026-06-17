import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashQuery, buildGmailEmailKey, buildGmailSearchKey, buildChatMessagesKey } from "@/modules/cache/cache.utils";
import { CACHE_TTL } from "@/modules/cache/cache.constants";

// Mock redis at module level
vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    pipeline: vi.fn(),
  },
}));

vi.mock("@/modules/monitoring", () => ({
  metricsService: {
    trackCacheHit: vi.fn(),
    trackCacheMiss: vi.fn(),
    trackAiCallSaved: vi.fn(),
    trackRateLimitViolation: vi.fn(),
    trackLatency: vi.fn(),
    getSnapshot: vi.fn(),
  },
}));

describe("Cache Utils — key generation", () => {
  it("generates correct gmail email key", () => {
    expect(buildGmailEmailKey("user-1", "email-123")).toBe(
      "gmail:user:user-1:email:email-123"
    );
  });

  it("generates deterministic search key for same query", () => {
    const key1 = buildGmailSearchKey("user-1", "from:alice@example.com");
    const key2 = buildGmailSearchKey("user-1", "from:alice@example.com");
    expect(key1).toBe(key2);
  });

  it("generates different search keys for different queries", () => {
    const key1 = buildGmailSearchKey("user-1", "query-a");
    const key2 = buildGmailSearchKey("user-1", "query-b");
    expect(key1).not.toBe(key2);
  });

  it("generates correct chat messages key", () => {
    expect(buildChatMessagesKey("session-abc")).toBe(
      "chat:session:session-abc:messages"
    );
  });
});

describe("Cache Utils — hashQuery", () => {
  it("returns a non-empty string", () => {
    expect(hashQuery("hello world")).toBeTruthy();
    expect(typeof hashQuery("hello world")).toBe("string");
  });

  it("is deterministic", () => {
    expect(hashQuery("test query")).toBe(hashQuery("test query"));
  });

  it("differs for different inputs", () => {
    expect(hashQuery("query-a")).not.toBe(hashQuery("query-b"));
  });
});

describe("Cache TTL values", () => {
  it("email TTL is 15 minutes", () => {
    expect(CACHE_TTL.EMAIL).toBe(900);
  });

  it("search TTL is 5 minutes", () => {
    expect(CACHE_TTL.SEARCH).toBe(300);
  });

  it("chat messages TTL is 10 minutes", () => {
    expect(CACHE_TTL.CHAT_MESSAGES).toBe(600);
  });

  it("calendar event TTL is 10 minutes", () => {
    expect(CACHE_TTL.CALENDAR_EVENT).toBe(600);
  });
});

describe("CacheService", () => {
  let redis: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    redis = mod.redis as unknown as typeof redis;
  });

  it("returns hit=true on cache hit", async () => {
    redis.get.mockResolvedValue('"cached-value"');
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    const result = await svc.get<string>("test-key");
    expect(result.hit).toBe(true);
  });

  it("returns hit=false on cache miss", async () => {
    redis.get.mockResolvedValue(null);
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    const result = await svc.get<string>("test-key");
    expect(result.hit).toBe(false);
    expect(result.data).toBeNull();
  });

  it("calls redis.set with correct TTL on cache write", async () => {
    redis.set.mockResolvedValue("OK");
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    await svc.set("my-key", { foo: "bar" }, { ttl: 300 });
    expect(redis.set).toHaveBeenCalledWith("my-key", JSON.stringify({ foo: "bar" }), { ex: 300 });
  });

  it("calls redis.del on cache delete", async () => {
    redis.del.mockResolvedValue(1);
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    await svc.del("my-key");
    expect(redis.del).toHaveBeenCalledWith("my-key");
  });

  it("getOrSet returns cached value without calling fetcher", async () => {
    redis.get.mockResolvedValue(JSON.stringify({ id: "1" }));
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    const fetcher = vi.fn().mockResolvedValue({ id: "2" });
    const result = await svc.getOrSet("my-key", fetcher, { ttl: 60 });
    expect(result.hit).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("getOrSet calls fetcher and sets cache on miss", async () => {
    redis.get.mockResolvedValue(null);
    redis.set.mockResolvedValue("OK");
    const { CacheService } = await import("@/modules/cache/cache.service");
    const svc = new CacheService();
    const fetcher = vi.fn().mockResolvedValue({ id: "fresh" });
    const result = await svc.getOrSet("my-key", fetcher, { ttl: 60 });
    expect(result.hit).toBe(false);
    expect(result.data).toEqual({ id: "fresh" });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(redis.set).toHaveBeenCalledWith("my-key", JSON.stringify({ id: "fresh" }), { ex: 60 });
  });
});
