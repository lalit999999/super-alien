export const AGENT_MODEL = "gpt-4o-mini" as const;
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
- summarizeEmail — generate or retrieve a short + bullet-point AI summary
- classifyEmail  — classify an email into IMPORTANT / FINANCE / MEETING / SOCIAL / etc.
- generateDraft  — generate a reply draft for an email, or compose a new email from a prompt
- sendEmail      — send an email (or reply) via Gmail

CALENDAR CAPABILITIES:
- getEvents              — list upcoming or date-ranged events from the calendar database
- createEvent            — create a new Google Calendar event
- updateEvent            — update an existing event by its corsairEventId
- deleteEvent            — delete a calendar event by its corsairEventId
- scheduleMeetingAndInvite — composite: create event + send invitation emails in one step

WORKFLOW RULES:
1. For READ requests (search, summarize, list events), prefer DB tools first — they are faster.
2. For ACTION requests (send, create, update, delete), call the appropriate action tool.
3. When summarizing multiple emails, call searchEmails first to get IDs, then summarizeEmail per ID.
4. When replying to an email, use getEmail to confirm context, then generateDraft, then sendEmail.
5. When scheduling a meeting with guests, use scheduleMeetingAndInvite — it creates the event and sends invites atomically.
6. Always confirm completed actions clearly in your final response.`;
}

export const AGENT_ERRORS = {
  NO_RESPONSE: "Agent returned no response",
  TOOL_FAILED: "Tool execution failed",
  EXECUTION_FAILED: "Agent execution failed",
  USER_NOT_FOUND: "User account not found — please ensure your account is set up",
} as const;

export const AGENT_TOOL_NAMES = {
  // Email reads (DB-first)
  SEARCH_EMAILS: "searchEmails",
  GET_EMAIL: "getEmail",
  SUMMARIZE_EMAIL: "summarizeEmail",
  CLASSIFY_EMAIL: "classifyEmail",
  GENERATE_DRAFT: "generateDraft",
  // Email actions (Corsair)
  SEND_EMAIL: "sendEmail",
  // Calendar reads (DB-first)
  GET_EVENTS: "getEvents",
  // Calendar actions (Corsair)
  CREATE_EVENT: "createEvent",
  UPDATE_EVENT: "updateEvent",
  DELETE_EVENT: "deleteEvent",
  // Composite
  SCHEDULE_MEETING_AND_INVITE: "scheduleMeetingAndInvite",
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
