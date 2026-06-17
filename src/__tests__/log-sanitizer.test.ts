import { describe, it, expect } from "vitest";
import { sanitizeArgsForLog } from "@/modules/shared/utils/log-sanitizer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sanitize = (v: unknown) => sanitizeArgsForLog(v as any);

describe("sanitizeArgsForLog (PH-005)", () => {
  it("redacts body field", () => {
    const result = sanitizeArgsForLog({ subject: "Meeting", body: "Confidential text" });
    expect(result).toEqual({ subject: "Meeting", body: "[REDACTED]" });
  });

  it("redacts content field", () => {
    const result = sanitizeArgsForLog({ type: "draft", content: "Secret draft" });
    expect(result).toEqual({ type: "draft", content: "[REDACTED]" });
  });

  it("redacts emailBody field", () => {
    const result = sanitizeArgsForLog({ emailBody: "Private email content" });
    expect(result).toEqual({ emailBody: "[REDACTED]" });
  });

  it("redacts message field", () => {
    const result = sanitizeArgsForLog({ to: "alice@example.com", message: "Hi there!" });
    expect(result).toEqual({ to: "alice@example.com", message: "[REDACTED]" });
  });

  it("redacts invitationBody field", () => {
    const result = sanitizeArgsForLog({ summary: "Team lunch", invitationBody: "You are invited..." });
    expect(result).toEqual({ summary: "Team lunch", invitationBody: "[REDACTED]" });
  });

  it("redacts draft field", () => {
    const result = sanitizeArgsForLog({ emailId: "123", draft: "Dear colleague..." });
    expect(result).toEqual({ emailId: "123", draft: "[REDACTED]" });
  });

  it("redacts text field", () => {
    const result = sanitizeArgsForLog({ text: "some text content" });
    expect(result).toEqual({ text: "[REDACTED]" });
  });

  it("preserves non-sensitive fields", () => {
    const result = sanitizeArgsForLog({
      to: "user@example.com",
      subject: "Hello",
      tone: "professional",
    });
    expect(result).toEqual({ to: "user@example.com", subject: "Hello", tone: "professional" });
  });

  it("redacts nested sensitive fields", () => {
    const result = sanitizeArgsForLog({
      email: {
        subject: "Invoice",
        body: "Confidential body",
      },
    });
    expect(result).toEqual({ email: { subject: "Invoice", body: "[REDACTED]" } });
  });

  it("handles mixed payload — redacts sensitive, preserves safe", () => {
    const result = sanitizeArgsForLog({
      subject: "Meeting",
      body: "Private discussion",
      tone: "friendly",
      emailId: "abc-123",
    });
    expect(result).toEqual({
      subject: "Meeting",
      body: "[REDACTED]",
      tone: "friendly",
      emailId: "abc-123",
    });
  });

  it("handles null input", () => {
    expect(sanitize(null)).toBeNull();
  });

  it("handles primitive input", () => {
    expect(sanitize("string")).toBe("string");
    expect(sanitize(42)).toBe(42);
  });

  it("handles arrays of objects", () => {
    const result = sanitize([
      { subject: "A", body: "secret A" },
      { subject: "B", body: "secret B" },
    ]);
    expect(result).toEqual([
      { subject: "A", body: "[REDACTED]" },
      { subject: "B", body: "[REDACTED]" },
    ]);
  });
});
