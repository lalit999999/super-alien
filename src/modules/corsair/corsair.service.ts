import { decryptDEK, decryptConfig } from "corsair";
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

function toBase64Url(message: string): string {
  return Buffer.from(message).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function wrapBase64(data: string): string {
  return data.replace(/.{76}/g, "$&\r\n");
}

function buildRawEmail(
  to: string,
  subject: string,
  body: string,
  attachments: { filename: string; mimeType: string; data: string }[] = []
): string {
  if (attachments.length === 0) {
    const message = [
      `To: ${sanitizeHeader(to)}`,
      `Subject: ${sanitizeHeader(subject)}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      "",
      body,
    ].join("\r\n");
    return toBase64Url(message);
  }

  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const parts = [
    `To: ${sanitizeHeader(to)}`,
    `Subject: ${sanitizeHeader(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "",
    body,
    "",
  ];

  for (const att of attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${att.mimeType}; name="${att.filename}"`,
      `Content-Disposition: attachment; filename="${att.filename}"`,
      `Content-Transfer-Encoding: base64`,
      "",
      wrapBase64(att.data),
      ""
    );
  }
  parts.push(`--${boundary}--`);
  return toBase64Url(parts.join("\r\n"));
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
  const { to, subject, body, threadId, attachments } = sendEmailSchema.parse(payload);
  const tenant = forTenant(userId);

  const totalBytes = (attachments ?? []).reduce((sum, a) => sum + a.data.length * 0.75, 0);
  if (totalBytes > 25 * 1024 * 1024) {
    throw Object.assign(new Error("Attachments exceed 25MB limit"), { code: "ATTACHMENT_TOO_LARGE" });
  }

  return tenant.gmail.api.messages.send({
    raw: buildRawEmail(to, subject, body, attachments),
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

// ─── Token Revocation ─────────────────────────────────────────────────────────

/**
 * Revokes the Google OAuth refresh token at Google's end so the app is removed
 * from the user's "Third-party access" page.
 *
 * accountData is obtained by the caller from the CorsairAccount table via a
 * repository method and passed in to keep Prisma out of this service.
 * Failures are best-effort: the local DB disconnect has already succeeded.
 */
export async function revokeGoogleToken(
  clerkUserId: string,
  plugin: "gmail" | "googlecalendar",
  accountData: { config: Record<string, string>; dek: string | null } | null
): Promise<void> {
  if (!accountData?.dek) {
    console.warn(`[corsair] No Corsair account found for ${clerkUserId}/${plugin} — skipping token revocation`);
    return;
  }

  try {
    const kek = process.env.CORSAIR_KEK;
    if (!kek) {
      console.warn("[corsair] CORSAIR_KEK not set — cannot decrypt token for revocation");
      return;
    }

    const accountDek = await decryptDEK(accountData.dek, kek);
    const config = decryptConfig(accountData.config, accountDek);
    const refreshToken = config["refresh_token"];

    if (!refreshToken) {
      console.warn(`[corsair] No refresh token stored for ${clerkUserId}/${plugin}`);
      return;
    }

    const res = await fetch(
      `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`,
      { method: "POST" }
    );

    if (!res.ok) {
      console.error(`[corsair] Google token revocation returned ${res.status} for ${clerkUserId}/${plugin}`);
    }
  } catch (err) {
    console.error(`[corsair] Error revoking Google token for ${clerkUserId}/${plugin}:`, err);
  }
}

