import { type NextRequest } from "next/server";
import { handleGetUsage } from "@/modules/billing";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleGetUsage(req);
  } catch (err) {
    console.error("[api/billing/usage] GET:", err);
    return fail("Failed to fetch usage", "INTERNAL_ERROR", 500);
  }
}
