import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { rateLimitService, getRateLimitHeaders, RATE_LIMIT_ERRORS } from "@/modules/rate-limit";
import { AiRepository } from "./ai.repository";
import { AiService } from "./ai.service";
import { openai } from "./ai.provider";
import {
  generateDraftRequestSchema,
  classifyEmailRequestSchema,
  summarizeEmailRequestSchema,
  draftFromEmailRequestSchema,
  batchClassifyRequestSchema,
} from "./ai.schema";
import { AI_ERRORS } from "./ai.constants";

function makeService(): AiService {
  return new AiService(openai, new AiRepository(prisma));
}

async function enforceRateLimit(
  userId: string,
  action: "summaries" | "drafts"
) {
  const result = await (action === "drafts"
    ? rateLimitService.checkDrafts(userId)
    : rateLimitService.checkSummaries(userId));

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: RATE_LIMIT_ERRORS.EXCEEDED,
        code: RATE_LIMIT_ERRORS.CODE,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...getRateLimitHeaders(result.limit, result.remaining, result.resetAt),
        },
      }
    );
  }
  return null;
}

export async function handleGenerateDraft(req: NextRequest) {
  const { userId } = await requireAuth();

  const rateLimitErr = await enforceRateLimit(userId, "drafts");
  if (rateLimitErr) return rateLimitErr;

  const body = await req.json().catch(() => ({}));
  const parsed = generateDraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const service = makeService();
  const draft = await service.generateDraft(parsed.data);

  return ok(draft);
}

export async function handleClassify(req: NextRequest) {
  const { userId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = classifyEmailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const service = makeService();

  try {
    const result = await service.classifyEmail(parsed.data.emailId, userId);
    return ok({ category: result.category, confidence: result.confidence, reasoning: result.reasoning });
  } catch (err) {
    if (err instanceof Error && err.message === AI_ERRORS.EMAIL_NOT_FOUND) {
      return fail("Email not found", "NOT_FOUND", 404);
    }
    return fail("Classification failed", "AI_ERROR", 500);
  }
}

export async function handleSummarize(req: NextRequest) {
  const { userId } = await requireAuth();

  const rateLimitErr = await enforceRateLimit(userId, "summaries");
  if (rateLimitErr) return rateLimitErr;

  const body = await req.json().catch(() => ({}));
  const parsed = summarizeEmailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const service = makeService();

  try {
    const result = await service.summarizeEmailById(parsed.data.emailId, userId);
    return ok({
      shortSummary: result.shortSummary,
      mediumSummary: result.mediumSummary,
      bulletSummary: result.bulletSummary,
    });
  } catch (err) {
    if (err instanceof Error && err.message === AI_ERRORS.EMAIL_NOT_FOUND) {
      return fail("Email not found", "NOT_FOUND", 404);
    }
    return fail("Summarization failed", "AI_ERROR", 500);
  }
}

export async function handleDraftFromEmail(req: NextRequest) {
  const { userId } = await requireAuth();

  const rateLimitErr = await enforceRateLimit(userId, "drafts");
  if (rateLimitErr) return rateLimitErr;

  const body = await req.json().catch(() => ({}));
  const parsed = draftFromEmailRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const service = makeService();

  try {
    const result = await service.generateDraftFromEmail(
      parsed.data.emailId,
      parsed.data.tone,
      userId
    );
    return ok({ draft: result.draft });
  } catch (err) {
    if (err instanceof Error && err.message === AI_ERRORS.EMAIL_NOT_FOUND) {
      return fail("Email not found", "NOT_FOUND", 404);
    }
    return fail("Draft generation failed", "AI_ERROR", 500);
  }
}

export async function handleBatchClassify(req: NextRequest) {
  const { userId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = batchClassifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body — emailIds array required (max 50)", "VALIDATION_ERROR");
  }

  const service = makeService();
  const results = await service.batchClassify(parsed.data.emailIds, userId);

  return ok({ results, total: results.length });
}
