import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
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

// ─── AI Cache Integration ────────────────────────────────────────────────────

describe("AI Cache Integration — classifyEmail cache-hit", () => {
  it("returns cached classification without calling OpenAI", async () => {
    const { AiService } = await import("@/modules/ai/ai.service");

    const cached = { category: "FINANCE", confidence: 0.9, reason: "Finance" };
    const repo = {
      getClassificationByEmailId: vi.fn().mockResolvedValue(cached),
      getEmailById: vi.fn(),
      upsertCategory: vi.fn(),
      upsertClassification: vi.fn(),
      upsertSummary: vi.fn(),
      getSummaryByEmailId: vi.fn().mockResolvedValue(null),
      saveDraft: vi.fn(),
      getDraftsByEmailId: vi.fn(),
      getLatestDraftByEmailId: vi.fn(),
      getEmailsByIds: vi.fn(),
    };
    const openai = { chat: { completions: { parse: vi.fn() } } };
    const service = new AiService(openai as never, repo as never);

    const result = await service.classifyEmail("email-1", "user-1");
    expect(result.category).toBe("FINANCE");
    expect(openai.chat.completions.parse).not.toHaveBeenCalled();
  });
});

describe("AI Cache Integration — classifyEmail cache-miss", () => {
  it("calls OpenAI and persists result on cache miss", async () => {
    const { AiService } = await import("@/modules/ai/ai.service");

    const repo = {
      getClassificationByEmailId: vi.fn().mockResolvedValue(null),
      getEmailById: vi.fn().mockResolvedValue({
        id: "email-1", subject: "Invoice", sender: "billing@acme.com", snippet: "Pay", body: "Full body",
      }),
      upsertCategory: vi.fn(),
      upsertClassification: vi.fn(),
      upsertSummary: vi.fn(),
      getSummaryByEmailId: vi.fn().mockResolvedValue(null),
      saveDraft: vi.fn(),
      getDraftsByEmailId: vi.fn(),
      getLatestDraftByEmailId: vi.fn(),
      getEmailsByIds: vi.fn(),
    };
    const aiResult = { category: "FINANCE", confidence: 0.88, reasoning: "Invoice" };
    const openai = {
      chat: {
        completions: {
          parse: vi.fn().mockResolvedValue({ choices: [{ message: { parsed: aiResult } }] }),
        },
      },
    };
    const service = new AiService(openai as never, repo as never);

    const result = await service.classifyEmail("email-1", "user-1");
    expect(result.category).toBe("FINANCE");
    expect(openai.chat.completions.parse).toHaveBeenCalledOnce();
    expect(repo.upsertCategory).toHaveBeenCalledWith(
      expect.objectContaining({ emailId: "email-1", category: "FINANCE" })
    );
  });
});

describe("AI Cache Integration — summarizeEmailById", () => {
  it("returns cached summary without calling OpenAI", async () => {
    const { AiService } = await import("@/modules/ai/ai.service");

    const cachedSummary = { shortSummary: "Short", mediumSummary: "Medium", bulletSummary: ["A"] };
    const repo = {
      getSummaryByEmailId: vi.fn().mockResolvedValue(cachedSummary),
      getEmailById: vi.fn(),
      upsertClassification: vi.fn(),
      getClassificationByEmailId: vi.fn().mockResolvedValue(null),
      upsertCategory: vi.fn(),
      upsertSummary: vi.fn(),
      saveDraft: vi.fn(),
      getDraftsByEmailId: vi.fn(),
      getLatestDraftByEmailId: vi.fn(),
      getEmailsByIds: vi.fn(),
    };
    const openai = { chat: { completions: { parse: vi.fn() } } };
    const service = new AiService(openai as never, repo as never);

    const result = await service.summarizeEmailById("email-2", "user-1");
    expect(result.shortSummary).toBe("Short");
    expect(openai.chat.completions.parse).not.toHaveBeenCalled();
  });
});

// ─── Gmail Cache Integration ────────────────────────────────────────────────

