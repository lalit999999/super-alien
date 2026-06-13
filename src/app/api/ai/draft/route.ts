import { type NextRequest } from "next/server";
import { handleGenerateDraft } from "@/modules/ai";

export async function POST(req: NextRequest) {
  return handleGenerateDraft(req);
}
