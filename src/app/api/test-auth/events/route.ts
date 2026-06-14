import { auth } from "@clerk/nextjs/server";
import { getEvents, createEvent } from "@/modules/corsair";
import { createCalendarEventSchema } from "@/modules/calendar/calendar.schema";

async function resolveUserId(req: Request): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;
  // fallback for curl testing — pass ?userId=user_xxx
  return new URL(req.url).searchParams.get("userId");
}

// GET /api/test-auth/events?userId=user_xxx — list upcoming events
export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return Response.json({ ok: false, error: "userId required" }, { status: 401 });

    const result = await getEvents(userId, { maxResults: 5, timeMin: new Date().toISOString() });

    return Response.json({
      ok: true,
      userId,
      count: result.items?.length ?? 0,
      items: result.items ?? [],
    });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

// POST /api/test-auth/events?userId=user_xxx
// Body: { summary, start: { dateTime }, end: { dateTime }, description? }
export async function POST(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return Response.json({ ok: false, error: "userId required" }, { status: 401 });

    const json = await req.json();
    const parsed = createCalendarEventSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ ok: false, error: parsed.error.issues }, { status: 400 });
    }

    const result = await createEvent(userId, { event: parsed.data });

    return Response.json({ ok: true, userId, result });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
