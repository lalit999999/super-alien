import { type NextRequest } from "next/server";
import { handleSummarize } from "@/modules/ai";

export async function POST(req: NextRequest) {
  return handleSummarize(req);
}
