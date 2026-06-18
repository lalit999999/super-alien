import type { PrismaClient, EmailPriority } from "@/config/generated/prisma/client";

export type SaveClassificationInput = {
  emailId: string;
  priority: EmailPriority;
  reason?: string | null;
  summary?: string | null;
};

export type SaveCategoryInput = {
  emailId: string;
  category: string;
  confidence: number;
  reasoning?: string | null;
};

export type SaveSummaryInput = {
  emailId: string;
  shortSummary: string;
  mediumSummary: string;
  bulletSummary: string[];
};

export type SaveDraftInput = {
  emailId: string;
  content: string;
  tone: string;
};

export class AiRepository {
  constructor(private readonly db: PrismaClient) {}

  // ── Email reads (AI reads from DB, never from Corsair) ──────────────────────

  async getEmailById(emailId: string, clerkUserId: string) {
    return this.db.email.findFirst({
      where: { id: emailId, user: { clerkUserId } },
    });
  }

  async getEmailsByIds(emailIds: string[], clerkUserId: string) {
    return this.db.email.findMany({
      where: { id: { in: emailIds }, user: { clerkUserId } },
    });
  }

  // ── Classification (priority-based, existing) ───────────────────────────────

  async upsertClassification(input: SaveClassificationInput) {
    return this.db.emailClassification.upsert({
      where: { emailId: input.emailId },
      create: {
        emailId: input.emailId,
        priority: input.priority,
        reason: input.reason ?? null,
        summary: input.summary ?? null,
      },
      update: {
        priority: input.priority,
        reason: input.reason ?? null,
        summary: input.summary ?? null,
      },
    });
  }

  async getClassificationByEmailId(emailId: string) {
    return this.db.emailClassification.findUnique({
      where: { emailId },
    });
  }

  // ── Category (new category-based classification) ────────────────────────────

  async upsertCategory(input: SaveCategoryInput) {
    return this.db.emailClassification.upsert({
      where: { emailId: input.emailId },
      create: {
        emailId: input.emailId,
        priority: "NORMAL",
        category: input.category,
        confidence: input.confidence,
        reason: input.reasoning ?? null,
      },
      update: {
        category: input.category,
        confidence: input.confidence,
        reason: input.reasoning ?? null,
      },
    });
  }

  // ── Summary ─────────────────────────────────────────────────────────────────

  async upsertSummary(input: SaveSummaryInput) {
    return this.db.emailSummary.upsert({
      where: { emailId: input.emailId },
      create: {
        emailId: input.emailId,
        shortSummary: input.shortSummary,
        mediumSummary: input.mediumSummary,
        bulletSummary: input.bulletSummary,
      },
      update: {
        shortSummary: input.shortSummary,
        mediumSummary: input.mediumSummary,
        bulletSummary: input.bulletSummary,
      },
    });
  }

  async getSummaryByEmailId(emailId: string) {
    return this.db.emailSummary.findUnique({
      where: { emailId },
    });
  }

  // ── Draft ───────────────────────────────────────────────────────────────────

  async saveDraft(input: SaveDraftInput) {
    return this.db.emailDraft.create({
      data: {
        emailId: input.emailId,
        content: input.content,
        tone: input.tone,
      },
    });
  }

  async getDraftsByEmailId(emailId: string) {
    return this.db.emailDraft.findMany({
      where: { emailId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getLatestDraftByEmailId(emailId: string) {
    return this.db.emailDraft.findFirst({
      where: { emailId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findUserIdByClerkId(clerkUserId: string): Promise<string | null> {
    const user = await this.db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    return user?.id ?? null;
  }
}
