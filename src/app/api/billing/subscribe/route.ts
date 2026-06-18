import { type NextRequest } from "next/server";
import { handleCreateOrder } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleCreateOrder(req);
  } catch (err) {
    console.error("[api/billing/subscribe] POST:", err);
    return fail("Order creation failed", "INTERNAL_ERROR", 500);
  }
}
