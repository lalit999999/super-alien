import type { PrismaClient } from "@/config/generated/prisma/client";
import type { IntegrationStatus } from "./onboarding.types";

export class OnboardingRepository {
  constructor(private readonly db: PrismaClient) {}

  async findStatusByClerkUserId(clerkUserId: string): Promise<IntegrationStatus | null> {
    return this.db.user.findUnique({
      where: { clerkUserId },
      select: {
        gmailConnected: true,
        calendarConnected: true,
        gmailConnectedAt: true,
        calendarConnectedAt: true,
        lastGmailSync: true,
        lastCalendarSync: true,
        onboardingCompleted: true,
      },
    });
  }

  async findUserIdByClerkId(clerkUserId: string): Promise<string | null> {
    const user = await this.db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async markGmailConnected(clerkUserId: string, at: Date): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { gmailConnected: true, gmailConnectedAt: at },
    });
  }

  async markCalendarConnected(clerkUserId: string, at: Date): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { calendarConnected: true, calendarConnectedAt: at },
    });
  }

  async updateLastGmailSync(clerkUserId: string, at: Date): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { lastGmailSync: at },
    });
  }

  async updateLastCalendarSync(clerkUserId: string, at: Date): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { lastCalendarSync: at },
    });
  }

  async markOnboardingComplete(clerkUserId: string): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { onboardingCompleted: true },
    });
  }

  async resetOnboardingCompleted(clerkUserId: string): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: { onboardingCompleted: false },
    });
  }

  async disconnectGmail(clerkUserId: string): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: {
        gmailConnected: false,
        gmailConnectedAt: null,
        lastGmailSync: null,
      },
    });
  }

  async disconnectCalendar(clerkUserId: string): Promise<void> {
    await this.db.user.update({
      where: { clerkUserId },
      data: {
        calendarConnected: false,
        calendarConnectedAt: null,
        lastCalendarSync: null,
      },
    });
  }

  async findCorsairAccountByUserId(
    clerkUserId: string,
    integrationName: string
  ): Promise<{ config: Record<string, string>; dek: string | null } | null> {
    const account = await this.db.corsairAccount.findFirst({
      where: {
        tenantId: clerkUserId,
        integration: { name: integrationName },
      },
      select: { config: true, dek: true },
    });
    if (!account) return null;
    return {
      config: account.config as Record<string, string>,
      dek: account.dek,
    };
  }

  async deleteUserEmails(userId: string): Promise<void> {
    await this.db.email.deleteMany({ where: { userId } });
  }

  async deleteUserEvents(userId: string): Promise<void> {
    await this.db.calendarEvent.deleteMany({ where: { userId } });
  }
}
