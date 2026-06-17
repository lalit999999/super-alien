import { describe, it, expect } from "vitest";
import { searchEmailsArgsSchema, getEventsArgsSchema } from "@/modules/agent/agent.schema";
import { calendarSyncBodySchema } from "@/modules/calendar/calendar.schema";

describe("Date validation — searchEmails (PH-003)", () => {
  it("accepts valid ISO 8601 from date", () => {
    const result = searchEmailsArgsSchema.safeParse({ from: "2026-06-17T10:00:00Z" });
    expect(result.success).toBe(true);
  });

  it("accepts valid ISO 8601 to date", () => {
    const result = searchEmailsArgsSchema.safeParse({ to: "2026-06-30T23:59:59Z" });
    expect(result.success).toBe(true);
  });

  it("accepts no dates (both optional)", () => {
    const result = searchEmailsArgsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects 'tomorrow' as from date", () => {
    const result = searchEmailsArgsSchema.safeParse({ from: "tomorrow" });
    expect(result.success).toBe(false);
  });

  it("rejects 'next week' as to date", () => {
    const result = searchEmailsArgsSchema.safeParse({ to: "next week" });
    expect(result.success).toBe(false);
  });

  it("rejects plain date without time component", () => {
    const result = searchEmailsArgsSchema.safeParse({ from: "2026-06-17" });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary string", () => {
    const result = searchEmailsArgsSchema.safeParse({ from: "abc123" });
    expect(result.success).toBe(false);
  });
});

describe("Date validation — getEvents (PH-003)", () => {
  it("accepts valid ISO 8601 timeMin", () => {
    const result = getEventsArgsSchema.safeParse({ timeMin: "2026-06-17T00:00:00Z" });
    expect(result.success).toBe(true);
  });

  it("accepts valid ISO 8601 timeMax", () => {
    const result = getEventsArgsSchema.safeParse({ timeMax: "2026-06-30T23:59:59Z" });
    expect(result.success).toBe(true);
  });

  it("accepts no dates (both optional)", () => {
    const result = getEventsArgsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects 'tomorrow afternoon' as timeMin", () => {
    const result = getEventsArgsSchema.safeParse({ timeMin: "tomorrow afternoon" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric string as timeMax", () => {
    const result = getEventsArgsSchema.safeParse({ timeMax: "123456" });
    expect(result.success).toBe(false);
  });
});

describe("Date validation — calendarSync (PH-003)", () => {
  it("accepts valid ISO 8601 timeMin and timeMax", () => {
    const result = calendarSyncBodySchema.safeParse({
      timeMin: "2026-01-01T00:00:00Z",
      timeMax: "2026-12-31T23:59:59Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-ISO string for timeMin", () => {
    const result = calendarSyncBodySchema.safeParse({ timeMin: "random text" });
    expect(result.success).toBe(false);
  });
});
