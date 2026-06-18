import type { PrismaClient } from "@/config/generated/prisma/client";
import type { UsageFeature } from "@/config/generated/prisma/client";

export class UsageRepository {
  constructor(private readonly db: PrismaClient) {}

  async insertUsage(data: {
    userId: string;
    feature: UsageFeature;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
  }) {
    return this.db.tokenUsage.create({ data });
  }

  async findDailyTotalsForPeriod(
    userId: string,
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; tokens: number }>> {
    const rows = await this.db.$queryRaw<Array<{ date: string; tokens: bigint }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS date,
        SUM("totalTokens") AS tokens
      FROM "TokenUsage"
      WHERE "userId" = ${userId}
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((r) => ({ date: r.date, tokens: Number(r.tokens) }));
  }

  async sumTokensForPeriod(userId: string, from: Date, to: Date): Promise<number> {
    const result = await this.db.tokenUsage.aggregate({
      where: { userId, createdAt: { gte: from, lt: to } },
      _sum: { totalTokens: true },
    });
    return result._sum.totalTokens ?? 0;
  }
}
