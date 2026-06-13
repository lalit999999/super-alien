import type { PrismaClient, EmailPriority } from "@/config/generated/prisma/client";

export type SaveClassificationInput = {
  emailId: string;
  priority: EmailPriority;
  reason?: string | null;
  summary?: string | null;
};

export class AiRepository {
  constructor(private readonly db: PrismaClient) {}

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
}
