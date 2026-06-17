import { prisma } from "@/lib/prisma";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";
import { AiRepository, AiService } from "@/modules/ai";
import { openai } from "@/modules/ai";
import { SyncRepository, SyncService } from "@/modules/sync";
import { cacheService } from "@/modules/cache";
import { rateLimitService } from "@/modules/rate-limit";

const gmailRepo = new GmailRepository(prisma);
const calendarRepo = new CalendarRepository(prisma);
const aiRepo = new AiRepository(prisma);
const aiService = new AiService(openai, aiRepo);
const gmailService = new GmailService(gmailRepo, aiService, cacheService, rateLimitService);
const calendarService = new CalendarService(calendarRepo, cacheService);
const syncRepo = new SyncRepository(prisma);

export const syncService = new SyncService(syncRepo, gmailService, calendarService);
