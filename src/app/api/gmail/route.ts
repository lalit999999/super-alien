import { type NextRequest } from "next/server";
import { handleListEmails } from "@/modules/gmail";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleListEmails(req);
  } catch (err) {
    console.error("[gmail] GET:", err);
    return fail("Failed to retrieve emails", "FETCH_FAILED", 500);
  }
}
