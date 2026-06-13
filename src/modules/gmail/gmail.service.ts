import { getEmails, getEmailById } from "@/modules/corsair";
import type { MessagePart } from "@corsair-dev/gmail";
import type { GmailRepository } from "./gmail.repository";
import type { DbEmail, GmailSyncResult, GmailListOptions, GmailUpsertInput, ParsedMessage } from "./gmail.types";
import { GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";

export class GmailService {
  constructor(private readonly repo: GmailRepository) {}

  async syncEmailsFromCorsair(
    clerkUserId: string,
    dbUserId: string,
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

        inputs.push({ ...parsed, userId: dbUserId });
      } catch {
        skipped++;
      }
    }

    const synced = await this.repo.createManyEmails(inputs);
    return { synced, skipped };
  }

  async getUserEmails(
    dbUserId: string,
    options: GmailListOptions = {}
  ): Promise<{ emails: DbEmail[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;

    const [emails, total] = await Promise.all([
      this.repo.getEmailsByUser(dbUserId, limit, offset),
      this.repo.countEmailsByUser(dbUserId),
    ]);

    return { emails, total };
  }

  async getEmailDetails(
    dbUserId: string,
    emailId: string
  ): Promise<DbEmail | null> {
    return this.repo.getEmailById(emailId, dbUserId);
  }
}

// ─── Parser helpers ───────────────────────────────────────────────────────────

type RawMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string | Date | null;
  payload?: MessagePart;
};

function parseMessage(raw: RawMessage): ParsedMessage | null {
  if (!raw.id) return null;

  const headers = raw.payload?.headers ?? [];
  const subject = findHeader(headers, "Subject") ?? "(no subject)";
  const sender = findHeader(headers, "From") ?? "unknown";
  const receivedAt = parseInternalDate(raw.internalDate);
  const body = extractTextBody(raw.payload);

  return {
    corsairEmailId: raw.id,
    threadId: raw.threadId,
    subject,
    sender,
    snippet: raw.snippet,
    body: body ?? undefined,
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

function parseInternalDate(
  raw?: string | Date | null
): Date {
  if (!raw) return new Date();
  if (raw instanceof Date) return raw;
  const ms = parseInt(raw, 10);
  return isNaN(ms) ? new Date() : new Date(ms);
}

function extractTextBody(part?: MessagePart): string | null {
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
