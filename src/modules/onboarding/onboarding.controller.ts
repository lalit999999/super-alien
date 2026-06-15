import { requireAuth } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { OnboardingRepository } from "./onboarding.repository";
import { OnboardingService } from "./onboarding.service";
import { disconnectSchema } from "./onboarding.schema";
import { GmailRepository, GmailService } from "@/modules/gmail";
import { CalendarRepository, CalendarService } from "@/modules/calendar";
import { AuthRepository } from "@/modules/auth/auth.repository";
import { AuthService } from "@/modules/auth/auth.service";

function buildService() {
  const repo = new OnboardingRepository(prisma);
  const gmailRepo = new GmailRepository(prisma);
  const gmailService = new GmailService(gmailRepo);
  const calendarRepo = new CalendarRepository(prisma);
  const calendarService = new CalendarService(calendarRepo);
  return new OnboardingService(repo, gmailService, calendarService);
}

const DEFAULT_STATUS = {
  gmailConnected: false,
  calendarConnected: false,
  gmailConnectedAt: null,
  calendarConnectedAt: null,
  lastGmailSync: null,
  lastCalendarSync: null,
  onboardingCompleted: false,
} as const;

export async function handleGetStatus(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const repo = new OnboardingRepository(prisma);
    const service = new OnboardingService(repo);
    let status = await service.getStatus(userId);

    if (!status) {
      // User authenticated in Clerk but not yet in our DB (webhook not fired).
      // Auto-create them so the onboarding flow can proceed.
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      if (email) {
        const authRepo = new AuthRepository(prisma);
        const authService = new AuthService(authRepo);
        await authService.syncUser({ clerkUserId: userId, email });
        status = await service.getStatus(userId);
      }
    }

    return ok(status ?? DEFAULT_STATUS);
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
