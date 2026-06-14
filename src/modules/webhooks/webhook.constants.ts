export const WEBHOOK_ERRORS = {
  TENANT_MISSING: "WEBHOOK_TENANT_MISSING",
  USER_NOT_FOUND: "WEBHOOK_USER_NOT_FOUND",
  PROCESS_FAILED: "WEBHOOK_PROCESS_FAILED",
  INVALID_SIGNATURE: "WEBHOOK_INVALID_SIGNATURE",
  UNKNOWN_EVENT: "WEBHOOK_UNKNOWN_EVENT",
} as const;

export const WEBHOOK_PLUGINS = {
  GMAIL: "gmail",
  GOOGLE_CALENDAR: "googlecalendar",
} as const;

export const GMAIL_EVENT_TYPES = {
  MESSAGE_RECEIVED: "messageReceived",
  MESSAGE_DELETED: "messageDeleted",
  MESSAGE_LABEL_CHANGED: "messageLabelChanged",
} as const;

export const CALENDAR_EVENT_TYPES = {
  EVENT_CREATED: "eventCreated",
  EVENT_UPDATED: "eventUpdated",
  EVENT_DELETED: "eventDeleted",
} as const;

export const WEBHOOK_STATUS = {
  PROCESSED: "processed",
  SKIPPED: "skipped",
  FAILED: "failed",
} as const;
