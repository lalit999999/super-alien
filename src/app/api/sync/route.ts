import { type NextRequest } from "next/server";
import { fail } from "@/lib/response";
import { handleTriggerSync } from "@/modules/sync";
import { syncService } from "./_deps";

export async function POST(req: NextRequest) {
  try {
    return await handleTriggerSync(req, syncService);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
