import { z } from "zod";
import { EMAIL_CATEGORIES } from "./ai.constants";

// ── LLM output schemas ────────────────────────────────────────────────────────

export const classificationOutputSchema = z.object({
  priority: z.enum(["URGENT", "IMPORTANT", "NORMAL", "LOW"]),
  reason: z.string(),
  summary: z.string(),
});

export const categoryOutputSchema = z.object({
  category: z.enum(EMAIL_CATEGORIES),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export const multiSummaryOutputSchema = z.object({
  shortSummary: z.string(),
  mediumSummary: z.string(),
  bulletSummary: z.array(z.string()),
});

export const summaryOutputSchema = z.object({
  summary: z.string(),
});

export const draftOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const replyDraftOutputSchema = z.object({
  draft: z.string(),
});

// ── Request schemas ───────────────────────────────────────────────────────────

export const generateDraftRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  context: z.string().optional(),
});

export const classifyEmailRequestSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const summarizeEmailRequestSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const draftFromEmailRequestSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
  tone: z.string().min(1).default("professional"),
});

export const batchClassifyRequestSchema = z.object({
  emailIds: z.array(z.string().min(1)).min(1).max(50),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ClassificationOutput = z.infer<typeof classificationOutputSchema>;
export type CategoryOutput = z.infer<typeof categoryOutputSchema>;
export type MultiSummaryOutput = z.infer<typeof multiSummaryOutputSchema>;
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
export type DraftOutput = z.infer<typeof draftOutputSchema>;
export type ReplyDraftOutput = z.infer<typeof replyDraftOutputSchema>;
export type GenerateDraftRequest = z.infer<typeof generateDraftRequestSchema>;
export type ClassifyEmailRequest = z.infer<typeof classifyEmailRequestSchema>;
export type SummarizeEmailRequest = z.infer<typeof summarizeEmailRequestSchema>;
export type DraftFromEmailRequest = z.infer<typeof draftFromEmailRequestSchema>;
export type BatchClassifyRequest = z.infer<typeof batchClassifyRequestSchema>;
