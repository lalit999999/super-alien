import { getEvents, createEvent, updateEvent as corsairUpdateEvent, deleteEvent as corsairDeleteEvent } from "@/modules/corsair";
import type { CalendarRepository } from "./calendar.repository";
import type {
  DbCalendarEvent,
  CalendarSyncResult,
  CalendarListOptions,
  CalendarEventUpsertInput,
} from "./calendar.types";
import type { CreateCalendarEventInput, UpdateCalendarEventInput } from "./calendar.schema";
import { CALENDAR_SYNC_MAX_RESULTS } from "./calendar.constants";

export class CalendarService {
  constructor(private readonly repo: CalendarRepository) {}

  async syncEventsFromCorsair(
    clerkUserId: string,
    dbUserId: string,
    options: { maxResults?: number; timeMin?: string; timeMax?: string } = {}
  ): Promise<CalendarSyncResult> {
    const result = await getEvents(clerkUserId, {
      maxResults: options.maxResults ?? CALENDAR_SYNC_MAX_RESULTS,
      timeMin: options.timeMin,
      timeMax: options.timeMax,
    });

    const items = result.items ?? [];
    if (items.length === 0) {
      return { synced: 0, skipped: 0 };
    }

    const inputs: CalendarEventUpsertInput[] = [];
    let skipped = 0;

    for (const event of items) {
      const parsed = parseEvent(event, dbUserId);
      if (!parsed) {
        skipped++;
        continue;
      }
      inputs.push(parsed);
    }

    const synced = await this.repo.createManyEvents(inputs);
    return { synced, skipped };
  }

  async getUserEvents(
    dbUserId: string,
    options: CalendarListOptions = {}
  ): Promise<{ events: DbCalendarEvent[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const [events, total] = await Promise.all([
      this.repo.getEventsByUser(dbUserId, limit, offset),
      this.repo.countEventsByUser(dbUserId),
    ]);

    return { events, total };
  }

  async getEventDetails(
    dbUserId: string,
    eventId: string
  ): Promise<DbCalendarEvent | null> {
    return this.repo.getEventById(eventId, dbUserId);
  }

  async getUpcomingEvents(dbUserId: string, limit = 10): Promise<DbCalendarEvent[]> {
    return this.repo.getUpcomingEvents(dbUserId, limit);
  }

  async createCalendarEvent(
    clerkUserId: string,
    dbUserId: string,
    input: CreateCalendarEventInput
  ): Promise<DbCalendarEvent> {
    const created = await createEvent(clerkUserId, {
      event: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: input.start,
        end: input.end,
        attendees: input.attendees,
      },
      sendUpdates: input.sendUpdates,
      conferenceDataVersion: input.conferenceDataVersion,
    });

    const parsed = parseEvent(created, dbUserId);
    if (!parsed) {
      throw new Error("Failed to parse event returned from Corsair");
    }

    return this.repo.upsertEvent(parsed);
  }

  async updateCalendarEvent(
    clerkUserId: string,
    dbUserId: string,
    corsairEventId: string,
    input: UpdateCalendarEventInput
  ): Promise<DbCalendarEvent> {
    const updated = await corsairUpdateEvent(clerkUserId, {
      id: corsairEventId,
      event: {
        summary: input.summary,
        description: input.description,
        location: input.location,
        start: input.start,
        end: input.end,
        attendees: input.attendees,
      },
      ...(input.sendUpdates ? { sendUpdates: input.sendUpdates } : {}),
    });

    const parsed = parseEvent(updated, dbUserId);
    if (!parsed) {
      throw new Error("Failed to parse updated event returned from Corsair");
    }

    return this.repo.upsertEvent(parsed);
  }

  async deleteCalendarEvent(
    clerkUserId: string,
    dbUserId: string,
    corsairEventId: string
  ): Promise<void> {
    await corsairDeleteEvent(clerkUserId, { id: corsairEventId });
    await this.repo.deleteEvent(corsairEventId, dbUserId);
  }

  async getEventsByDateRange(
    dbUserId: string,
    startTime: Date,
    endTime: Date
  ): Promise<DbCalendarEvent[]> {
    return this.repo.getEventsByDateRange(dbUserId, startTime, endTime);
  }

  async storeRawCalendarEvent(
    raw: RawEvent,
    dbUserId: string
  ): Promise<DbCalendarEvent | null> {
    const parsed = parseEvent(raw, dbUserId);
    if (!parsed) return null;
    return this.repo.upsertEvent(parsed);
  }

  async deleteCalendarEventFromDB(corsairEventId: string, dbUserId: string): Promise<void> {
    await this.repo.deleteEvent(corsairEventId, dbUserId);
  }
}

// ─── Parser helpers ───────────────────────────────────────────────────────────

type RawAttendee = {
  email?: string;
  displayName?: string;
  responseStatus?: string;
  optional?: boolean;
};

type RawEvent = {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  status?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: RawAttendee[];
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  hangoutLink?: string;
};

function parseEvent(
  raw: RawEvent,
  dbUserId: string
): CalendarEventUpsertInput | null {
  if (!raw.id || !raw.summary) return null;

  const startTime = parseDateTime(raw.start);
  const endTime = parseDateTime(raw.end);

  if (!startTime || !endTime) return null;

  const organizer = raw.organizer?.displayName ?? raw.organizer?.email ?? null;

  const attendees =
    raw.attendees && raw.attendees.length > 0
      ? raw.attendees.map((a) => ({
          email: a.email,
          displayName: a.displayName,
          responseStatus: a.responseStatus,
        }))
      : null;

  return {
    corsairEventId: raw.id,
    userId: dbUserId,
    title: raw.summary,
    description: raw.description ?? null,
    location: raw.location ?? null,
    startTime,
    endTime,
    meetingLink: raw.hangoutLink ?? null,
    status: raw.status ?? null,
    organizer,
    attendees,
  };
}

function parseDateTime(
  dt?: { dateTime?: string; date?: string }
): Date | null {
  if (!dt) return null;
  const raw = dt.dateTime ?? dt.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}
