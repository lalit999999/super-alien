import { type NextRequest } from "next/server";
import { handleVerifyPayment } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleVerifyPayment(req);
  } catch (err) {
    console.error("[api/billing/verify] POST:", err);
    return fail("Payment verification failed", "INTERNAL_ERROR", 500);
  }
}
