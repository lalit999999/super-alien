import { type NextRequest } from "next/server";
import { handleListEmails, handleSendEmail } from "@/modules/gmail/index";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleListEmails(req);
  } catch (err) {
    console.error("[gmail] GET:", err);
    return fail("Failed to retrieve emails", "FETCH_FAILED", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleSendEmail(req);
  } catch (err) {
    console.error("[gmail] POST:", err);
    return fail("Failed to send email", "SEND_FAILED", 500);
  }
}
