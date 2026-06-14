import { getEmails, getEmailById, sendEmail as corsairSendEmail, searchEmails as corsairSearchEmails } from "@/modules/corsair";
import type { CorsairMessagePart, SendEmailOutput, GetEmailsOutput } from "@/modules/corsair";
import type { AiService } from "@/modules/ai";
import type { GmailRepository } from "./gmail.repository";
import type { DbEmail, GmailSyncResult, GmailListOptions, GmailUpsertInput, ParsedMessage, SendEmailInput } from "./gmail.types";
import { GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";

export class GmailService {
  constructor(
    private readonly repo: GmailRepository,
    private readonly ai?: AiService
  ) {}

  async syncEmailsFromCorsair(
    clerkUserId: string,
    maxResults = GMAIL_SYNC_MAX_RESULTS
  ): Promise<GmailSyncResult> {
    const listResult = await getEmails(clerkUserId, {
      labelIds: ["INBOX"],
      maxResults,
    });

    const messageRefs = listResult.messages ?? [];
    if (messageRefs.length === 0) {
      return { synced: 0, skipped: 0 };
    }

    const inputs: GmailUpsertInput[] = [];
    let skipped = 0;

    for (const ref of messageRefs) {
      if (!ref.id) {
        skipped++;
        continue;
      }

      try {
        const message = await getEmailById(clerkUserId, ref.id, "full");
        const parsed = parseMessage(message);

        if (!parsed) {
          skipped++;
          continue;
        }

        inputs.push({ ...parsed, clerkUserId });
      } catch {
        skipped++;
      }
    }

    const synced = await this.repo.createManyEmails(inputs);
    return { synced, skipped };
  }

  async getUserEmails(
    clerkUserId: string,
    options: GmailListOptions = {}
  ): Promise<{ emails: DbEmail[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const [emails, total] = await Promise.all([
      this.repo.getEmailsByUser(clerkUserId, limit, offset),
      this.repo.countEmailsByUser(clerkUserId),
    ]);

    return { emails, total };
  }

  async getEmailDetails(
    clerkUserId: string,
    emailId: string
  ): Promise<DbEmail | null> {
    return this.repo.getEmailById(emailId, clerkUserId);
  }

  async markEmailAsRead(
    clerkUserId: string,
    emailId: string
  ): Promise<DbEmail | null> {
    return this.repo.markAsRead(emailId, clerkUserId);
  }

  async sendEmail(
    clerkUserId: string,
    input: SendEmailInput
  ): Promise<SendEmailOutput> {
    return corsairSendEmail(clerkUserId, input);
  }

  async searchEmails(
    clerkUserId: string,
    query: string,
    maxResults?: number
  ): Promise<GetEmailsOutput> {
    return corsairSearchEmails(clerkUserId, query, maxResults);
  }

  async classifyEmailsForUser(
    clerkUserId: string,
    limit = 10
  ): Promise<{ classified: number; failed: number }> {
    if (!this.ai) throw new Error("AiService not injected");

    const emails = await this.repo.getEmailsWithoutClassification(clerkUserId, limit);

    let classified = 0;
    let failed = 0;

    for (const email of emails) {
      try {
        await this.ai.classifyAndSummarizeEmail(email.id, {
          subject: email.subject,
          sender: email.sender,
          snippet: email.snippet,
          body: email.body,
        });
        classified++;
      } catch {
        failed++;
      }
    }

    return { classified, failed };
  }
}

// ─── Parser helpers ───────────────────────────────────────────────────────────

type RawMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string | Date | null;
  labelIds?: string[];
  payload?: CorsairMessagePart;
};

function parseMessage(raw: RawMessage): ParsedMessage | null {
  if (!raw.id) return null;

  const headers = raw.payload?.headers ?? [];
  const subject = findHeader(headers, "Subject") ?? "(no subject)";
  const sender = findHeader(headers, "From") ?? "unknown";
  const receivedAt = parseInternalDate(raw.internalDate);
  const body = extractTextBody(raw.payload);
  const isRead = !(raw.labelIds ?? []).includes("UNREAD");

  return {
    corsairEmailId: raw.id,
    threadId: raw.threadId,
    subject,
    sender,
    snippet: raw.snippet,
    body: body ?? undefined,
    isRead,
    receivedAt,
  };
}

function findHeader(
  headers: Array<{ name?: string; value?: string }>,
  name: string
): string | undefined {
  return headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  )?.value;
}

function parseInternalDate(raw?: string | Date | null): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  const ms = parseInt(raw, 10);
  return isNaN(ms) ? new Date() : new Date(ms);
}

function extractTextBody(part?: CorsairMessagePart): string | null {
  if (!part) return null;

  if (part.mimeType === "text/plain" && part.body?.data) {
    return Buffer.from(part.body.data, "base64url").toString("utf-8");
  }

  if (part.parts) {
    for (const child of part.parts) {
      const found = extractTextBody(child);
      if (found) return found;
    }
  }

  return null;
}
