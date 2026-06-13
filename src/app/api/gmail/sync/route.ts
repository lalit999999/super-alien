import { type NextRequest } from "next/server";
import { handleSync } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleSync(req);
  } catch (err) {
    console.error("[gmail/sync] POST:", err);
    return fail("Failed to sync emails", "SYNC_FAILED", 500);
  }
}
