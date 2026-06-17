export const CACHE_TTL = {
  EMAIL: 15 * 60,
  THREAD: 15 * 60,
  SEARCH: 5 * 60,
  CALENDAR_EVENTS: 5 * 60,
  CALENDAR_EVENT: 10 * 60,
  CALENDAR_UPCOMING: 5 * 60,
  CHAT_MESSAGES: 10 * 60,
} as const;

export const CACHE_PREFIXES = {
  GMAIL_EMAIL: "gmail:user",
  GMAIL_THREAD: "gmail:user",
  GMAIL_SEARCH: "gmail:user",
  CALENDAR_EVENTS: "calendar:user",
  CALENDAR_EVENT: "calendar:user",
  CHAT: "chat:session",
} as const;
