import type { EMAIL_CATEGORIES, DRAFT_TONES } from "./ai.constants";

export type ClassifyEmailInput = {
  subject: string;
  sender: string;
  snippet?: string | null;
  body?: string | null;
};

export type GenerateDraftInput = {
  prompt: string;
  context?: string;
};

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export type DraftTone = (typeof DRAFT_TONES)[number] | string;

export type SummarizeEmailInput = {
  subject: string;
  body: string;
};

export type GenerateDraftFromEmailInput = {
  subject: string;
  sender: string;
  body?: string | null;
  snippet?: string | null;
  tone: DraftTone;
};
