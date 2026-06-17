import { type NextRequest } from "next/server";
import { handleDeleteEmail } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleDeleteEmail(req, context);
  } catch (err) {
    console.error("[gmail/[id]/trash] POST:", err);
    return fail("Failed to delete email", "ACTION_FAILED", 500);
  }
}
