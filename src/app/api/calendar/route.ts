import { type NextRequest } from "next/server";
import { handleListEvents, handleCreateEvent } from "@/modules/calendar";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleListEvents(req);
  } catch (err) {
    console.error("[calendar] GET:", err);
    return fail("Failed to retrieve calendar events", "FETCH_FAILED", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleCreateEvent(req);
  } catch (err) {
    console.error("[calendar] POST:", err);
    return fail("Failed to create calendar event", "CREATE_FAILED", 500);
  }
}
