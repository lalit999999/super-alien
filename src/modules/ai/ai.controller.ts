import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { AiRepository } from "./ai.repository";
import { AiService } from "./ai.service";
import { openai } from "./ai.provider";
import { generateDraftRequestSchema } from "./ai.schema";

function makeService(): AiService {
  return new AiService(openai, new AiRepository(prisma));
}

export async function handleGenerateDraft(req: NextRequest) {
  await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = generateDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const service = makeService();
  const draft = await service.generateDraft(parsed.data);

  return ok(draft);
}
