import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { fail } from "@/lib/response";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";
import { AiRepository, AiService, openai } from "@/modules/ai";
import { AgentRepository, AgentService, AgentWorkflow, handleAgentChat } from "@/modules/agent";
import { SyncRepository, SyncService } from "@/modules/sync";

// ─── Dependency injection ─────────────────────────────────────────────────────

const gmailRepo = new GmailRepository(prisma);
const calendarRepo = new CalendarRepository(prisma);
const aiRepo = new AiRepository(prisma);

const aiService = new AiService(openai, aiRepo);
const gmailService = new GmailService(gmailRepo, aiService);
const calendarService = new CalendarService(calendarRepo);

const syncRepo = new SyncRepository(prisma);
const syncService = new SyncService(syncRepo, gmailService, calendarService);

const workflow = new AgentWorkflow(gmailService, calendarService, aiService, syncService);
const agentRepo = new AgentRepository();
const agentService = new AgentService(openai, agentRepo, workflow);

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    return await handleAgentChat(req, agentService);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return fail(message, "INTERNAL_ERROR", 500);
  }
}
