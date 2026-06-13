import { type NextRequest } from "next/server";
import { handleClassifyEmails } from "@/modules/gmail";

export async function POST(req: NextRequest) {
  return handleClassifyEmails(req);
}
