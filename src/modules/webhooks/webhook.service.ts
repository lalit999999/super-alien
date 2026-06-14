import { processWebhook } from "corsair";
import { corsairInstance } from "@/modules/corsair";
import type { GmailService } from "@/modules/gmail";
import type { CalendarService } from "@/modules/calendar";
import type { WebhookRepository } from "./webhook.repository";
import type { GmailWebhookEvent, CalendarWebhookEvent, WebhookProcessResult } from "./webhook.types";
import {
  WEBHOOK_PLUGINS,
  GMAIL_EVENT_TYPES,
  CALENDAR_EVENT_TYPES,
  WEBHOOK_STATUS,
} from "./webhook.constants";

export class WebhookService {
  constructor(
    private readonly repo: WebhookRepository,
    private readonly gmailService: GmailService,
    private readonly calendarService: CalendarService
  ) {}

  async processGmailWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    tenantId: string,
    clerkUserId: string
  ): Promise<WebhookProcessResult> {
    const result = await processWebhook(corsairInstance, headers, body as string, { tenantId });

    if (result.plugin !== WEBHOOK_PLUGINS.GMAIL || !result.response?.data) {
      console.log("[webhook/gmail] No matching handler, skipping", { action: result.action });
      return { synced: false, action: result.action };
    }

    const event = result.response.data as GmailWebhookEvent;
    const gmailEventType = event.type;
    console.log(JSON.stringify({ provider: "gmail", eventType: gmailEventType, status: "received" }));

    try {
      if (
        event.type === GMAIL_EVENT_TYPES.MESSAGE_RECEIVED ||
        event.type === GMAIL_EVENT_TYPES.MESSAGE_LABEL_CHANGED
      ) {
        const email = await this.gmailService.storeRawMessage(event.message, clerkUserId);
        if (!email) {
          await this.repo.createLog({ provider: "gmail", eventType: gmailEventType, tenantId, status: WEBHOOK_STATUS.SKIPPED });
          return { synced: false, action: result.action };
        }
        await this.repo.createLog({ provider: "gmail", eventType: gmailEventType, entityId: email.id, tenantId, status: WEBHOOK_STATUS.PROCESSED });
        console.log(JSON.stringify({ provider: "gmail", eventType: gmailEventType, status: "processed", entityId: email.id }));
        return { synced: true, action: result.action, entityId: email.id };
      }

      if (event.type === GMAIL_EVENT_TYPES.MESSAGE_DELETED) {
        if (event.message.id) {
          await this.gmailService.deleteEmailByCorsairId(event.message.id, clerkUserId);
        }
        await this.repo.createLog({ provider: "gmail", eventType: gmailEventType, tenantId, status: WEBHOOK_STATUS.PROCESSED });
        console.log(JSON.stringify({ provider: "gmail", eventType: gmailEventType, status: "processed" }));
        return { synced: true, action: result.action };
      }

      await this.repo.createLog({ provider: "gmail", eventType: gmailEventType, tenantId, status: WEBHOOK_STATUS.SKIPPED });
      return { synced: false, action: result.action };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error("[webhook/gmail] Processing error:", err);
      await this.repo.createLog({ provider: "gmail", eventType: gmailEventType, tenantId, status: WEBHOOK_STATUS.FAILED, error });
      throw err;
    }
  }

  async processCalendarWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: unknown,
    tenantId: string,
    dbUserId: string
  ): Promise<WebhookProcessResult> {
    const result = await processWebhook(corsairInstance, headers, body as string, { tenantId });

    if (result.plugin !== WEBHOOK_PLUGINS.GOOGLE_CALENDAR || !result.response?.data) {
      console.log("[webhook/calendar] No matching handler, skipping", { action: result.action });
      return { synced: false, action: result.action };
    }

    const event = result.response.data as CalendarWebhookEvent;
    const calEventType = event.type;
    console.log(JSON.stringify({ provider: "googlecalendar", eventType: calEventType, status: "received" }));

    try {
      if (
        event.type === CALENDAR_EVENT_TYPES.EVENT_CREATED ||
        event.type === CALENDAR_EVENT_TYPES.EVENT_UPDATED
      ) {
        const calEvent = await this.calendarService.storeRawCalendarEvent(event.event, dbUserId);
        if (!calEvent) {
          await this.repo.createLog({ provider: "googlecalendar", eventType: calEventType, tenantId, status: WEBHOOK_STATUS.SKIPPED });
          return { synced: false, action: result.action };
        }
        await this.repo.createLog({ provider: "googlecalendar", eventType: calEventType, entityId: calEvent.id, tenantId, status: WEBHOOK_STATUS.PROCESSED });
        console.log(JSON.stringify({ provider: "googlecalendar", eventType: calEventType, status: "processed", entityId: calEvent.id }));
        return { synced: true, action: result.action, entityId: calEvent.id };
      }

      if (event.type === CALENDAR_EVENT_TYPES.EVENT_DELETED) {
        await this.calendarService.deleteCalendarEventFromDB(event.eventId, dbUserId);
        await this.repo.createLog({ provider: "googlecalendar", eventType: calEventType, tenantId, status: WEBHOOK_STATUS.PROCESSED });
        console.log(JSON.stringify({ provider: "googlecalendar", eventType: calEventType, status: "processed" }));
        return { synced: true, action: result.action };
      }

      await this.repo.createLog({ provider: "googlecalendar", eventType: calEventType, tenantId, status: WEBHOOK_STATUS.SKIPPED });
      return { synced: false, action: result.action };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error("[webhook/calendar] Processing error:", err);
      await this.repo.createLog({ provider: "googlecalendar", eventType: calEventType, tenantId, status: WEBHOOK_STATUS.FAILED, error });
      throw err;
    }
  }
}
