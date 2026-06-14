import { type NextRequest } from "next/server";
import { handleGetEmail, handleMarkAsRead } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleGetEmail(req, context);
  } catch (err) {
    console.error("[gmail/[id]] GET:", err);
    return fail("Failed to retrieve email", "FETCH_FAILED", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleMarkAsRead(req, context);
  } catch (err) {
    console.error("[gmail/[id]] PATCH:", err);
    return fail("Failed to mark email as read", "UPDATE_FAILED", 500);
  }
}
