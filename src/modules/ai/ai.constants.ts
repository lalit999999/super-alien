export const AI_MODEL = "gpt-4o-mini" as const;

export const AI_CLASSIFICATION_MAX_TOKENS = 512;
export const AI_SUMMARY_MAX_TOKENS = 256;
export const AI_DRAFT_MAX_TOKENS = 1024;

export const AI_ERRORS = {
  NO_RESULT: "AI returned no result",
  PARSE_FAILED: "AI response parsing failed",
} as const;
