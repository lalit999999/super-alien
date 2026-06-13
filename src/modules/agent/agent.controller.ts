import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { agentChatRequestSchema } from "./agent.schema";
import type { AgentService } from "./agent.service";

export async function handleAgentChat(
  req: NextRequest,
  service: AgentService
) {
  const session = await requireAuth();

  const body = await req.json().catch(() => null);
  const parsed = agentChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0].message, "VALIDATION_ERROR", 400);
  }

  const result = await service.chat({
    userId: session.userId,
    prompt: parsed.data.prompt,
  });

  if (result.status === "FAILED") {
    return fail(result.response, "AGENT_FAILED", 500);
  }

  return ok(result);
}
