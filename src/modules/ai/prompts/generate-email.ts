export function buildGenerateEmailMessages(prompt: string, context?: string) {
  const systemContent = `You are a professional email writing assistant. Generate an email based on the user's request and return JSON with exactly these fields:
- subject: a clear, concise email subject line
- body: the full email body in professional tone, properly formatted with paragraphs`;

  const userContent = context
    ? `${prompt}\n\nContext:\n${context}`
    : prompt;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
