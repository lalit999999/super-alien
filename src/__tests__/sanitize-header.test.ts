import { describe, it, expect } from "vitest";
import { sanitizeHeader } from "@/modules/corsair/corsair.service";

describe("sanitizeHeader (PH-002)", () => {
  it("passes through clean values unchanged", () => {
    expect(sanitizeHeader("Hello World")).toBe("Hello World");
  });

  it("removes CR characters", () => {
    expect(sanitizeHeader("Subject\rInjected")).toBe("SubjectInjected");
  });

  it("removes LF characters", () => {
    expect(sanitizeHeader("Subject\nBcc: attacker@evil.com")).toBe("SubjectBcc: attacker@evil.com");
  });

  it("removes CRLF sequences", () => {
    const injected = "Hello\r\nBcc: attacker@evil.com";
    expect(sanitizeHeader(injected)).toBe("HelloBcc: attacker@evil.com");
  });

  it("handles multiline header injection attempt", () => {
    const injected = "Meeting\r\nBcc: attacker@evil.com\r\nX-Custom: injected";
    const result = sanitizeHeader(injected);
    expect(result).not.toContain("\r");
    expect(result).not.toContain("\n");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeHeader("  Hello World  ")).toBe("Hello World");
  });

  it("collapses multiple internal spaces", () => {
    expect(sanitizeHeader("Hello   World")).toBe("Hello World");
  });

  it("handles empty string", () => {
    expect(sanitizeHeader("")).toBe("");
  });

  it("sanitizes a malformed subject with embedded newlines", () => {
    const subject = "Invoice\n\nContent-Type: text/html";
    expect(sanitizeHeader(subject)).toBe("InvoiceContent-Type: text/html");
  });
});
