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

export function buildCategoryEmailMessages(input: ClassifyEmailInput) {
  const systemContent = `You are an email categorization assistant. Analyze the email and return JSON with exactly these fields:
- category: one of "IMPORTANT", "PROMOTION", "SOCIAL", "NEWSLETTER", "ORDER", "FINANCE", "MEETING", "OTHER"
- confidence: float between 0 and 1 (e.g. 0.92)
- reasoning: one sentence explaining the category choice

Category guide:
IMPORTANT — requires personal attention or action (job offers, legal, personal, urgent requests)
PROMOTION — discounts, sales, marketing emails, special offers
SOCIAL — social network notifications, friend requests, comments, mentions
NEWSLETTER — subscriptions, digests, curated content newsletters
ORDER — e-commerce order confirmations, shipping updates, delivery notifications
FINANCE — invoices, bank statements, payments, receipts, tax documents
MEETING — meeting invites, calendar events, scheduling requests, conference details
OTHER — anything that does not clearly fit the above categories`;

  const userContent = `From: ${input.sender}
Subject: ${input.subject}${input.snippet ? `\nSnippet: ${input.snippet}` : ""}${input.body ? `\n\nBody:\n${input.body.slice(0, 1500)}` : ""}

Categorize this email.`;

  return [
    { role: "system" as const, content: systemContent },
    { role: "user" as const, content: userContent },
  ];
}
