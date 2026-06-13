import type { GmailEndpointInputs, GmailEndpointOutputs } from "@corsair-dev/gmail";
import type {
  GoogleCalendarEndpointInputs,
  GoogleCalendarEndpointOutputs,
} from "@corsair-dev/googlecalendar";

// ─── Gmail ───────────────────────────────────────────────────────────────────

export type GetEmailsInput = GmailEndpointInputs["messagesList"];
export type GetEmailsOutput = GmailEndpointOutputs["messagesList"];
export type GetEmailByIdInput = GmailEndpointInputs["messagesGet"];
export type GetEmailByIdOutput = GmailEndpointOutputs["messagesGet"];
export type SendEmailInput = {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
};
export type SendEmailOutput = GmailEndpointOutputs["messagesSend"];

// ─── Calendar ────────────────────────────────────────────────────────────────

export type GetEventsInput = GoogleCalendarEndpointInputs["eventsGetMany"];
export type GetEventsOutput = GoogleCalendarEndpointOutputs["eventsGetMany"];
export type CreateEventInput = GoogleCalendarEndpointInputs["eventsCreate"];
export type CreateEventOutput = GoogleCalendarEndpointOutputs["eventsCreate"];
export type UpdateEventInput = GoogleCalendarEndpointInputs["eventsUpdate"];
export type UpdateEventOutput = GoogleCalendarEndpointOutputs["eventsUpdate"];
export type DeleteEventInput = GoogleCalendarEndpointInputs["eventsDelete"];
export type DeleteEventOutput = GoogleCalendarEndpointOutputs["eventsDelete"];

// ─── Service method wrappers ─────────────────────────────────────────────────

export type CorsairGetEmailsOptions = Omit<GetEmailsInput, "userId">;
export type CorsairGetEmailByIdOptions = Omit<GetEmailByIdInput, "userId">;
export type CorsairGetEventsOptions = Omit<GetEventsInput, "calendarId">;
export type CorsairCreateEventOptions = Omit<CreateEventInput, "calendarId">;
export type CorsairUpdateEventOptions = Omit<UpdateEventInput, "calendarId">;
export type CorsairDeleteEventOptions = Omit<DeleteEventInput, "calendarId">;
