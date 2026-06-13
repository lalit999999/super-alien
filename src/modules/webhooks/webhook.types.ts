import type {
  MessageReceivedEvent,
  MessageDeletedEvent,
  MessageLabelChangedEvent,
} from "@corsair-dev/gmail";
import type {
  EventCreatedEvent,
  EventUpdatedEvent,
  EventDeletedEvent,
} from "@corsair-dev/googlecalendar";

export type GmailWebhookEvent =
  | MessageReceivedEvent
  | MessageDeletedEvent
  | MessageLabelChangedEvent;

export type CalendarWebhookEvent =
  | EventCreatedEvent
  | EventUpdatedEvent
  | EventDeletedEvent;

export type WebhookProcessResult = {
  synced: boolean;
  action: string | null;
  entityId?: string;
};
