import { z } from "zod";

export const classificationOutputSchema = z.object({
  priority: z.enum(["URGENT", "IMPORTANT", "NORMAL", "LOW"]),
  reason: z.string(),
  summary: z.string(),
});

export const summaryOutputSchema = z.object({
  summary: z.string(),
});

export const draftOutputSchema = z.object({
  subject: z.string(),
  body: z.string(),
});

export const generateDraftRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  context: z.string().optional(),
});

export type ClassificationOutput = z.infer<typeof classificationOutputSchema>;
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;
export type DraftOutput = z.infer<typeof draftOutputSchema>;
export type GenerateDraftRequest = z.infer<typeof generateDraftRequestSchema>;
