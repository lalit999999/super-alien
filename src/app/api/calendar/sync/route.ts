import { type NextRequest } from "next/server";
import { handleSync } from "@/modules/calendar";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleSync(req);
  } catch (err) {
    console.error("[calendar/sync] POST:", err);
    return fail("Failed to sync calendar events", "SYNC_FAILED", 500);
  }
}
