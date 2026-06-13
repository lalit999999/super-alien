import type { PrismaClient } from "@/config/generated/prisma/client";
import type { DbCalendarEvent, CalendarEventUpsertInput } from "./calendar.types";

export class CalendarRepository {
  constructor(private readonly db: PrismaClient) {}

  async upsertEvent(input: CalendarEventUpsertInput): Promise<DbCalendarEvent> {
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
        syncedAt: new Date(),
      },
      update: {
        title: input.title,
        description: input.description ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingLink: input.meetingLink ?? null,
        syncedAt: new Date(),
      },
    });
  }

  async createManyEvents(inputs: CalendarEventUpsertInput[]): Promise<number> {
    const now = new Date();
    let synced = 0;

    for (const input of inputs) {
      await this.db.calendarEvent.upsert({
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
      synced++;
    }

    return synced;
  }

  async getEventsByUser(
    userId: string,
    limit: number,
    offset: number
  ): Promise<DbCalendarEvent[]> {
    return this.db.calendarEvent.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
      take: limit,
      skip: offset,
    });
  }

  async getEventById(id: string, userId: string): Promise<DbCalendarEvent | null> {
    return this.db.calendarEvent.findFirst({
      where: { id, userId },
    });
  }

  async countEventsByUser(userId: string): Promise<number> {
    return this.db.calendarEvent.count({ where: { userId } });
  }

  async deleteEvent(corsairEventId: string, userId: string): Promise<void> {
    await this.db.calendarEvent.deleteMany({
      where: { corsairEventId, userId },
    });
  }
}
