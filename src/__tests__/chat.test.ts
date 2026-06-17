import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSessionSchema, sendMessageSchema } from "@/modules/chat/chat.schema";
import { CHAT_HISTORY_LIMIT, CHAT_DEFAULT_TITLE, CHAT_SESSION_GROUPS } from "@/modules/chat/chat.constants";

// ─── Schema tests ──────────────────────────────────────────────────────────────

describe("createSessionSchema", () => {
  it("accepts no body (title is optional)", () => {
    expect(() => createSessionSchema.parse({})).not.toThrow();
  });

  it("accepts valid title", () => {
    const result = createSessionSchema.parse({ title: "My session" });
    expect(result.title).toBe("My session");
  });

  it("rejects title over 80 characters", () => {
    expect(() =>
      createSessionSchema.parse({ title: "a".repeat(81) })
    ).toThrow();
  });
});

describe("sendMessageSchema", () => {
  it("accepts valid prompt", () => {
    const result = sendMessageSchema.parse({ prompt: "Hello" });
    expect(result.prompt).toBe("Hello");
  });

  it("rejects empty prompt", () => {
    expect(() => sendMessageSchema.parse({ prompt: "" })).toThrow();
  });

  it("rejects prompt over 4000 characters", () => {
    expect(() =>
      sendMessageSchema.parse({ prompt: "a".repeat(4001) })
    ).toThrow();
  });

  it("rejects missing prompt", () => {
    expect(() => sendMessageSchema.parse({})).toThrow();
  });
});

// ─── Constants tests ───────────────────────────────────────────────────────────

describe("chat constants", () => {
  it("history limit is 20", () => {
    expect(CHAT_HISTORY_LIMIT).toBe(20);
  });

  it("default title is set", () => {
    expect(CHAT_DEFAULT_TITLE).toBeTruthy();
  });

  it("session groups are defined", () => {
    expect(CHAT_SESSION_GROUPS.TODAY).toBe("Today");
    expect(CHAT_SESSION_GROUPS.YESTERDAY).toBe("Yesterday");
    expect(CHAT_SESSION_GROUPS.LAST_7_DAYS).toBe("Last 7 Days");
    expect(CHAT_SESSION_GROUPS.LAST_30_DAYS).toBe("Last 30 Days");
  });
});

// ─── ChatService unit tests ────────────────────────────────────────────────────

describe("ChatService", () => {
  const mockRepo = {
    createSession: vi.fn(),
    getSession: vi.fn(),
    listSessions: vi.fn(),
    deleteSession: vi.fn(),
    addMessage: vi.fn(),
    getRecentMessages: vi.fn(),
    updateTitle: vi.fn(),
  };

  const mockAgent = {
    chat: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createSession uses default title when none provided", async () => {
    mockRepo.createSession.mockResolvedValue({ id: "s1", title: CHAT_DEFAULT_TITLE, userId: "u1" });
    const { ChatService } = await import("@/modules/chat/chat.service");
    const service = new ChatService(mockRepo as never, mockAgent as never);
    await service.createSession("u1");
    expect(mockRepo.createSession).toHaveBeenCalledWith("u1", CHAT_DEFAULT_TITLE);
  });

  it("createSession uses provided title", async () => {
    mockRepo.createSession.mockResolvedValue({ id: "s1", title: "My Chat", userId: "u1" });
    const { ChatService } = await import("@/modules/chat/chat.service");
    const service = new ChatService(mockRepo as never, mockAgent as never);
    await service.createSession("u1", "My Chat");
    expect(mockRepo.createSession).toHaveBeenCalledWith("u1", "My Chat");
  });

  it("deleteSession calls repo.deleteSession", async () => {
    mockRepo.deleteSession.mockResolvedValue(undefined);
    const { ChatService } = await import("@/modules/chat/chat.service");
    const service = new ChatService(mockRepo as never, mockAgent as never);
    await service.deleteSession("session-1", "user-1");
    expect(mockRepo.deleteSession).toHaveBeenCalledWith("session-1", "user-1");
  });

  it("listSessions returns groups", async () => {
    const now = new Date();
    mockRepo.listSessions.mockResolvedValue([
      { id: "s1", title: "Test", lastMessageAt: now, userId: "u1" },
    ]);
    const { ChatService } = await import("@/modules/chat/chat.service");
    const service = new ChatService(mockRepo as never, mockAgent as never);
    const result = await service.listSessions("u1");
    expect(result.sessions).toHaveLength(1);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].label).toBe(CHAT_SESSION_GROUPS.TODAY);
  });

  it("sendMessage saves user and assistant messages", async () => {
    const session = {
      id: "s1",
      title: "hello",
      userId: "db-u1",
      messages: [],
    };
    mockRepo.getSession.mockResolvedValue(session);
    mockRepo.addMessage
      .mockResolvedValueOnce({ id: "m1", role: "USER", content: "hello" })
      .mockResolvedValueOnce({ id: "m2", role: "ASSISTANT", content: "Hi there!" });
    mockRepo.updateTitle.mockResolvedValue(undefined);
    mockAgent.chat.mockResolvedValue({
      executionId: "e1",
      response: "Hi there!",
      toolsUsed: ["searchEmails"],
      status: "SUCCESS",
    });

    const { ChatService } = await import("@/modules/chat/chat.service");
    const service = new ChatService(mockRepo as never, mockAgent as never);
    const result = await service.sendMessage("s1", "clerk-u1", "db-u1", "hello");

    expect(result.userMessage.content).toBe("hello");
    expect(result.assistantMessage.content).toBe("Hi there!");
    expect(result.toolsUsed).toContain("searchEmails");
  });
});
