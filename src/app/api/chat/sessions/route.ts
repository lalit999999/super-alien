import { type NextRequest } from "next/server";
import { fail } from "@/lib/response";
import { handleListSessions } from "@/modules/chat";
import { chatService } from "../_deps";

export async function GET(req: NextRequest) {
  try {
    return await handleListSessions(req, chatService);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
