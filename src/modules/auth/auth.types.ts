import type { User } from "@clerk/nextjs/server";

export type AuthUser = Pick<
  User,
  | "id"
  | "emailAddresses"
  | "firstName"
  | "lastName"
  | "imageUrl"
  | "createdAt"
  | "updatedAt"
>;

export type AuthSession = {
  userId: string;
  sessionId: string;
  orgId: string | undefined;
};

// Shape stored in our own database, synced from Clerk via webhook.
// Matches the User model in prisma/schema.prisma exactly.
export type DbUser = {
  id: string;
  clerkUserId: string;
  email: string;
  gmailConnected: boolean;
  calendarConnected: boolean;
  gmailConnectedAt: Date | null;
  calendarConnectedAt: Date | null;
  lastGmailSync: Date | null;
  lastCalendarSync: Date | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
