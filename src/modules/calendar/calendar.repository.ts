import type { PrismaClient } from "@/config/generated/prisma/client";
import { Prisma } from "@/config/generated/prisma/client";
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
        location: input.location ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingLink: input.meetingLink ?? null,
        status: input.status ?? null,
        organizer: input.organizer ?? null,
        attendees: input.attendees ?? Prisma.DbNull,
        colorId: input.colorId ?? "7",
        isAllDay: input.isAllDay ?? false,
        syncedAt: new Date(),
      },
      update: {
        title: input.title,
        description: input.description ?? null,
        location: input.location ?? null,
        startTime: input.startTime,
        endTime: input.endTime,
        meetingLink: input.meetingLink ?? null,
        status: input.status ?? null,
        organizer: input.organizer ?? null,
        attendees: input.attendees ?? Prisma.DbNull,
        colorId: input.colorId ?? "7",
        isAllDay: input.isAllDay ?? false,
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
          location: input.location ?? null,
          startTime: input.startTime,
          endTime: input.endTime,
          meetingLink: input.meetingLink ?? null,
          status: input.status ?? null,
          organizer: input.organizer ?? null,
          attendees: input.attendees ?? Prisma.DbNull,
          colorId: input.colorId ?? "7",
          isAllDay: input.isAllDay ?? false,
          syncedAt: now,
        },
        update: {
          title: input.title,
          description: input.description ?? null,
          location: input.location ?? null,
          startTime: input.startTime,
          endTime: input.endTime,
          meetingLink: input.meetingLink ?? null,
          status: input.status ?? null,
          organizer: input.organizer ?? null,
          attendees: input.attendees ?? Prisma.DbNull,
          colorId: input.colorId ?? "7",
          isAllDay: input.isAllDay ?? false,
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

  async findByCorsairEventId(
    corsairEventId: string,
    userId: string
  ): Promise<DbCalendarEvent | null> {
    return this.db.calendarEvent.findFirst({
      where: { corsairEventId, userId },
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

  async deleteEventById(id: string, userId: string): Promise<void> {
    await this.db.calendarEvent.deleteMany({
      where: { id, userId },
    });
  }

  async getUpcomingEvents(userId: string, limit = 10): Promise<DbCalendarEvent[]> {
    return this.db.calendarEvent.findMany({
      where: { userId, startTime: { gte: new Date() } },
      orderBy: { startTime: "asc" },
      take: limit,
    });
  }

  async getEventsByDateRange(
    userId: string,
    startTime: Date,
    endTime: Date
  ): Promise<DbCalendarEvent[]> {
    return this.db.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gte: startTime },
        endTime: { lte: endTime },
      },
      orderBy: { startTime: "asc" },
    });
  }
}
