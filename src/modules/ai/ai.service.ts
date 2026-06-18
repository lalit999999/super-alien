import type OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { AiRepository } from "./ai.repository";
import type { ClassifyEmailInput, GenerateDraftInput } from "./ai.types";
import {
  classificationOutputSchema,
  categoryOutputSchema,
  multiSummaryOutputSchema,
  summaryOutputSchema,
  draftOutputSchema,
  replyDraftOutputSchema,
} from "./ai.schema";
import type {
  ClassificationOutput,
  CategoryOutput,
  MultiSummaryOutput,
  SummaryOutput,
  DraftOutput,
  ReplyDraftOutput,
} from "./ai.schema";
import { buildClassifyEmailMessages, buildCategoryEmailMessages } from "./prompts/classify-email";
import { buildSummarizeEmailMessages, buildMultiSummarizeMessages } from "./prompts/summarize-email";
import { buildGenerateEmailMessages, buildReplyDraftMessages } from "./prompts/generate-email";
import {
  AI_MODEL,
  AI_CLASSIFICATION_MAX_TOKENS,
  AI_SUMMARY_MAX_TOKENS,
  AI_DRAFT_MAX_TOKENS,
  AI_ERRORS,
} from "./ai.constants";
import type { UsageService } from "@/modules/usage/usage.service";
import { UsageFeature } from "@/config/generated/prisma/client";

export class AiService {
  constructor(
    private readonly openai: OpenAI,
    private readonly repo: AiRepository,
    private readonly usageService?: UsageService
  ) {}

  private async tryLogUsage(
    userId: string | null | undefined,
    feature: UsageFeature,
    usage: OpenAI.CompletionUsage | undefined | null,
    model: string
  ): Promise<void> {
    if (!userId || !usage || !this.usageService) return;
    try {
      await this.usageService.recordUsage(
        userId,
        feature,
        {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        },
        model
      );
    } catch (err) {
      console.error("[AiService] usage logging failed:", err);
    }
  }

  // ── Legacy: priority classify + single summary in one call ─────────────────

