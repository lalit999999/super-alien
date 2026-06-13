export function buildSummarizeEmailMessages(subject: string, body: string) {
  const systemContent = `You are an email assistant. Return JSON with a single "summary" field containing a concise 1-2 sentence summary that captures the key information and any required action.`;

  const userContent = `Subject: ${subject}

Body:
${body.slice(0, 2000)}

Summarize this email.`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
