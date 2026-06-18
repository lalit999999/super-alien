import { type NextRequest } from "next/server";
import { handleGetHistory } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleGetHistory(req);
  } catch (err) {
    console.error("[api/billing/history] GET:", err);
    return fail("Failed to fetch history", "INTERNAL_ERROR", 500);
  }
}
