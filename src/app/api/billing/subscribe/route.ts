import { type NextRequest } from "next/server";
import { handleCreateSubscription } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleCreateSubscription(req);
  } catch (err) {
    console.error("[api/billing/subscribe] POST:", err);
    return fail("Subscription creation failed", "INTERNAL_ERROR", 500);
  }
}
