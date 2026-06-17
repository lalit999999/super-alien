import { type NextRequest } from "next/server";
import { handleArchiveEmail } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    return await handleArchiveEmail(req, context);
  } catch (err) {
    console.error("[gmail/[id]/archive] POST:", err);
    return fail("Failed to archive email", "ACTION_FAILED", 500);
  }
}
