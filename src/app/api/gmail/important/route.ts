import { type NextRequest } from "next/server";
import { handleListImportant } from "@/modules/gmail/gmail.controller";
import { fail } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    return await handleListImportant(req);
  } catch {
    return fail("Failed to fetch important emails", "FETCH_FAILED", 500);
  }
}
