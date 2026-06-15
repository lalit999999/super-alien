import type { OnboardingRepository } from "./onboarding.repository";
import type { IntegrationStatus, DisconnectPlugin, IntegrationSyncResult } from "./onboarding.types";
import type { GmailService } from "@/modules/gmail/gmail.service";
import type { CalendarService } from "@/modules/calendar/calendar.service";

export class OnboardingService {
  constructor(
    private readonly repo: OnboardingRepository,
    private readonly gmailService?: GmailService,
    private readonly calendarService?: CalendarService
  ) {}

  async getStatus(clerkUserId: string): Promise<IntegrationStatus | null> {
    return this.repo.findStatusByClerkUserId(clerkUserId);
  }

  async markGmailConnected(clerkUserId: string): Promise<void> {
    await this.repo.markGmailConnected(clerkUserId, new Date());
  }

  async markCalendarConnected(clerkUserId: string): Promise<void> {
    await this.repo.markCalendarConnected(clerkUserId, new Date());
  }

  async completeOnboarding(clerkUserId: string): Promise<void> {
    await this.repo.markOnboardingComplete(clerkUserId);
  }

  async syncAll(
    clerkUserId: string
  ): Promise<IntegrationSyncResult> {
    const status = await this.repo.findStatusByClerkUserId(clerkUserId);

    const result: IntegrationSyncResult = { gmail: null, calendar: null };

    if (status?.gmailConnected && this.gmailService) {
      result.gmail = await this.gmailService.syncEmailsFromCorsair(clerkUserId);
      await this.repo.updateLastGmailSync(clerkUserId, new Date());
    }

    if (status?.calendarConnected) {
      const userId = await this.repo.findUserIdByClerkId(clerkUserId);
      if (userId && this.calendarService) {
        result.calendar = await this.calendarService.syncEventsFromCorsair(clerkUserId, userId);
        await this.repo.updateLastCalendarSync(clerkUserId, new Date());
      }
    }

    return result;
  }

  async disconnect(clerkUserId: string, plugin: DisconnectPlugin): Promise<void> {
    const userId = await this.repo.findUserIdByClerkId(clerkUserId);
    if (!userId) throw new Error("User not found");

    if (plugin === "gmail" || plugin === "all") {
      await this.repo.disconnectGmail(clerkUserId);
      await this.repo.deleteUserEmails(userId);
    }

    if (plugin === "calendar" || plugin === "all") {
      await this.repo.disconnectCalendar(clerkUserId);
      await this.repo.deleteUserEvents(userId);
    }

    // Any disconnection breaks the fully-connected state
    await this.repo.resetOnboardingCompleted(clerkUserId);
  }
}
