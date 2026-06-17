import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { agentChatRequestSchema } from "./agent.schema";
import type { AgentService } from "./agent.service";

function isRateLimitMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("rate limit") ||
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  );
}

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
    sessionId: parsed.data.sessionId,
  });

  if (result.status === "FAILED") {
    if (isRateLimitMessage(result.response)) {
      return fail("AI provider rate limit exceeded. Please wait a moment and try again.", "RATE_LIMIT", 429);
    }
    return fail(result.response, "AGENT_FAILED", 500);
  }

  return ok(result);
}
