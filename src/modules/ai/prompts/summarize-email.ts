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

export function buildMultiSummarizeMessages(subject: string, body: string) {
  const systemContent = `You are an email assistant. Analyze the email and return JSON with exactly these fields:
- shortSummary: one sentence (max 20 words) capturing the core message
- mediumSummary: 2-3 sentences covering key details and any required actions
- bulletSummary: array of 3-5 concise strings covering all important aspects, each starting with a verb or noun (no bullet characters needed)`;

  const userContent = `Subject: ${subject}

Body:
${body.slice(0, 2500)}

Summarize this email.`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
