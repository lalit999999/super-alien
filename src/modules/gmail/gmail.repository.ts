import type { PrismaClient } from "@/config/generated/prisma/client";
import type { DbEmail, GmailUpsertInput, DbEmailSearchOptions } from "./gmail.types";

export class GmailRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertEmail(input: GmailUpsertInput): Promise<DbEmail> {
    return this.db.email.upsert({
      where: { corsairEmailId: input.corsairEmailId },
      create: {
        corsairEmailId: input.corsairEmailId,
        user: { connect: { clerkUserId: input.clerkUserId } },
        threadId: input.threadId ?? null,
        subject: input.subject,
        sender: input.sender,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
        isRead: input.isRead ?? false,
        receivedAt: input.receivedAt,
        syncedAt: new Date(),
      },
      update: {
        threadId: input.threadId ?? null,
        subject: input.subject,
        sender: input.sender,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
        isRead: input.isRead ?? false,
        receivedAt: input.receivedAt,
        syncedAt: new Date(),
      },
    });
  }

  async createManyEmails(inputs: GmailUpsertInput[]): Promise<number> {
    const now = new Date();
    let synced = 0;

    for (const input of inputs) {
      await this.db.email.upsert({
        where: { corsairEmailId: input.corsairEmailId },
        create: {
          corsairEmailId: input.corsairEmailId,
          user: { connect: { clerkUserId: input.clerkUserId } },
          threadId: input.threadId ?? null,
          subject: input.subject,
          sender: input.sender,
          snippet: input.snippet ?? null,
          body: input.body ?? null,
          isRead: input.isRead ?? false,
          receivedAt: input.receivedAt,
          syncedAt: now,
        },
        update: {
          subject: input.subject,
          sender: input.sender,
          snippet: input.snippet ?? null,
          body: input.body ?? null,
          isRead: input.isRead ?? false,
          receivedAt: input.receivedAt,
          syncedAt: now,
        },
      });
      synced++;
    }

    return synced;
  }

  async getEmailsByUser(
    clerkUserId: string,
    limit: number,
    offset: number
  ): Promise<DbEmail[]> {
    return this.db.email.findMany({
      where: { user: { clerkUserId } },
      orderBy: { receivedAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getEmailById(id: string, clerkUserId: string): Promise<DbEmail | null> {
    return this.db.email.findFirst({
      where: { id, user: { clerkUserId } },
    });
  }

  async countEmailsByUser(clerkUserId: string): Promise<number> {
    return this.db.email.count({ where: { user: { clerkUserId } } });
  }

  async markAsRead(id: string, clerkUserId: string): Promise<DbEmail | null> {
    const email = await this.db.email.findFirst({
      where: { id, user: { clerkUserId } },
    });
    if (!email) return null;

    return this.db.email.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async getEmailsWithoutClassification(clerkUserId: string, limit: number): Promise<DbEmail[]> {
    return this.db.email.findMany({
      where: { user: { clerkUserId }, classification: null },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });
  }

  async deleteEmailByCorsairId(corsairEmailId: string, clerkUserId: string): Promise<void> {
    await this.db.email.deleteMany({
      where: { corsairEmailId, user: { clerkUserId } },
    });
  }

  async updateReadStatusByCorsairId(
    corsairEmailId: string,
    clerkUserId: string,
    isRead: boolean
  ): Promise<void> {
    await this.db.email.updateMany({
      where: { corsairEmailId, user: { clerkUserId } },
      data: { isRead },
    });
  }

  async getImportantEmails(clerkUserId: string, limit: number): Promise<DbEmail[]> {
    return this.db.email.findMany({
      where: {
        user: { clerkUserId },
        classification: { priority: { in: ["URGENT", "IMPORTANT"] } },
      },
      include: { classification: true },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });
  }

  async searchEmailsInDb(
    clerkUserId: string,
    options: DbEmailSearchOptions
  ): Promise<DbEmail[]> {
    const { q, sender, category, from, to, limit = 20 } = options;

    return this.db.email.findMany({
      where: {
        user: { clerkUserId },
        ...(q
          ? {
              OR: [
                { subject: { contains: q, mode: "insensitive" } },
                { snippet: { contains: q, mode: "insensitive" } },
                { sender: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(sender ? { sender: { contains: sender, mode: "insensitive" } } : {}),
        ...(category ? { classification: { category } } : {}),
        ...((from ?? to)
          ? {
              receivedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });
  }
}
