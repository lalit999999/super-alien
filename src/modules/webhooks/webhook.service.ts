import { processWebhook } from "corsair";
import { corsairInstance } from "@/modules/corsair";
import type { MessagePart } from "@corsair-dev/gmail";
import type { WebhookRepository } from "./webhook.repository";
import type { GmailWebhookEvent, CalendarWebhookEvent, WebhookProcessResult } from "./webhook.types";
import { WEBHOOK_PLUGINS } from "./webhook.constants";

export class WebhookService {
  constructor(private readonly repo: WebhookRepository) {}

  async processGmailWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    tenantId: string,
    dbUserId: string
  ): Promise<WebhookProcessResult> {
    const result = await processWebhook(corsairInstance, headers, body as string, {
      tenantId,
    });

    if (result.plugin !== WEBHOOK_PLUGINS.GMAIL || !result.response?.data) {
      console.log("[webhook/gmail] No matching handler, skipping");
      return { synced: false, action: result.action };
    }

    const event = result.response.data as GmailWebhookEvent;
    console.log(`[webhook/gmail] Processing action=${result.action} type=${event.type}`);

    if (event.type === "messageDeleted") {
      return { synced: false, action: result.action };
    }

    const parsed = parseGmailMessage(event.message, dbUserId);
    if (!parsed) {
      console.warn("[webhook/gmail] Failed to parse message, skipping");
      return { synced: false, action: result.action };
    }

    const saved = await this.repo.upsertEmail(parsed);
    return { synced: true, action: result.action, entityId: saved.id };
  }

  async processCalendarWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    tenantId: string,
    dbUserId: string
  ): Promise<WebhookProcessResult> {
    const result = await processWebhook(corsairInstance, headers, body as string, {
      tenantId,
    });

    if (result.plugin !== WEBHOOK_PLUGINS.GOOGLE_CALENDAR || !result.response?.data) {
      console.log("[webhook/calendar] No matching handler, skipping");
      return { synced: false, action: result.action };
    }

    const event = result.response.data as CalendarWebhookEvent;
    console.log(`[webhook/calendar] Processing action=${result.action} type=${event.type}`);

    if (event.type === "eventDeleted") {
      return { synced: false, action: result.action };
    }

    const parsed = parseCalendarEvent(event, dbUserId);
    if (!parsed) {
      console.warn("[webhook/calendar] Failed to parse event, skipping");
      return { synced: false, action: result.action };
    }

    const saved = await this.repo.upsertCalendarEvent(parsed);
    return { synced: true, action: result.action, entityId: saved.id };
  }
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

type RawMessage = {
  id?: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: MessagePart;
};

function parseGmailMessage(message: RawMessage, userId: string) {
  if (!message.id) return null;

  const headers = message.payload?.headers ?? [];
  const subject = findHeader(headers, "Subject") ?? "(no subject)";
  const sender = findHeader(headers, "From") ?? "unknown";
  const receivedAt = message.internalDate
    ? new Date(parseInt(message.internalDate, 10))
    : new Date();
  const body = extractTextBody(message.payload) ?? undefined;

  return {
    corsairEmailId: message.id,
    userId,
    threadId: message.threadId ?? null,
    subject,
    sender,
    snippet: message.snippet ?? null,
    body,
    receivedAt,
  };
}

function findHeader(
  headers: Array<{ name?: string; value?: string }>,
  name: string
): string | undefined {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;
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

type RawEvent = {
  type: "eventCreated" | "eventUpdated";
  calendarId: string;
  event: {
    id?: string;
    summary?: string;
    description?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    hangoutLink?: string;
  };
};

function parseCalendarEvent(event: RawEvent, userId: string) {
  const { event: raw } = event;
  if (!raw.id || !raw.summary) return null;

  const startTime = parseDateTimeField(raw.start);
  const endTime = parseDateTimeField(raw.end);
  if (!startTime || !endTime) return null;

  return {
    corsairEventId: raw.id,
    userId,
    title: raw.summary,
    description: raw.description ?? null,
    startTime,
    endTime,
    meetingLink: raw.hangoutLink ?? null,
  };
}

function parseDateTimeField(
  dt?: { dateTime?: string; date?: string }
): Date | null {
  if (!dt) return null;
  const raw = dt.dateTime ?? dt.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}
