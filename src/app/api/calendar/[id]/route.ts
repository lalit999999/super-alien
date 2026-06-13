import { type NextRequest } from "next/server";
import { handleGetEvent } from "@/modules/calendar";
import { fail } from "@/lib/response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleGetEvent(req, context);
  } catch (err) {
    console.error("[calendar/[id]] GET:", err);
    return fail("Failed to retrieve calendar event", "FETCH_FAILED", 500);
  }
}
