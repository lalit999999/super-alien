import type { GmailService } from "@/modules/gmail";
import type { CalendarService } from "@/modules/calendar";
import type { SyncRepository } from "./sync.repository";
import type {
  SyncIntegration,
  TriggerSyncResult,
  SyncStatusResult,
  SyncProgressResult,
} from "./sync.types";

function log(prefix: string, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`${ts} [${prefix}] ${message}${metaStr}`);
}

export class SyncService {
  constructor(
    private readonly repo: SyncRepository,
    private readonly gmail: GmailService,
    private readonly calendar: CalendarService
  ) {}

  async triggerSync(
    clerkUserId: string,
    dbUserId: string,
    integration: SyncIntegration
  ): Promise<TriggerSyncResult> {
    log("SYNC", "Creating sync record", { integration });
    const record = await this.repo.createSyncRecord(dbUserId, integration);

    this.runSync(clerkUserId, dbUserId, record.id, integration).catch((err) => {
      const error = err instanceof Error ? err.message : String(err);
      log("SYNC", "Background sync failed", { integration, error });
      this.repo.updateStatus(record.id, "FAILED", { error, completedAt: new Date() }).catch(() => undefined);
    });

    return { status: "started", syncRecordId: record.id };
  }

  private async runSync(
    clerkUserId: string,
    dbUserId: string,
    recordId: string,
    integration: SyncIntegration
  ): Promise<void> {
    log("SYNC", "Starting sync", { integration, recordId });
    await this.repo.updateStatus(recordId, "RUNNING", { total: 100, progress: 0 });

    if (integration === "gmail") {
      const result = await this.gmail.syncEmailsFromCorsair(clerkUserId);
      await this.repo.updateStatus(recordId, "COMPLETED", {
        progress: result.synced,
        total: result.synced + result.skipped,
        completedAt: new Date(),
      });
    } else {
      const result = await this.calendar.syncEventsFromCorsair(clerkUserId, dbUserId);
      await this.repo.updateStatus(recordId, "COMPLETED", {
        progress: result.synced,
        total: result.synced + result.skipped,
        completedAt: new Date(),
      });
    }

    log("SYNC", "Sync completed", { integration, recordId });
  }

  async getSyncStatus(dbUserId: string): Promise<SyncStatusResult> {
    const [gmail, calendar] = await Promise.all([
      this.repo.getLatestByIntegration(dbUserId, "gmail"),
      this.repo.getLatestByIntegration(dbUserId, "calendar"),
    ]);

    return {
      gmailStatus: gmail?.status ?? null,
      calendarStatus: calendar?.status ?? null,
    };
  }

  async checkProgress(dbUserId: string): Promise<SyncProgressResult> {
    const [gmail, calendar] = await Promise.all([
      this.repo.getLatestByIntegration(dbUserId, "gmail"),
      this.repo.getLatestByIntegration(dbUserId, "calendar"),
    ]);

    return {
      gmailProgress: gmail?.progress ?? 0,
      gmailTotal: gmail?.total ?? 0,
      calendarProgress: calendar?.progress ?? 0,
      calendarTotal: calendar?.total ?? 0,
    };
  }
}
