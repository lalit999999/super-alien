import { describe, it, expect } from "vitest";
import { generateDraftArgsSchema } from "@/modules/agent/agent.schema";

describe("generateDraft validation (PH-001)", () => {
  it("accepts emailId only", () => {
    const result = generateDraftArgsSchema.safeParse({ emailId: "email-123" });
    expect(result.success).toBe(true);
  });

  it("accepts prompt only", () => {
    const result = generateDraftArgsSchema.safeParse({ prompt: "Write a follow-up email" });
    expect(result.success).toBe(true);
  });

  it("accepts both emailId and prompt", () => {
    const result = generateDraftArgsSchema.safeParse({
      emailId: "email-123",
      prompt: "Reply politely",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty payload", () => {
    const result = generateDraftArgsSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues ?? (result.error as { errors?: { message: string }[] }).errors ?? [];
      const messages = issues.map((e: { message: string }) => e.message);
      expect(messages.some((m: string) => m.includes("emailId") || m.includes("prompt"))).toBe(true);
    }
  });

  it("rejects payload with only tone and context (no emailId or prompt)", () => {
    const result = generateDraftArgsSchema.safeParse({
      tone: "professional",
      context: "some context",
    });
    expect(result.success).toBe(false);
  });

  it("applies default tone when not specified", () => {
    const result = generateDraftArgsSchema.safeParse({ prompt: "Hello" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tone).toBe("professional");
    }
  });
});
