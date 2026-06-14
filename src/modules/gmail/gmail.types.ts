import type { EmailModel } from "@/config/generated/prisma/models/Email";
import type { SendEmailInput as CorsairSendEmailInput } from "@/modules/corsair";

export type DbEmail = EmailModel;

export type GmailUpsertInput = {
  corsairEmailId: string;
  clerkUserId: string;
  threadId?: string | null;
  subject: string;
  sender: string;
  snippet?: string | null;
  body?: string | null;
  isRead?: boolean;
  receivedAt: Date;
};

export type ParsedMessage = {
  corsairEmailId: string;
  threadId?: string;
  subject: string;
  sender: string;
  snippet?: string;
  body?: string;
  isRead: boolean;
  receivedAt: Date;
};

export type GmailSyncResult = {
  synced: number;
  skipped: number;
};

export type GmailListOptions = {
  limit?: number;
  offset?: number;
};

export type GmailPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SendEmailInput = CorsairSendEmailInput;
