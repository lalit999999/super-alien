import type { GenerateDraftFromEmailInput } from "../ai.types";

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

export function buildReplyDraftMessages(input: GenerateDraftFromEmailInput) {
  const systemContent = `You are a professional email assistant. Generate a reply to the original email in the specified tone. Return JSON with a single "draft" field containing the complete reply body (do not include a subject line, just the reply text).

Tone guide:
professional — formal, business-appropriate language
friendly — warm, personable, conversational
short — brief and direct, 2-3 sentences maximum
detailed — comprehensive reply addressing every point raised`;

  const bodyOrSnippet = input.body
    ? `Body:\n${input.body.slice(0, 2000)}`
    : input.snippet
    ? `Snippet: ${input.snippet}`
    : "";

  const userContent = `Original email:
From: ${input.sender}
Subject: ${input.subject}
${bodyOrSnippet}

Generate a ${input.tone} reply to this email.`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
