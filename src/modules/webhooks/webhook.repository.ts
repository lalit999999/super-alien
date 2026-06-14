import type { PrismaClient } from "@/config/generated/prisma/client";
import type { WebhookLogEntry } from "./webhook.types";

export class WebhookRepository {
  constructor(private readonly db: PrismaClient) {}

  async findUserByClerkId(clerkUserId: string) {
    return this.db.user.findUnique({ where: { clerkUserId } });
  }

  async createLog(entry: WebhookLogEntry): Promise<void> {
    try {
      await this.db.webhookLog.create({
        data: {
          provider: entry.provider,
          eventType: entry.eventType,
          entityId: entry.entityId ?? null,
          tenantId: entry.tenantId,
          status: entry.status,
          error: entry.error ?? null,
        },
      });
    } catch (err) {
      console.error("[webhook/log] Failed to write log:", err);
    }
  }

  async getRecentLogs(tenantId: string, limit = 20) {
    return this.db.webhookLog.findMany({
      where: { tenantId },
      orderBy: { processedAt: "desc" },
      take: limit,
    });
  }
}
