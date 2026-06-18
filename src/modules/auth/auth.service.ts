import { upsertUserSchema, type UpsertUserInput } from "./auth.schema";
import type { AuthRepository } from "./auth.repository";
import type { DbUser } from "./auth.types";

// Business logic lives here. Never imports Prisma directly — always goes
// through the repository.
export class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  async syncUser(raw: UpsertUserInput): Promise<DbUser> {
    const input = upsertUserSchema.parse(raw);
    return this.repo.upsert(input);
  }

  async getUserByClerkUserId(clerkUserId: string): Promise<DbUser | null> {
    return this.repo.findByClerkUserId(clerkUserId);
  }

  async removeUser(clerkUserId: string): Promise<void> {
    return this.repo.deleteByClerkUserId(clerkUserId);
  }

  async deleteAccount(clerkUserId: string): Promise<void> {
    const dbUser = await this.repo.findByClerkUserId(clerkUserId);
    if (!dbUser) return;
    await this.repo.deleteAccountCascade(dbUser.id);
  }
}
