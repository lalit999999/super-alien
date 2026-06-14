import { type NextRequest } from "next/server";
import { handleClassify } from "@/modules/ai";

export async function POST(req: NextRequest) {
  return handleClassify(req);
}
