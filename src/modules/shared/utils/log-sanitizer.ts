const REDACTED_KEYS = new Set([
  "body",
  "content",
  "emailBody",
  "message",
  "invitationBody",
  "draft",
  "text",
]);

function sanitizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (val !== null && typeof val === "object") {
      sanitized[key] = sanitizeValue(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function sanitizeArgsForLog(args: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(args) as Record<string, unknown>;
}
