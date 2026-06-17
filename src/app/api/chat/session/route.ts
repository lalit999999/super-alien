import { type NextRequest } from "next/server";
import { fail } from "@/lib/response";
import { handleCreateSession } from "@/modules/chat";
import { chatService } from "../_deps";

export async function POST(req: NextRequest) {
  try {
    return await handleCreateSession(req, chatService);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
