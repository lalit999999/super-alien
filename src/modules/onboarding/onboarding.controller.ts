import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { OnboardingRepository } from "./onboarding.repository";
import { OnboardingService } from "./onboarding.service";
import { disconnectSchema } from "./onboarding.schema";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";

function buildService() {
  const repo = new OnboardingRepository(prisma);
  const gmailRepo = new GmailRepository(prisma);
  const gmailService = new GmailService(gmailRepo);
  const calendarRepo = new CalendarRepository(prisma);
  const calendarService = new CalendarService(calendarRepo);
  return new OnboardingService(repo, gmailService, calendarService);
}

export async function handleGetStatus(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const service = buildService();
    const status = await service.getStatus(userId);
    if (!status) return fail("User not found", "NOT_FOUND", 404);
    return ok(status);
  } catch (error) {
    return fail(String(error), "INTERNAL_ERROR", 500);
  }
}

export async function handleSync(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const service = buildService();
    const result = await service.syncAll(userId);
    return ok(result);
  } catch (error) {
    return fail(String(error), "INTERNAL_ERROR", 500);
  }
}

export async function handleCompleteOnboarding(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const service = buildService();
    await service.completeOnboarding(userId);
    return ok({ onboardingCompleted: true });
  } catch (error) {
    return fail(String(error), "INTERNAL_ERROR", 500);
  }
}

export async function handleDisconnect(req: Request) {
  try {
    const { userId } = await requireAuth();
    const body = await req.json();
    const { plugin } = disconnectSchema.parse(body);
    const service = buildService();
    await service.disconnect(userId, plugin);
    return ok({ disconnected: true });
  } catch (error) {
    return fail(String(error), "INTERNAL_ERROR", 500);
  }
}