describe("Gmail Cache Integration", () => {
  let redisMock: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    redisMock = mod.redis as unknown as typeof redisMock;
  });

  it("searchEmails returns cached result on hit", async () => {
    const cachedResult = { messages: [{ id: "msg-1" }] };
    redisMock.get.mockResolvedValue(JSON.stringify(cachedResult));

    const { CacheService } = await import("@/modules/cache/cache.service");
    const cache = new CacheService();
    const fetcher = vi.fn();
    const result = await cache.getOrSet("gmail:user:u1:search:abc", fetcher, { ttl: 300 });

    expect(result.hit).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("searchEmails calls fetcher and caches on miss", async () => {
    redisMock.get.mockResolvedValue(null);
    redisMock.set.mockResolvedValue("OK");

    const { CacheService } = await import("@/modules/cache/cache.service");
    const cache = new CacheService();
    const freshData = { messages: [{ id: "msg-fresh" }] };
    const fetcher = vi.fn().mockResolvedValue(freshData);
    const result = await cache.getOrSet("gmail:user:u1:search:abc", fetcher, { ttl: 300 });

    expect(result.hit).toBe(false);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(redisMock.set).toHaveBeenCalledWith(
      "gmail:user:u1:search:abc",
      JSON.stringify(freshData),
      { ex: 300 }
    );
  });
});

// ─── Calendar Cache Integration ─────────────────────────────────────────────

describe("Calendar Cache Integration", () => {
  it("getEventDetails returns cached event on hit", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMock = mod.redis as unknown as { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

    const cachedEvent = { id: "event-1", title: "Meeting" };
    redisMock.get.mockResolvedValue(JSON.stringify(cachedEvent));

    const { CacheService } = await import("@/modules/cache/cache.service");
    const cache = new CacheService();
    const fetcher = vi.fn();
    const result = await cache.getOrSet("calendar:user:u1:event:event-1", fetcher, { ttl: 600 });

    expect(result.hit).toBe(true);
    expect(result.data).toEqual(cachedEvent);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

// ─── Chat Cache Integration ──────────────────────────────────────────────────

describe("Chat Cache Integration", () => {
  it("invalidates session cache on delete", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMock = mod.redis as unknown as { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };
    redisMock.del.mockResolvedValue(1);

    const { CacheService } = await import("@/modules/cache/cache.service");
    const cache = new CacheService();
    await cache.del("chat:session:sess-1:messages");
    expect(redisMock.del).toHaveBeenCalledWith("chat:session:sess-1:messages");
  });

  it("reads cached messages on hit", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMock = mod.redis as unknown as { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> };

    const cachedMessages = [{ role: "user", content: "Hello" }];
    redisMock.get.mockResolvedValue(JSON.stringify(cachedMessages));

    const { CacheService } = await import("@/modules/cache/cache.service");
    const cache = new CacheService();
    const result = await cache.get<typeof cachedMessages>("chat:session:sess-1:messages");
    expect(result.hit).toBe(true);
  });
});

// ─── Security Tests ──────────────────────────────────────────────────────────

describe("Security — Rate Limit Bypass Attempts", () => {
  it("different user IDs get separate rate limit buckets", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMock = mod.redis as unknown as { eval: ReturnType<typeof vi.fn> };
    redisMock.eval = vi.fn().mockResolvedValue([1, 49]);

    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();

    await svc.check("user-A", "drafts");
    await svc.check("user-B", "drafts");

    const calls = redisMock.eval.mock.calls;
    const keyA = calls[0][1][0];
    const keyB = calls[1][1][0];
    expect(keyA).toBe("rate:user:user-A:drafts");
    expect(keyB).toBe("rate:user:user-B:drafts");
    expect(keyA).not.toBe(keyB);
  });

  it("different actions get separate rate limit buckets", async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const mod = await import("@/lib/redis");
    const redisMock = mod.redis as unknown as { eval: ReturnType<typeof vi.fn> };
    redisMock.eval = vi.fn().mockResolvedValue([1, 49]);

    const { RateLimitService } = await import("@/modules/rate-limit/rate-limit.service");
    const svc = new RateLimitService();

    await svc.check("user-1", "chat");
    await svc.check("user-1", "drafts");

    const calls = redisMock.eval.mock.calls;
    expect(calls[0][1][0]).toBe("rate:user:user-1:chat");
    expect(calls[1][1][0]).toBe("rate:user:user-1:drafts");
  });
});
