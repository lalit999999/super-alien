import { type NextRequest } from "next/server";
import { handleCancelSubscription } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleCancelSubscription(req);
  } catch (err) {
    console.error("[api/billing/cancel] POST:", err);
    return fail("Cancellation failed", "INTERNAL_ERROR", 500);
  }
}
