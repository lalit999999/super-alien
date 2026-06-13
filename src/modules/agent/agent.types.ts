import type { ExecutionStatus } from "@/config/generated/prisma/enums";

export type AgentChatInput = {
  userId: string;
  prompt: string;
};

export type AgentChatOutput = {
  executionId: string;
  response: string;
  toolsUsed: string[];
  status: ExecutionStatus;
};

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

export type ToolResult = {
  toolName: string;
  success: boolean;
  data?: unknown;
  error?: string;
};

export type AgentExecutionRecord = {
  id: string;
  userId: string;
  prompt: string;
  status: ExecutionStatus;
  result: unknown;
  createdAt: Date;
};
