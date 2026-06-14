import { requireAuth } from "@/lib/auth";
import { getEvents, createEvent } from "@/modules/corsair";
import { createCalendarEventSchema } from "@/modules/calendar/calendar.schema";

// GET /api/test-auth/events — list upcoming calendar events
export async function GET() {
  try {
    const { userId } = await requireAuth();

    const result = await getEvents(userId, {
      maxResults: 5,
      timeMin: new Date().toISOString(),
    });

    return Response.json({
      ok: true,
      userId,
      count: result.items?.length ?? 0,
      items: result.items ?? [],
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/test-auth/events — create a calendar event
// Body: { summary, start: { dateTime }, end: { dateTime }, description?, attendees? }
export async function POST(req: Request) {
  try {
    const { userId } = await requireAuth();

    const json = await req.json();
    const parsed = createCalendarEventSchema.safeParse(json);

    if (!parsed.success) {
      return Response.json(
        { ok: false, error: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await createEvent(userId, { event: parsed.data });

    return Response.json({ ok: true, userId, result });
  } catch (error) {
    return Response.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
