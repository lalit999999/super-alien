import { describe, it, expect, vi, beforeEach } from "vitest";
import { AiService } from "@/modules/ai/ai.service";

function makeRepo(overrides: Record<string, unknown> = {}) {
  return {
    getEmailById: vi.fn(),
    getEmailsByIds: vi.fn(),
    upsertClassification: vi.fn(),
    getClassificationByEmailId: vi.fn().mockResolvedValue(null),
    upsertCategory: vi.fn(),
    upsertSummary: vi.fn(),
    getSummaryByEmailId: vi.fn().mockResolvedValue(null),
    saveDraft: vi.fn(),
    getDraftsByEmailId: vi.fn(),
    getLatestDraftByEmailId: vi.fn(),
    findUserIdByClerkId: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function makeOpenAi(parsedResult: unknown) {
  return {
    chat: {
      completions: {
        parse: vi.fn().mockResolvedValue({
          choices: [{ message: { parsed: parsedResult } }],
        }),
      },
    },
  };
}

describe("AI result caching — classifyEmail (PH-004)", () => {
  const emailId = "email-abc";
  const clerkUserId = "user-xyz";

  it("returns cached classification without calling AI", async () => {
    const cachedClassification = {
      category: "FINANCE",
      confidence: 0.9,
      reason: "Finance keyword found",
    };
    const repo = makeRepo({
      getClassificationByEmailId: vi.fn().mockResolvedValue(cachedClassification),
    });
    const openai = makeOpenAi({});
    const service = new AiService(openai as never, repo as never);

    const result = await service.classifyEmail(emailId, clerkUserId);

    expect(result.category).toBe("FINANCE");
    expect(result.confidence).toBe(0.9);
    expect(openai.chat.completions.parse).not.toHaveBeenCalled();
  });

  it("calls AI on cache miss and persists result", async () => {
    const repo = makeRepo({
      getClassificationByEmailId: vi.fn().mockResolvedValue(null),
      getEmailById: vi.fn().mockResolvedValue({
        id: emailId,
        subject: "Invoice",
        sender: "billing@acme.com",
        snippet: "Your invoice",
        body: "Please find attached.",
      }),
    });
    const aiResult = { category: "FINANCE", confidence: 0.88, reasoning: "Invoice detected" };
    const openai = makeOpenAi(aiResult);
    const service = new AiService(openai as never, repo as never);

    const result = await service.classifyEmail(emailId, clerkUserId);

    expect(openai.chat.completions.parse).toHaveBeenCalledOnce();
    expect(repo.upsertCategory).toHaveBeenCalledWith(
      expect.objectContaining({ emailId, category: "FINANCE" })
    );
    expect(result.category).toBe("FINANCE");
  });
});

describe("AI result caching — summarizeEmailById (PH-004)", () => {
  const emailId = "email-def";
  const clerkUserId = "user-xyz";

  it("returns cached summary without calling AI", async () => {
    const cachedSummary = {
      shortSummary: "Short",
      mediumSummary: "Medium",
      bulletSummary: ["Point A", "Point B"],
    };
    const repo = makeRepo({
      getSummaryByEmailId: vi.fn().mockResolvedValue(cachedSummary),
    });
    const openai = makeOpenAi({});
    const service = new AiService(openai as never, repo as never);

    const result = await service.summarizeEmailById(emailId, clerkUserId);

    expect(result.shortSummary).toBe("Short");
    expect(result.bulletSummary).toEqual(["Point A", "Point B"]);
    expect(openai.chat.completions.parse).not.toHaveBeenCalled();
  });

  it("calls AI on cache miss and persists result", async () => {
    const repo = makeRepo({
      getSummaryByEmailId: vi.fn().mockResolvedValue(null),
      getEmailById: vi.fn().mockResolvedValue({
        id: emailId,
        subject: "Project Update",
        sender: "alice@acme.com",
        snippet: "Here's the update",
        body: "Full body text here.",
      }),
    });
    const aiResult = {
      shortSummary: "Project update shared",
      mediumSummary: "Alice shared an update about the project status.",
      bulletSummary: ["Status updated", "Next steps defined"],
    };
    const openai = makeOpenAi(aiResult);
    const service = new AiService(openai as never, repo as never);

    const result = await service.summarizeEmailById(emailId, clerkUserId);

    expect(openai.chat.completions.parse).toHaveBeenCalledOnce();
    expect(repo.upsertSummary).toHaveBeenCalledWith(
      expect.objectContaining({ emailId, shortSummary: "Project update shared" })
    );
    expect(result.shortSummary).toBe("Project update shared");
  });
});
