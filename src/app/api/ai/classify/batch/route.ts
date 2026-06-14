import { type NextRequest } from "next/server";
import { handleBatchClassify } from "@/modules/ai";

export async function POST(req: NextRequest) {
  return handleBatchClassify(req);
}
