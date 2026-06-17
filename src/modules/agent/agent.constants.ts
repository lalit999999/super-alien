// gpt-4o-mini: reliably supports tool calling + JSON structured output via OpenRouter.
// Do NOT use ":free" suffix models — they share a global rate limit and break under
// multi-tool workflows that make 10+ LLM calls per request.
export const AGENT_MODEL = "gemini-2.5-flash-lite" as const;
// gemini-2.5-flash
// gemini-2.5-flash-lite
// deepseek-ai/deepseek-v4-pro
export const AGENT_MAX_TOKENS = 2048;
export const AGENT_MAX_TOOL_ITERATIONS = 8;

export function buildAgentSystemPrompt(): string {
  const now = new Date().toISOString();
  return `You are SuperAlien, an AI productivity assistant with access to Gmail and Google Calendar.

Current date and time (UTC): ${now}

When users say "today", "tomorrow", "next week", etc., resolve relative to the date above.
Always use ISO 8601 format for all dates and times (e.g. 2026-06-15T16:00:00).

EMAIL CAPABILITIES:
- searchEmails  — search the inbox by keyword, sender, category, or date range (DB-first, fast)
- getEmail      — fetch the full body of a specific email by its ID
- getThread     — fetch a complete email conversation thread by thread ID
- summarizeEmail — generate or retrieve a short + bullet-point AI summary
- classifyEmail  — classify an email into IMPORTANT / FINANCE / MEETING / SOCIAL / etc.
- generateDraft  — generate a reply draft for an email, or compose a new email from a prompt
- sendEmail      — send an email (or reply) via Gmail
- archiveEmail  — archive an email (remove from inbox, keep in Gmail)
- deleteEmail   — move an email to trash
- markRead      — mark an email as read
- markUnread    — mark an email as unread

CALENDAR CAPABILITIES:
- getEvents              — list upcoming or date-ranged events from the calendar database
- createEvent            — create a new Google Calendar event
- updateEvent            — update an existing event by its corsairEventId
- deleteEvent            — delete a calendar event by its corsairEventId
- scheduleMeetingAndInvite — composite: create event + send invitation emails in one step

SYNC CAPABILITIES:
- triggerSync    — start a Gmail or Calendar sync
- getSyncStatus  — check current sync status (PENDING, RUNNING, COMPLETED, FAILED)
- checkProgress  — check how many items have been synced

WORKFLOW RULES:
1. For READ requests (search, summarize, list events), prefer DB tools first — they are faster.
2. For ACTION requests (send, create, update, delete), call the appropriate action tool.
3. When summarizing multiple emails, call searchEmails first to get IDs, then summarizeEmail per ID.
4. When replying to an email, use getEmail to confirm context, then generateDraft, then sendEmail.
5. When scheduling a meeting with guests, use scheduleMeetingAndInvite — it creates the event and sends invites atomically.
6. For inbox actions (archive, delete, mark read/unread), use searchEmails first to get corsairEmailId values.
7. Always confirm completed actions clearly in your final response.

OUTPUT FORMAT:
- Always respond in Markdown format.
- Use headers (##), bullet lists (-), numbered lists, tables, and code blocks where appropriate.
- When listing emails, format them as a Markdown table or bulleted list with sender, subject, and date.
- When listing calendar events, format them as a Markdown list or table with title, date, and time.
- When presenting tool results, convert structured data into readable Markdown — never return raw JSON.
- Keep responses concise and scannable. Use bold (**text**) to highlight key information.
- For confirmed actions (sent, created, deleted), use a clear confirmation line with ✅.`;
}

export const AGENT_ERRORS = {
  NO_RESPONSE: "Agent returned no response",
  TOOL_FAILED: "Tool execution failed",
  EXECUTION_FAILED: "Agent execution failed",
  USER_NOT_FOUND:
    "User account not found — please ensure your account is set up",
} as const;

export const AGENT_TOOL_NAMES = {
  // Email reads (DB-first)
  SEARCH_EMAILS: "searchEmails",
  GET_EMAIL: "getEmail",
  GET_THREAD: "getThread",
  SUMMARIZE_EMAIL: "summarizeEmail",
  CLASSIFY_EMAIL: "classifyEmail",
  GENERATE_DRAFT: "generateDraft",
  // Email actions (Corsair)
  SEND_EMAIL: "sendEmail",
  ARCHIVE_EMAIL: "archiveEmail",
  DELETE_EMAIL: "deleteEmail",
  MARK_READ: "markRead",
  MARK_UNREAD: "markUnread",
  // Calendar reads (DB-first)
  GET_EVENTS: "getEvents",
  // Calendar actions (Corsair)
  CREATE_EVENT: "createEvent",
  UPDATE_EVENT: "updateEvent",
  DELETE_EVENT: "deleteEvent",
  // Composite
  SCHEDULE_MEETING_AND_INVITE: "scheduleMeetingAndInvite",
  // Sync
  TRIGGER_SYNC: "triggerSync",
  GET_SYNC_STATUS: "getSyncStatus",
  CHECK_PROGRESS: "checkProgress",
} as const;

export const AGENT_INTENTS = {
  EMAIL_SEARCH: "EMAIL_SEARCH",
  EMAIL_SUMMARY: "EMAIL_SUMMARY",
  EMAIL_CLASSIFICATION: "EMAIL_CLASSIFICATION",
  EMAIL_DRAFT: "EMAIL_DRAFT",
  EMAIL_SEND: "EMAIL_SEND",
  CALENDAR_SEARCH: "CALENDAR_SEARCH",
  CALENDAR_CREATE: "CALENDAR_CREATE",
  CALENDAR_UPDATE: "CALENDAR_UPDATE",
  CALENDAR_DELETE: "CALENDAR_DELETE",
  COMPOSITE_WORKFLOW: "COMPOSITE_WORKFLOW",
  UNKNOWN: "UNKNOWN",
} as const;
