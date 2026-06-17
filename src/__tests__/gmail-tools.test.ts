import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getThreadArgsSchema,
  archiveEmailArgsSchema,
  deleteEmailArgsSchema,
  markReadArgsSchema,
  markUnreadArgsSchema,
} from "@/modules/agent/agent.schema";
import { AGENT_TOOL_NAMES } from "@/modules/agent/agent.constants";

// ─── Schema validation tests ───────────────────────────────────────────────────

describe("getThread schema", () => {
  it("accepts a valid threadId", () => {
    expect(() => getThreadArgsSchema.parse({ threadId: "thread-123" })).not.toThrow();
  });

  it("rejects missing threadId", () => {
    expect(() => getThreadArgsSchema.parse({})).toThrow();
  });

  it("rejects empty threadId", () => {
    expect(() => getThreadArgsSchema.parse({ threadId: "" })).toThrow();
  });
});

describe("archiveEmail schema", () => {
  it("accepts valid emailId", () => {
    expect(() => archiveEmailArgsSchema.parse({ emailId: "email-abc" })).not.toThrow();
  });

  it("rejects missing emailId", () => {
    expect(() => archiveEmailArgsSchema.parse({})).toThrow();
  });
});

describe("deleteEmail schema", () => {
  it("accepts valid emailId", () => {
    expect(() => deleteEmailArgsSchema.parse({ emailId: "email-xyz" })).not.toThrow();
  });

  it("rejects missing emailId", () => {
    expect(() => deleteEmailArgsSchema.parse({})).toThrow();
  });
});

describe("markRead schema", () => {
  it("accepts valid emailId", () => {
    expect(() => markReadArgsSchema.parse({ emailId: "email-123" })).not.toThrow();
  });

  it("rejects missing emailId", () => {
    expect(() => markReadArgsSchema.parse({})).toThrow();
  });
});

describe("markUnread schema", () => {
  it("accepts valid emailId", () => {
    expect(() => markUnreadArgsSchema.parse({ emailId: "email-456" })).not.toThrow();
  });

  it("rejects missing emailId", () => {
    expect(() => markUnreadArgsSchema.parse({})).toThrow();
  });
});

// ─── Tool name constants tests ─────────────────────────────────────────────────

describe("AGENT_TOOL_NAMES", () => {
  it("includes all new Gmail tools", () => {
    expect(AGENT_TOOL_NAMES.GET_THREAD).toBe("getThread");
    expect(AGENT_TOOL_NAMES.ARCHIVE_EMAIL).toBe("archiveEmail");
    expect(AGENT_TOOL_NAMES.DELETE_EMAIL).toBe("deleteEmail");
    expect(AGENT_TOOL_NAMES.MARK_READ).toBe("markRead");
    expect(AGENT_TOOL_NAMES.MARK_UNREAD).toBe("markUnread");
  });

  it("includes sync tools", () => {
    expect(AGENT_TOOL_NAMES.TRIGGER_SYNC).toBe("triggerSync");
    expect(AGENT_TOOL_NAMES.GET_SYNC_STATUS).toBe("getSyncStatus");
    expect(AGENT_TOOL_NAMES.CHECK_PROGRESS).toBe("checkProgress");
  });

  it("preserves existing tools", () => {
    expect(AGENT_TOOL_NAMES.SEARCH_EMAILS).toBe("searchEmails");
    expect(AGENT_TOOL_NAMES.SEND_EMAIL).toBe("sendEmail");
    expect(AGENT_TOOL_NAMES.CREATE_EVENT).toBe("createEvent");
  });
});

// ─── GmailService method tests (with mocks) ────────────────────────────────────

describe("GmailService gmail actions", () => {
  const mockRepo = {
    upsertEmail: vi.fn(),
    createManyEmails: vi.fn(),
    getEmailsByUser: vi.fn(),
    getEmailById: vi.fn(),
    countEmailsByUser: vi.fn(),
    markAsRead: vi.fn(),
    getEmailsWithoutClassification: vi.fn(),
    deleteEmailByCorsairId: vi.fn(),
    updateReadStatusByCorsairId: vi.fn(),
    searchEmailsInDb: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("archiveEmail returns success", async () => {
    const corsairMock = vi.fn().mockResolvedValue({ id: "email-123" });
    vi.doMock("@/modules/corsair", () => ({
      archiveEmail: corsairMock,
      getEmails: vi.fn(),
      getEmailById: vi.fn(),
      sendEmail: vi.fn(),
      searchEmails: vi.fn(),
      getThread: vi.fn(),
      trashEmail: vi.fn(),
      markEmailRead: vi.fn(),
      markEmailUnread: vi.fn(),
    }));

    const { GmailService } = await import("@/modules/gmail/gmail.service");
    const service = new GmailService(mockRepo as never);
    const result = await service.archiveEmail("clerk-user", "email-123");
    expect(result.success).toBe(true);
  });
});
