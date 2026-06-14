import { prisma } from "@/lib/prisma";
import type { ExecutionStatus } from "@/config/generated/prisma/enums";
import type { AgentExecutionRecord } from "./agent.types";

export class AgentRepository {
  async findDbUserIdByClerkId(clerkUserId: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });
    return user?.id ?? null;
  }

  async create(userId: string, prompt: string): Promise<AgentExecutionRecord> {
    return prisma.agentExecution.create({
      data: {
        userId,
        prompt,
        status: "PENDING",
      },
    });
  }

  async updateSuccess(id: string, result: unknown): Promise<void> {
    await prisma.agentExecution.update({
      where: { id },
      data: {
        status: "SUCCESS",
        result: result as never,
      },
    });
  }

  async updateFailed(id: string, error: string): Promise<void> {
    await prisma.agentExecution.update({
      where: { id },
      data: {
        status: "FAILED",
        result: { error } as never,
      },
    });
  }

  async findByUser(
    userId: string,
    limit = 20
  ): Promise<AgentExecutionRecord[]> {
    return prisma.agentExecution.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
