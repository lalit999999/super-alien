import type { EmailModel } from "@/config/generated/prisma/models/Email";
import type { SendEmailInput as CorsairSendEmailInput } from "@/modules/corsair";

export type DbEmail = EmailModel;

export type GmailUpsertInput = {
  corsairEmailId: string;
  userId: string;
  threadId?: string | null;
  subject: string;
  sender: string;
  snippet?: string | null;
  body?: string | null;
  receivedAt: Date;
};

export type ParsedMessage = {
  corsairEmailId: string;
  threadId?: string;
  subject: string;
  sender: string;
  snippet?: string;
  body?: string;
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

export type SendEmailInput = CorsairSendEmailInput;
