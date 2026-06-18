import { prisma } from "@/lib/prisma";
import { openai } from "@/modules/ai";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";
import { AiRepository, AiService } from "@/modules/ai";
import { AgentRepository, AgentService, AgentWorkflow } from "@/modules/agent";
import { SyncRepository, SyncService } from "@/modules/sync";
import { ChatRepository, ChatService } from "@/modules/chat";
import { cacheService } from "@/modules/cache";
import { rateLimitService } from "@/modules/rate-limit";
import { UsageRepository } from "@/modules/usage/usage.repository";
import { UsageService } from "@/modules/usage/usage.service";

const gmailRepo = new GmailRepository(prisma);
const calendarRepo = new CalendarRepository(prisma);
const aiRepo = new AiRepository(prisma);
const usageService = new UsageService(new UsageRepository(prisma));
const aiService = new AiService(openai, aiRepo, usageService);
const gmailService = new GmailService(gmailRepo, aiService, cacheService, rateLimitService);
const calendarService = new CalendarService(calendarRepo, cacheService);
const syncRepo = new SyncRepository(prisma);
const syncService = new SyncService(syncRepo, gmailService, calendarService);
const workflow = new AgentWorkflow(gmailService, calendarService, aiService, syncService);
const agentRepo = new AgentRepository();
const agentService = new AgentService(openai, agentRepo, workflow);
const chatRepo = new ChatRepository(prisma);

export const chatService = new ChatService(chatRepo, agentService, cacheService);
