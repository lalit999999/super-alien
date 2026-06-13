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
}
