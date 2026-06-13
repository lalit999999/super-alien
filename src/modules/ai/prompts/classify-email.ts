import type { ClassifyEmailInput } from "../ai.types";

export function buildClassifyEmailMessages(input: ClassifyEmailInput) {
  const systemContent = `You are an email prioritization assistant. Analyze the email and return JSON with exactly these fields:
- priority: one of "URGENT", "IMPORTANT", "NORMAL", "LOW"
- reason: one sentence explaining the classification
- summary: 1-2 sentence summary of what the email is about

Priority guide:
URGENT — time-sensitive, requires immediate action or response
IMPORTANT — important but not time-critical
NORMAL — regular correspondence, no urgency
LOW — newsletters, promotions, automated notifications, spam-like`;

  const userContent = `From: ${input.sender}
Subject: ${input.subject}${input.snippet ? `\nSnippet: ${input.snippet}` : ""}${input.body ? `\n\nBody:\n${input.body.slice(0, 1500)}` : ""}

Classify this email.`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
