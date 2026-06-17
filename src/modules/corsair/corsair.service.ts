import { corsairInstance } from "./corsair.client";
import {
  sendEmailSchema,
  getEmailsSchema,
  createEventSchema,
  getEventsSchema,
  type SendEmailPayload,
  type GetEmailsPayload,
  type CreateEventPayload,
  type GetEventsPayload,
} from "./corsair.schema";
import {
  GMAIL_DEFAULT_MAX_RESULTS,
  CALENDAR_DEFAULT_MAX_RESULTS,
  CALENDAR_ID_PRIMARY,
  GMAIL_LABEL,
} from "./corsair.constants";
import type {
  GetEmailsOutput,
  GetEmailByIdOutput,
  SendEmailOutput,
  GetEventsOutput,
  CreateEventOutput,
  UpdateEventOutput,
  DeleteEventOutput,
  GetThreadOutput,
  ModifyEmailOutput,
} from "./corsair.types";
import type { CorsairUpdateEventOptions, CorsairDeleteEventOptions } from "./corsair.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function forTenant(userId: string) {
  return corsairInstance.withTenant(userId);
}

/**
 * Removes CRLF characters from an email header value to prevent header injection.
 * Trims leading/trailing whitespace and collapses internal runs of whitespace.
 */
export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Encodes plain text email parts into RFC 2822 base64url format required by
 * Gmail's messages.send endpoint.
 */
function buildRawEmail(to: string, subject: string, body: string): string {
  const message = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `MIME-Version: 1.0`,
    "",
    body,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

/**
 * List emails for the authenticated user.
 * All future modules (gmail.service.ts, agent.service.ts) MUST call this —
 * never call corsairInstance directly outside this file.
 */
export async function getEmails(
  userId: string,
  options: GetEmailsPayload = {}
): Promise<GetEmailsOutput> {
  const input = getEmailsSchema.parse(options);
  const tenant = forTenant(userId);

  return tenant.gmail.api.messages.list({
    maxResults: GMAIL_DEFAULT_MAX_RESULTS,
    ...input,
  });
}

/**
 * Fetch a single email by its Gmail message ID.
 */
export async function getEmailById(
  userId: string,
  messageId: string,
  format: "full" | "metadata" | "minimal" | "raw" = "full"
): Promise<GetEmailByIdOutput> {
  const tenant = forTenant(userId);

  return tenant.gmail.api.messages.get({ id: messageId, format });
}

/**
 * Send an email on behalf of the authenticated user.
 * Constructs the RFC 2822 base64url raw payload internally — callers pass
 * human-readable fields.
 */
export async function sendEmail(
  userId: string,
  payload: SendEmailPayload
): Promise<SendEmailOutput> {
  const { to, subject, body, threadId } = sendEmailSchema.parse(payload);
  const tenant = forTenant(userId);

  return tenant.gmail.api.messages.send({
    raw: buildRawEmail(to, subject, body),
    ...(threadId ? { threadId } : {}),
  });
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

/**
 * List calendar events for the authenticated user.
 */
export async function getEvents(
  userId: string,
  options: GetEventsPayload = {}
): Promise<GetEventsOutput> {
  const input = getEventsSchema.parse(options);
  const tenant = forTenant(userId);

  return tenant.googlecalendar.api.events.getMany({
    calendarId: CALENDAR_ID_PRIMARY,
    maxResults: CALENDAR_DEFAULT_MAX_RESULTS,
    singleEvents: true,
    orderBy: "startTime",
    ...input,
  });
}

/**
 * Create a calendar event on behalf of the authenticated user.
 */
export async function createEvent(
  userId: string,
  payload: CreateEventPayload
): Promise<CreateEventOutput> {
  const { calendarId, event, sendUpdates, conferenceDataVersion } =
    createEventSchema.parse(payload);
  const tenant = forTenant(userId);

  return tenant.googlecalendar.api.events.create({
    calendarId: calendarId ?? CALENDAR_ID_PRIMARY,
    event,
    ...(sendUpdates ? { sendUpdates } : {}),
    ...(conferenceDataVersion !== undefined ? { conferenceDataVersion } : {}),
  });
}

/**
 * Update an existing calendar event.
 * Placeholder — implement fully when the calendar module is built.
 */
export async function updateEvent(
  userId: string,
  options: CorsairUpdateEventOptions
): Promise<UpdateEventOutput> {
  const tenant = forTenant(userId);

  return tenant.googlecalendar.api.events.update({
    calendarId: CALENDAR_ID_PRIMARY,
    ...options,
  });
}

/**
 * Delete a calendar event.
 * Placeholder — implement fully when the calendar module is built.
 */
export async function deleteEvent(
  userId: string,
  options: CorsairDeleteEventOptions
): Promise<DeleteEventOutput> {
  const tenant = forTenant(userId);

  return tenant.googlecalendar.api.events.delete({
    calendarId: CALENDAR_ID_PRIMARY,
    ...options,
  });
}

/**
 * Search emails using Gmail query syntax (e.g. "from:alice subject:invoice").
 */
export async function searchEmails(
  userId: string,
  query: string,
  maxResults = GMAIL_DEFAULT_MAX_RESULTS
): Promise<GetEmailsOutput> {
  return getEmails(userId, { q: query, maxResults });
}

/**
 * Fetch a complete Gmail thread by threadId.
 */
export async function getThread(
  userId: string,
  threadId: string
): Promise<GetThreadOutput> {
  const tenant = forTenant(userId);
  return tenant.gmail.api.threads.get({ id: threadId, format: "full" });
}

/**
 * Archive an email by removing the INBOX label.
 */
export async function archiveEmail(
  userId: string,
  messageId: string
): Promise<ModifyEmailOutput> {
  const tenant = forTenant(userId);
  return tenant.gmail.api.messages.modify({
    id: messageId,
    removeLabelIds: [GMAIL_LABEL.INBOX],
  });
}

/**
 * Move an email to trash.
 */
export async function trashEmail(
  userId: string,
  messageId: string
): Promise<ModifyEmailOutput> {
  const tenant = forTenant(userId);
  return tenant.gmail.api.messages.trash({ id: messageId });
}

/**
 * Mark an email as read by removing the UNREAD label.
 */
export async function markEmailRead(
  userId: string,
  messageId: string
): Promise<ModifyEmailOutput> {
  const tenant = forTenant(userId);
  return tenant.gmail.api.messages.modify({
    id: messageId,
    removeLabelIds: [GMAIL_LABEL.UNREAD],
  });
}

/**
 * Mark an email as unread by adding the UNREAD label.
 */
export async function markEmailUnread(
  userId: string,
  messageId: string
): Promise<ModifyEmailOutput> {
  const tenant = forTenant(userId);
  return tenant.gmail.api.messages.modify({
    id: messageId,
    addLabelIds: [GMAIL_LABEL.UNREAD],
  });
}