  async classifyAndSummarizeEmail(
    emailId: string,
    input: ClassifyEmailInput,
    userId?: string
  ): Promise<ClassificationOutput & { emailId: string }> {
    const messages = buildClassifyEmailMessages(input);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_CLASSIFICATION_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(classificationOutputSchema, "classification"),
    });

    void this.tryLogUsage(userId, UsageFeature.CLASSIFY, response.usage, AI_MODEL);

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

  // ── Feature 1: Category-based email classification ─────────────────────────

  async classifyEmail(
    emailId: string,
    clerkUserId: string
  ): Promise<CategoryOutput & { emailId: string }> {
    const cached = await this.repo.getClassificationByEmailId(emailId);
    if (cached?.category) {
      console.log(`[AI] classifyEmail cache-hit emailId=${emailId}`);
      return {
        emailId,
        category: cached.category as CategoryOutput["category"],
        confidence: cached.confidence ?? 0,
        reasoning: cached.reason ?? "",
      };
    }
    console.log(`[AI] classifyEmail cache-miss emailId=${emailId}`);

    const email = await this.repo.getEmailById(emailId, clerkUserId);
    if (!email) throw new Error(AI_ERRORS.EMAIL_NOT_FOUND);

    const messages = buildCategoryEmailMessages({
      subject: email.subject,
      sender: email.sender,
      snippet: email.snippet,
      body: email.body,
    });

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_CLASSIFICATION_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(categoryOutputSchema, "category"),
    });

    const userId = await this.repo.findUserIdByClerkId(clerkUserId);
    void this.tryLogUsage(userId, UsageFeature.CLASSIFY, response.usage, AI_MODEL);

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    await this.repo.upsertCategory({
      emailId,
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning,
    });

    return { ...result, emailId };
  }

  async batchClassify(
    emailIds: string[],
    clerkUserId: string
  ): Promise<Array<CategoryOutput & { emailId: string }>> {
    const results: Array<CategoryOutput & { emailId: string }> = [];

    for (const emailId of emailIds) {
      try {
        const result = await this.classifyEmail(emailId, clerkUserId);
        results.push(result);
      } catch {
        results.push({
          emailId,
          category: "OTHER",
          confidence: 0,
          reasoning: "Classification failed",
        });
      }
    }

    return results;
  }

  // ── Feature 2: Multi-part summarization ────────────────────────────────────

  async summarizeEmailById(
    emailId: string,
    clerkUserId: string
  ): Promise<MultiSummaryOutput & { emailId: string }> {
    const cached = await this.repo.getSummaryByEmailId(emailId);
    if (cached) {
      console.log(`[AI] summarizeEmail cache-hit emailId=${emailId}`);
      return {
        emailId,
        shortSummary: cached.shortSummary,
        mediumSummary: cached.mediumSummary,
        bulletSummary: cached.bulletSummary as string[],
      };
    }
    console.log(`[AI] summarizeEmail cache-miss emailId=${emailId}`);

    const email = await this.repo.getEmailById(emailId, clerkUserId);
    if (!email) throw new Error(AI_ERRORS.EMAIL_NOT_FOUND);

    const body = email.body ?? email.snippet ?? "";
    const messages = buildMultiSummarizeMessages(email.subject, body);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_SUMMARY_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(multiSummaryOutputSchema, "summary"),
    });

    const userId = await this.repo.findUserIdByClerkId(clerkUserId);
    void this.tryLogUsage(userId, UsageFeature.SUMMARIZE, response.usage, AI_MODEL);

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    await this.repo.upsertSummary({
      emailId,
      shortSummary: result.shortSummary,
      mediumSummary: result.mediumSummary,
      bulletSummary: result.bulletSummary,
    });

    return { ...result, emailId };
  }

  async batchSummarize(
    emailIds: string[],
    clerkUserId: string
  ): Promise<Array<MultiSummaryOutput & { emailId: string }>> {
    const results: Array<MultiSummaryOutput & { emailId: string }> = [];

    for (const emailId of emailIds) {
      try {
        const result = await this.summarizeEmailById(emailId, clerkUserId);
        results.push(result);
      } catch {
        results.push({
          emailId,
          shortSummary: "Summarization failed",
          mediumSummary: "Summarization failed",
          bulletSummary: [],
        });
      }
    }

    return results;
  }

  // ── Feature 3: Draft generation ────────────────────────────────────────────

  async generateDraftFromEmail(
    emailId: string,
    tone: string,
    clerkUserId: string
  ): Promise<ReplyDraftOutput & { emailId: string }> {
    const email = await this.repo.getEmailById(emailId, clerkUserId);
    if (!email) throw new Error(AI_ERRORS.EMAIL_NOT_FOUND);

    const messages = buildReplyDraftMessages({
      subject: email.subject,
      sender: email.sender,
      body: email.body,
      snippet: email.snippet,
      tone,
    });

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_DRAFT_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(replyDraftOutputSchema, "draft"),
    });

    const userId = await this.repo.findUserIdByClerkId(clerkUserId);
    void this.tryLogUsage(userId, UsageFeature.DRAFT, response.usage, AI_MODEL);

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    await this.repo.saveDraft({
      emailId,
      content: result.draft,
      tone,
    });

    return { ...result, emailId };
  }

  // ── Free-form draft (prompt + context) ────────────────────────────────────

  async generateDraft(input: GenerateDraftInput, userId?: string): Promise<DraftOutput> {
    const messages = buildGenerateEmailMessages(input.prompt, input.context);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_DRAFT_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(draftOutputSchema, "draft"),
    });

    void this.tryLogUsage(userId, UsageFeature.DRAFT, response.usage, AI_MODEL);

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    return result;
  }

  // ── Legacy: simple single summary ─────────────────────────────────────────

  async summarizeEmail(subject: string, body: string, userId?: string): Promise<SummaryOutput> {
    const messages = buildSummarizeEmailMessages(subject, body);

    const response = await this.openai.chat.completions.parse({
      model: AI_MODEL,
      max_tokens: AI_SUMMARY_MAX_TOKENS,
      messages,
      response_format: zodResponseFormat(summaryOutputSchema, "summary"),
    });

    void this.tryLogUsage(userId, UsageFeature.SUMMARIZE, response.usage, AI_MODEL);

    const result = response.choices[0].message.parsed;
    if (!result) throw new Error(AI_ERRORS.NO_RESULT);

    return result;
  }
}
