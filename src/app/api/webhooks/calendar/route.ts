import { type NextRequest } from "next/server";
import { handleCalendarWebhook } from "@/modules/webhooks";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleCalendarWebhook(req);
  } catch (err) {
    console.error("[webhooks/calendar] POST:", err);
    return fail("Webhook processing failed", "WEBHOOK_FAILED", 500);
  }
}
