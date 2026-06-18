import {
  getEmails,
  getEmailById,
  sendEmail as corsairSendEmail,
  searchEmails as corsairSearchEmails,
  getThread as corsairGetThread,
  archiveEmail as corsairArchiveEmail,
  trashEmail as corsairTrashEmail,
  markEmailRead as corsairMarkEmailRead,
  markEmailUnread as corsairMarkEmailUnread,
} from "@/modules/corsair";
import type { CorsairMessagePart, SendEmailOutput, GetEmailsOutput, GetThreadOutput } from "@/modules/corsair";
import type { AiService } from "@/modules/ai";
import type { CacheService } from "@/modules/cache";
import type { RateLimitService } from "@/modules/rate-limit";
import {
  buildGmailEmailKey,
  buildGmailThreadKey,
  buildGmailSearchKey,
  CACHE_TTL,
} from "@/modules/cache";
import type { GmailRepository } from "./gmail.repository";
import type { DbEmail, DbEmailWithClassification, GmailSyncResult, GmailListOptions, GmailUpsertInput, ParsedMessage, SendEmailInput, DbEmailSearchOptions } from "./gmail.types";
import { GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";

export class GmailService {
  constructor(
    private readonly repo: GmailRepository,
    private readonly ai?: AiService,
    private readonly cache?: CacheService,
    private readonly rateLimit?: RateLimitService
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
    if (this.cache) {
      const key = buildGmailEmailKey(clerkUserId, emailId);
      const { data, hit } = await this.cache.getOrSet<DbEmail | null>(
        key,
        () => this.repo.getEmailById(emailId, clerkUserId),
        { ttl: CACHE_TTL.EMAIL }
      );
      console.log(`[Gmail] getEmailDetails ${hit ? "cache-hit" : "cache-miss"} emailId=${emailId}`);
      return data;
    }
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
    await this.checkGmailActionLimit(clerkUserId, "sendEmail");
    return corsairSendEmail(clerkUserId, input);
  }

  async searchEmails(
    clerkUserId: string,
    query: string,
    maxResults?: number
  ): Promise<GetEmailsOutput> {
    if (this.cache) {
      const key = buildGmailSearchKey(clerkUserId, `${query}:${maxResults ?? ""}`);
      const { data, hit } = await this.cache.getOrSet<GetEmailsOutput>(
        key,
        () => corsairSearchEmails(clerkUserId, query, maxResults),
        { ttl: CACHE_TTL.SEARCH }
      );
      console.log(`[Gmail] searchEmails ${hit ? "cache-hit" : "cache-miss"} query="${query}"`);
      return data;
    }
    return corsairSearchEmails(clerkUserId, query, maxResults);
  }

  async searchEmailsInDb(
    clerkUserId: string,
    options: DbEmailSearchOptions
  ): Promise<DbEmail[]> {
    return this.repo.searchEmailsInDb(clerkUserId, options);
  }

  async storeRawMessage(
    message: {
      id?: string;
      threadId?: string;
      snippet?: string;
      internalDate?: string | Date | null;
      labelIds?: string[];
      payload?: CorsairMessagePart;
    },
    clerkUserId: string
  ): Promise<DbEmail | null> {
    const parsed = parseMessage(message);
    if (!parsed) return null;
    return this.repo.upsertEmail({ ...parsed, clerkUserId });
  }

  async deleteEmailByCorsairId(corsairEmailId: string, clerkUserId: string): Promise<void> {
    return this.repo.deleteEmailByCorsairId(corsairEmailId, clerkUserId);
  }

  async getThread(
    clerkUserId: string,
    threadId: string
  ): Promise<GetThreadOutput> {
    if (this.cache) {
      const key = buildGmailThreadKey(clerkUserId, threadId);
      const { data, hit } = await this.cache.getOrSet<GetThreadOutput>(
        key,
        () => corsairGetThread(clerkUserId, threadId),
        { ttl: CACHE_TTL.THREAD }
      );
      console.log(`[Gmail] getThread ${hit ? "cache-hit" : "cache-miss"} threadId=${threadId}`);
      return data;
    }
    return corsairGetThread(clerkUserId, threadId);
  }

  async archiveEmail(
    clerkUserId: string,
    corsairEmailId: string
  ): Promise<{ success: boolean }> {
    await this.checkGmailActionLimit(clerkUserId, "archiveEmail");
    await corsairArchiveEmail(clerkUserId, corsairEmailId);
    await this.invalidateEmailCache(clerkUserId, corsairEmailId);
    return { success: true };
  }

  async deleteEmail(
    clerkUserId: string,
    corsairEmailId: string
  ): Promise<{ success: boolean }> {
    await this.checkGmailActionLimit(clerkUserId, "deleteEmail");
    await corsairTrashEmail(clerkUserId, corsairEmailId);
    await this.repo.deleteEmailByCorsairId(corsairEmailId, clerkUserId).catch(() => undefined);
    await this.invalidateEmailCache(clerkUserId, corsairEmailId);
    return { success: true };
  }

  async markRead(
    clerkUserId: string,
    corsairEmailId: string
  ): Promise<{ success: boolean }> {
    await this.checkGmailActionLimit(clerkUserId, "markRead");
    await corsairMarkEmailRead(clerkUserId, corsairEmailId);
    await this.repo.updateReadStatusByCorsairId(corsairEmailId, clerkUserId, true).catch(() => undefined);
    await this.invalidateEmailCache(clerkUserId, corsairEmailId);
    return { success: true };
  }

  async markUnread(
    clerkUserId: string,
    corsairEmailId: string
  ): Promise<{ success: boolean }> {
    await this.checkGmailActionLimit(clerkUserId, "markUnread");
    await corsairMarkEmailUnread(clerkUserId, corsairEmailId);
    await this.repo.updateReadStatusByCorsairId(corsairEmailId, clerkUserId, false).catch(() => undefined);
    await this.invalidateEmailCache(clerkUserId, corsairEmailId);
    return { success: true };
  }

  async getImportantEmails(
    clerkUserId: string,
    limit = 6
  ): Promise<DbEmailWithClassification[]> {
    return this.repo.getImportantEmails(clerkUserId, limit);
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

  private async checkGmailActionLimit(clerkUserId: string, action: string): Promise<void> {
    if (!this.rateLimit) return;
    const result = await this.rateLimit.checkGmailActions(clerkUserId);
    if (!result.allowed) {
      const err = new Error(`Gmail action rate limit exceeded for ${action}`);
      (err as Error & { code: string }).code = "RATE_LIMIT_EXCEEDED";
      throw err;
    }
  }

  private async invalidateEmailCache(clerkUserId: string, emailId: string): Promise<void> {
    if (!this.cache) return;
    const key = buildGmailEmailKey(clerkUserId, emailId);
    await this.cache.del(key).catch(() => undefined);
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
