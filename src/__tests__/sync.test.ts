import { describe, it, expect, vi, beforeEach } from "vitest";
import { triggerSyncSchema } from "@/modules/sync/sync.schema";
import {
  triggerSyncArgsSchema,
  getSyncStatusArgsSchema,
  checkProgressArgsSchema,
} from "@/modules/agent/agent.schema";

// ─── Sync schema tests ─────────────────────────────────────────────────────────

describe("triggerSyncSchema", () => {
  it("accepts gmail integration", () => {
    const result = triggerSyncSchema.parse({ integration: "gmail" });
    expect(result.integration).toBe("gmail");
  });

  it("accepts calendar integration", () => {
    const result = triggerSyncSchema.parse({ integration: "calendar" });
    expect(result.integration).toBe("calendar");
  });

  it("rejects invalid integration", () => {
    expect(() => triggerSyncSchema.parse({ integration: "slack" })).toThrow();
  });

  it("rejects missing integration", () => {
    expect(() => triggerSyncSchema.parse({})).toThrow();
  });
});

describe("triggerSyncArgsSchema (agent)", () => {
  it("accepts gmail", () => {
    expect(() => triggerSyncArgsSchema.parse({ integration: "gmail" })).not.toThrow();
  });

  it("accepts calendar", () => {
    expect(() => triggerSyncArgsSchema.parse({ integration: "calendar" })).not.toThrow();
  });
});

describe("getSyncStatusArgsSchema (agent)", () => {
  it("accepts empty object", () => {
    expect(() => getSyncStatusArgsSchema.parse({})).not.toThrow();
  });
});

describe("checkProgressArgsSchema (agent)", () => {
  it("accepts empty object", () => {
    expect(() => checkProgressArgsSchema.parse({})).not.toThrow();
  });
});

// ─── SyncService unit tests ────────────────────────────────────────────────────

describe("SyncService", () => {
  const mockRepo = {
    createSyncRecord: vi.fn(),
    updateStatus: vi.fn(),
    getLatestByIntegration: vi.fn(),
    getLatestForUser: vi.fn(),
  };

  const mockGmail = {
    syncEmailsFromCorsair: vi.fn(),
  };

  const mockCalendar = {
    syncEventsFromCorsair: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggerSync creates a sync record and returns started status", async () => {
    mockRepo.createSyncRecord.mockResolvedValue({
      id: "record-1",
      status: "PENDING",
      integration: "gmail",
    });
    mockRepo.updateStatus.mockResolvedValue(undefined);
    mockGmail.syncEmailsFromCorsair.mockResolvedValue({ synced: 10, skipped: 0 });

    const { SyncService } = await import("@/modules/sync/sync.service");
    const service = new SyncService(mockRepo as never, mockGmail as never, mockCalendar as never);
    const result = await service.triggerSync("clerk-u1", "db-u1", "gmail");

    expect(result.status).toBe("started");
    expect(result.syncRecordId).toBe("record-1");
    expect(mockRepo.createSyncRecord).toHaveBeenCalledWith("db-u1", "gmail");
  });

  it("getSyncStatus returns status from latest records", async () => {
    mockRepo.getLatestByIntegration
      .mockResolvedValueOnce({ status: "COMPLETED", integration: "gmail" })
      .mockResolvedValueOnce({ status: "RUNNING", integration: "calendar" });

    const { SyncService } = await import("@/modules/sync/sync.service");
    const service = new SyncService(mockRepo as never, mockGmail as never, mockCalendar as never);
    const result = await service.getSyncStatus("db-u1");

    expect(result.gmailStatus).toBe("COMPLETED");
    expect(result.calendarStatus).toBe("RUNNING");
  });

  it("getSyncStatus returns null when no records exist", async () => {
    mockRepo.getLatestByIntegration.mockResolvedValue(null);

    const { SyncService } = await import("@/modules/sync/sync.service");
    const service = new SyncService(mockRepo as never, mockGmail as never, mockCalendar as never);
    const result = await service.getSyncStatus("db-u1");

    expect(result.gmailStatus).toBeNull();
    expect(result.calendarStatus).toBeNull();
  });

  it("checkProgress returns progress and total", async () => {
    mockRepo.getLatestByIntegration
      .mockResolvedValueOnce({ status: "RUNNING", progress: 42, total: 100, integration: "gmail" })
      .mockResolvedValueOnce({ status: "COMPLETED", progress: 30, total: 30, integration: "calendar" });

    const { SyncService } = await import("@/modules/sync/sync.service");
    const service = new SyncService(mockRepo as never, mockGmail as never, mockCalendar as never);
    const result = await service.checkProgress("db-u1");

    expect(result.gmailProgress).toBe(42);
    expect(result.gmailTotal).toBe(100);
    expect(result.calendarProgress).toBe(30);
    expect(result.calendarTotal).toBe(30);
  });

  it("checkProgress returns zeros when no records", async () => {
    mockRepo.getLatestByIntegration.mockResolvedValue(null);

    const { SyncService } = await import("@/modules/sync/sync.service");
    const service = new SyncService(mockRepo as never, mockGmail as never, mockCalendar as never);
    const result = await service.checkProgress("db-u1");

    expect(result.gmailProgress).toBe(0);
    expect(result.calendarProgress).toBe(0);
  });
});
