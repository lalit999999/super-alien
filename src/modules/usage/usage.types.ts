import type { UsageFeature } from "@/config/generated/prisma/client";

export type { UsageFeature };

export interface UsageRecord {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
