import { type NextRequest } from "next/server";
import { handleDeleteAccount } from "@/modules/auth/auth.controller";
import { fail } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    return await handleDeleteAccount(req);
  } catch {
    return fail("Failed to delete account", "DELETE_FAILED", 500);
  }
}
