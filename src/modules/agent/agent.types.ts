import type { ExecutionStatus } from "@/config/generated/prisma/enums";
import type { AGENT_INTENTS } from "./agent.constants";

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentChatInput = {
  userId: string;
  prompt: string;
  history?: ChatHistoryMessage[];
  sessionId?: string;
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

export type AgentIntent = (typeof AGENT_INTENTS)[keyof typeof AGENT_INTENTS];
