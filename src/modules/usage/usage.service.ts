import type { UsageRepository } from "./usage.repository";
import type { UsageFeature } from "@/config/generated/prisma/client";
import type { UsageRecord } from "./usage.types";

export class UsageService {
  constructor(private readonly repo: UsageRepository) {}

  async recordUsage(
    userId: string,
    feature: UsageFeature,
    usage: UsageRecord,
    model: string
  ): Promise<void> {
    await this.repo.insertUsage({
      userId,
      feature,
      model,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
    });
  }
}
