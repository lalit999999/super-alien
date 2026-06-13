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

// Shape stored in our own database, synced from Clerk via webhook
export type DbUser = {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};
