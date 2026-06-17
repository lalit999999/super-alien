import { type NextRequest } from "next/server";
import { fail } from "@/lib/response";
import { handleSendMessage } from "@/modules/chat";
import { chatService } from "../../../_deps";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await handleSendMessage(req, id, chatService);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
