import type { PrismaClient } from "@/config/generated/prisma/client";
import type { GmailUpsertInput, DbEmail } from "@/modules/gmail";
import type { CalendarEventUpsertInput, DbCalendarEvent } from "@/modules/calendar";

export class WebhookRepository {
  constructor(private readonly db: PrismaClient) {}

  async findUserByClerkId(clerkUserId: string) {
    return this.db.user.findUnique({ where: { clerkUserId } });
  }

  async upsertEmail(input: GmailUpsertInput): Promise<DbEmail> {
    const now = new Date();
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
        syncedAt: now,
      },
      update: {
        threadId: input.threadId ?? null,
        subject: input.subject,
        sender: input.sender,
        snippet: input.snippet ?? null,
        body: input.body ?? null,
        receivedAt: input.receivedAt,
        syncedAt: now,
      },
    });
  }

  async upsertCalendarEvent(
    input: CalendarEventUpsertInput
  ): Promise<DbCalendarEvent> {
    const now = new Date();
    return this.db.calendarEvent.upsert({
      where: { corsairEventId: input.corsairEventId },
      create: {
        corsairEventId: input.corsairEventId,
        userId: input.userId,
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingLink: input.meetingLink ?? null,
        syncedAt: now,
      },
      update: {
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingLink: input.meetingLink ?? null,
        syncedAt: now,
      },
    });
  }
}
