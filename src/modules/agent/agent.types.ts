import type { ExecutionStatus } from "@/config/generated/prisma/enums";
import type { AGENT_INTENTS } from "./agent.constants";

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

// Structured entity context that persists across turns within a chat session.
// Prevents the agent from re-deriving entities it already resolved and stops
// it from fabricating IDs that were never returned by a real tool call.
export type ActiveContext = {
  lastEmailId?: string;
  lastCorsairEmailId?: string;
  lastThreadId?: string;
  lastSearchResultIds?: string[];
  lastEventId?: string;
  lastCorsairEventId?: string;
  pendingAction?: {
    type: "showThread" | "showDetails" | "archive" | "delete" | "sendDraft" | "sendEmail";
    targetId: string;
  };
};

export type AgentChatInput = {
  userId: string;
  prompt: string;
  history?: ChatHistoryMessage[];
  sessionId?: string;
  activeContext?: ActiveContext;
};

export type AgentChatOutput = {
  executionId: string;
  response: string;
  toolsUsed: string[];
  status: ExecutionStatus;
  updatedContext?: ActiveContext;
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
