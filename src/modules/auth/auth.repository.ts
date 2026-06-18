import type { PrismaClient } from "@/config/generated/prisma/client";
import type { DbUser } from "./auth.types";
import type { UpsertUserInput } from "./auth.schema";

// The only layer that touches Prisma. Receives an injected client so callers
// can substitute a transaction client without any extra coupling.
export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByClerkUserId(clerkUserId: string): Promise<DbUser | null> {
    return this.db.user.findUnique({ where: { clerkUserId } });
  }

  async upsert(input: UpsertUserInput): Promise<DbUser> {
    return this.db.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        email: input.email,
      },
      update: {
        email: input.email,
      },
    });
  }

  async deleteByClerkUserId(clerkUserId: string): Promise<void> {
    await this.db.user.delete({ where: { clerkUserId } });
  }

  async deleteAccountCascade(userId: string): Promise<void> {
    const emails = await this.db.email.findMany({
      where: { userId },
      select: { id: true },
    });
    const emailIds = emails.map((e) => e.id);

    await this.db.$transaction([
      this.db.emailDraft.deleteMany({ where: { emailId: { in: emailIds } } }),
      this.db.emailSummary.deleteMany({ where: { emailId: { in: emailIds } } }),
      this.db.emailClassification.deleteMany({ where: { emailId: { in: emailIds } } }),
      this.db.email.deleteMany({ where: { userId } }),
      this.db.calendarEvent.deleteMany({ where: { userId } }),
      this.db.agentExecution.deleteMany({ where: { userId } }),
      this.db.chatSession.deleteMany({ where: { userId } }),
      this.db.syncRecord.deleteMany({ where: { userId } }),
      this.db.payment.deleteMany({ where: { userId } }),
      this.db.subscription.deleteMany({ where: { userId } }),
      this.db.tokenUsage.deleteMany({ where: { userId } }),
      this.db.userPreference.deleteMany({ where: { userId } }),
      this.db.task.deleteMany({ where: { userId } }),
      this.db.user.delete({ where: { id: userId } }),
    ]);
  }
}
