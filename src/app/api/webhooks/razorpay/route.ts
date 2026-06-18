import { type NextRequest } from "next/server";
import { handleRazorpayWebhook } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleRazorpayWebhook(req);
  } catch (err) {
    console.error("[webhooks/razorpay] POST:", err);
    return fail("Webhook processing failed", "WEBHOOK_FAILED", 500);
  }
}
