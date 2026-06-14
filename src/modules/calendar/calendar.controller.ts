import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { AuthRepository } from "@/modules/auth";
import { prisma } from "@/lib/prisma";
import { CalendarRepository } from "./calendar.repository";
import { CalendarService } from "./calendar.service";
import {
  calendarListQuerySchema,
  calendarSyncBodySchema,
  createCalendarEventSchema,
  updateCalendarEventSchema,
} from "./calendar.schema";
import {
  CALENDAR_ERRORS,
  CALENDAR_SYNC_MAX_RESULTS,
} from "./calendar.constants";

function makeService(): CalendarService {
  return new CalendarService(new CalendarRepository(prisma));
}

function makeAuthRepo(): AuthRepository {
  return new AuthRepository(prisma);
}

export async function handleSync(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = calendarSyncBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  const result = await makeService().syncEventsFromCorsair(clerkUserId, dbUser.id, {
    maxResults: parsed.data.maxResults ?? CALENDAR_SYNC_MAX_RESULTS,
    timeMin: parsed.data.timeMin,
    timeMax: parsed.data.timeMax,
  });

  return ok({ success: true, ...result });
}

export async function handleListEvents(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const { searchParams } = new URL(req.url);
  const queryParsed = calendarListQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!queryParsed.success) {
    console.error("[calendar] list query parse error:", JSON.stringify(queryParsed.error.issues));
    return fail("Invalid query parameters", "VALIDATION_ERROR");
  }

  const { page, limit } = queryParsed.data;
  const offset = (page - 1) * limit;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  const { events, total } = await makeService().getUserEvents(dbUser.id, { limit, offset });
  const totalPages = Math.ceil(total / limit);

  return ok({ events, pagination: { page, limit, total, totalPages } });
}

export async function handleCreateEvent(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = createCalendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((i) => i.message).join(", "),
      "VALIDATION_ERROR"
    );
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  const event = await makeService().createCalendarEvent(clerkUserId, dbUser.id, parsed.data);

  return ok({ success: true, event }, 201);
}

export async function handleGetEvent(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  const event = await makeService().getEventDetails(dbUser.id, id);
  if (!event) {
    return fail("Event not found", CALENDAR_ERRORS.EVENT_NOT_FOUND, 404);
  }

  return ok({ event });
}

export async function handleUpdateEvent(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = updateCalendarEventSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((i) => i.message).join(", "),
      "VALIDATION_ERROR"
    );
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  // Resolve DB record first to get the Corsair event ID
  const existing = await makeService().getEventDetails(dbUser.id, id);
  if (!existing) {
    return fail("Event not found", CALENDAR_ERRORS.EVENT_NOT_FOUND, 404);
  }

  const event = await makeService().updateCalendarEvent(
    clerkUserId,
    dbUser.id,
    existing.corsairEventId,
    parsed.data
  );

  return ok({ success: true, event });
}

export async function handleDeleteEvent(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", CALENDAR_ERRORS.USER_NOT_FOUND, 404);
  }

  // Resolve DB record first to get the Corsair event ID
  const existing = await makeService().getEventDetails(dbUser.id, id);
  if (!existing) {
    return fail("Event not found", CALENDAR_ERRORS.EVENT_NOT_FOUND, 404);
  }

  await makeService().deleteCalendarEvent(clerkUserId, dbUser.id, existing.corsairEventId);

  return ok({ success: true });
}
