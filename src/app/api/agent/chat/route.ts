import { type NextRequest } from "next/server";
import { handleAgentChat } from "@/modules/agent";
import { AgentService } from "@/modules/agent";
import { AgentRepository } from "@/modules/agent";
import { openai } from "@/modules/ai";
import { fail } from "@/lib/response";

const repo = new AgentRepository();
const service = new AgentService(openai, repo);

export async function POST(req: NextRequest) {
  try {
    return await handleAgentChat(req, service);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
