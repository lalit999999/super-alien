import type { PrismaClient } from "@/config/generated/prisma/client";
import type { DbEmail, GmailUpsertInput } from "./gmail.types";

export class GmailRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertEmail(input: GmailUpsertInput): Promise<DbEmail> {
    return this.db.email.upsert({
      where: { corsairEmailId: input.corsairEmailId },
      create: {
        corsairEmailId: input.corsairEmailId,
        userId: input.userId,
        threadId: input.threadId ?? null,
        subject: input.subject,
        sender: input.sender,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
        receivedAt: input.receivedAt,
        syncedAt: new Date(),
      },
      update: {
        threadId: input.threadId ?? null,
        subject: input.subject,
        sender: input.sender,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
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
          userId: input.userId,
          threadId: input.threadId ?? null,
          subject: input.subject,
          sender: input.sender,
          snippet: input.snippet ?? null,
          body: input.body ?? null,
          receivedAt: input.receivedAt,
          syncedAt: now,
        },
        update: {
          subject: input.subject,
          sender: input.sender,
          snippet: input.snippet ?? null,
          body: input.body ?? null,
          receivedAt: input.receivedAt,
          syncedAt: now,
        },
      });
      synced++;
    }

    return synced;
  }

  async getEmailsByUser(
    userId: string,
    limit: number,
    offset: number
  ): Promise<DbEmail[]> {
    return this.db.email.findMany({
      where: { userId },
      orderBy: { receivedAt: "desc" },
      take: limit,
      skip: offset,
    });
  }

  async getEmailById(id: string, userId: string): Promise<DbEmail | null> {
    return this.db.email.findFirst({
      where: { id, userId },
    });
  }

  async countEmailsByUser(userId: string): Promise<number> {
    return this.db.email.count({ where: { userId } });
  }
}
