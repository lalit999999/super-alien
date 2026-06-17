export function hashQuery(query: string): string {
  let h = 5381;
  for (let i = 0; i < query.length; i++) {
    h = Math.imul(h, 31) ^ query.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function buildGmailEmailKey(userId: string, emailId: string): string {
  return `gmail:user:${userId}:email:${emailId}`;
}

export function buildGmailThreadKey(userId: string, threadId: string): string {
  return `gmail:user:${userId}:thread:${threadId}`;
}

export function buildGmailSearchKey(userId: string, query: string): string {
  return `gmail:user:${userId}:search:${hashQuery(query)}`;
}

export function buildCalendarEventsKey(userId: string, tag: string): string {
  return `calendar:user:${userId}:events:${tag}`;
}

export function buildCalendarEventKey(userId: string, eventId: string): string {
  return `calendar:user:${userId}:event:${eventId}`;
}

export function buildChatMessagesKey(sessionId: string): string {
  return `chat:session:${sessionId}:messages`;
}
