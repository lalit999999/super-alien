import { type NextRequest } from "next/server";
import { handleMarkAsUnread } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleMarkAsUnread(req, context);
  } catch (err) {
    console.error("[gmail/[id]/unread] PATCH:", err);
    return fail("Failed to mark email as unread", "UPDATE_FAILED", 500);
  }
}
