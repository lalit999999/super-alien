import type OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { AiRepository } from "./ai.repository";
import type { ClassifyEmailInput, GenerateDraftInput } from "./ai.types";
import {
  classificationOutputSchema,
  summaryOutputSchema,
  draftOutputSchema,
} from "./ai.schema";
import type { ClassificationOutput, SummaryOutput, DraftOutput } from "./ai.schema";
import { buildClassifyEmailMessages } from "./prompts/classify-email";
import { buildSummarizeEmailMessages } from "./prompts/summarize-email";
import { buildGenerateEmailMessages } from "./prompts/generate-email";
import {
  AI_MODEL,
  AI_CLASSIFICATION_MAX_TOKENS,
  AI_SUMMARY_MAX_TOKENS,
  AI_DRAFT_MAX_TOKENS,
  AI_ERRORS,
} from "./ai.constants";

export class AiService {
  constructor(
    private readonly openai: OpenAI,
    private readonly repo: AiRepository
  ) {}

  async classifyAndSummarizeEmail(
    emailId: string,
    input: ClassifyEmailInput
  ): Promise<ClassificationOutput & { emailId: string }> {
    const messages = buildClassifyEmailMessages(input);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_CLASSIFICATION_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(classificationOutputSchema, "classification"),
    });

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    await this.repo.upsertClassification({
      emailId,
      priority: result.priority,
      reason: result.reason,
      summary: result.summary,
    });

    return { ...result, emailId };
  }

  async summarizeEmail(subject: string, body: string): Promise<SummaryOutput> {
    const messages = buildSummarizeEmailMessages(subject, body);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_SUMMARY_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(summaryOutputSchema, "summary"),
    });

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    return result;
  }

  async generateDraft(input: GenerateDraftInput): Promise<DraftOutput> {
    const messages = buildGenerateEmailMessages(input.prompt, input.context);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_DRAFT_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(draftOutputSchema, "draft"),
    });

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    return result;
  }
}
