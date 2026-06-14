import { type NextRequest, NextRequest as NR } from "next/server";
import { handleGenerateDraft, handleDraftFromEmail } from "@/modules/ai";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const cloned = new NR(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(body),
  });

  if (typeof body?.emailId === "string") {
    return handleDraftFromEmail(cloned);
  }

  return handleGenerateDraft(cloned);
}
