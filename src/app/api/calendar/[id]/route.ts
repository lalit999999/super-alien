import { type NextRequest } from "next/server";
import { handleGetEvent, handleUpdateEvent, handleDeleteEvent } from "@/modules/calendar";
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleUpdateEvent(req, context);
  } catch (err) {
    console.error("[calendar/[id]] PATCH:", err);
    return fail("Failed to update calendar event", "UPDATE_FAILED", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleDeleteEvent(req, context);
  } catch (err) {
    console.error("[calendar/[id]] DELETE:", err);
    return fail("Failed to delete calendar event", "DELETE_FAILED", 500);
  }
}
