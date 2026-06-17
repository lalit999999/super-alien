import type { PrismaClient } from "@/config/generated/prisma/client";
import type { SyncIntegration, SyncStatusValue, SyncRecord } from "./sync.types";

export class SyncRepository {
  constructor(private readonly db: PrismaClient) {}

  async createSyncRecord(userId: string, integration: SyncIntegration): Promise<SyncRecord> {
    return this.db.syncRecord.create({
      data: {
        user: { connect: { id: userId } },
        integration,
        status: "PENDING",
        progress: 0,
        total: 0,
      },
    }) as Promise<SyncRecord>;
  }

  async updateStatus(
    id: string,
    status: SyncStatusValue,
    extra?: { progress?: number; total?: number; error?: string; completedAt?: Date }
  ): Promise<void> {
    await this.db.syncRecord.update({
      where: { id },
      data: {
        status,
        ...(extra?.progress !== undefined ? { progress: extra.progress } : {}),
        ...(extra?.total !== undefined ? { total: extra.total } : {}),
        ...(extra?.error !== undefined ? { error: extra.error } : {}),
        ...(extra?.completedAt ? { completedAt: extra.completedAt } : {}),
      },
    });
  }

  async getLatestByIntegration(
    userId: string,
    integration: SyncIntegration
  ): Promise<SyncRecord | null> {
    return this.db.syncRecord.findFirst({
      where: { userId, integration },
      orderBy: { startedAt: "desc" },
    }) as Promise<SyncRecord | null>;
  }

  async getLatestForUser(userId: string): Promise<SyncRecord[]> {
    const [gmail, calendar] = await Promise.all([
      this.getLatestByIntegration(userId, "gmail"),
      this.getLatestByIntegration(userId, "calendar"),
    ]);
    return [gmail, calendar].filter(Boolean) as SyncRecord[];
  }
}
