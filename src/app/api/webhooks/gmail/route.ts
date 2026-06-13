import { type NextRequest } from "next/server";
import { handleGmailWebhook } from "@/modules/webhooks";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleGmailWebhook(req);
  } catch (err) {
    console.error("[webhooks/gmail] POST:", err);
    return fail("Webhook processing failed", "WEBHOOK_FAILED", 500);
  }
}
