import type OpenAI from "openai";
import { agentTools } from "./agent.tools";
import { AgentWorkflow } from "./agent.workflow";
import type { AgentRepository } from "./agent.repository";
import type { AgentChatInput, AgentChatOutput, ToolResult } from "./agent.types";
import {
  AGENT_MODEL,
  AGENT_MAX_TOKENS,
  AGENT_MAX_TOOL_ITERATIONS,
  buildAgentSystemPrompt,
  AGENT_ERRORS,
} from "./agent.constants";

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(prefix: string, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`${ts} [${prefix}] ${message}${metaStr}`);
}

// ─── Rate-limit detection ─────────────────────────────────────────────────────

function isRateLimitError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("too many requests") ||
      msg.includes("quota")
    );
  }
  return false;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class AgentService {
  constructor(
    private readonly openai: OpenAI,
    private readonly repo: AgentRepository,
    private readonly workflow: AgentWorkflow
  ) {}

  async chat(input: AgentChatInput): Promise<AgentChatOutput> {
    log("AGENT", "Chat request received", {
      userId: input.userId,
      promptLength: input.prompt.length,
      model: AGENT_MODEL,
      maxIterations: AGENT_MAX_TOOL_ITERATIONS,
    });

    const dbUserId = await this.repo.findDbUserIdByClerkId(input.userId);
    if (!dbUserId) {
      log("AGENT", "User not found in DB", { clerkUserId: input.userId });
      return {
        executionId: "",
        response: AGENT_ERRORS.USER_NOT_FOUND,
        toolsUsed: [],
        status: "FAILED",
      };
    }

    const execution = await this.repo.create(dbUserId, input.prompt);
    log("AGENT", "Execution record created", { executionId: execution.id });

    const toolsUsed: string[] = [];
    const toolResults: ToolResult[] = [];

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: buildAgentSystemPrompt() },
        { role: "user", content: input.prompt },
      ];

      let finalResponse = "";
      let iterations = 0;

      while (iterations < AGENT_MAX_TOOL_ITERATIONS) {
        iterations++;
        log("PLANNER", `Iteration ${iterations}/${AGENT_MAX_TOOL_ITERATIONS}`, {
          model: AGENT_MODEL,
          maxTokens: AGENT_MAX_TOKENS,
          messageCount: messages.length,
        });

        let response: OpenAI.Chat.Completions.ChatCompletion;
        try {
          response = await this.openai.chat.completions.create({
            model: AGENT_MODEL,
            max_tokens: AGENT_MAX_TOKENS,
            messages,
            tools: agentTools,
            tool_choice: "auto",
          });
        } catch (err) {
          if (isRateLimitError(err)) {
            const msg = err instanceof Error ? err.message : String(err);
            log("AI", "Rate limit hit from provider", { iteration: iterations, error: msg });
            await this.repo.updateFailed(execution.id, "AI provider rate limit exceeded");
            return {
              executionId: execution.id,
              response: "AI provider rate limit exceeded",
              toolsUsed,
              status: "FAILED",
            };
          }
          throw err;
        }

        const choice = response.choices[0];
        if (!choice) throw new Error(AGENT_ERRORS.NO_RESPONSE);

        log("AI", "Provider response received", {
          finishReason: choice.finish_reason,
          toolCallCount: choice.message.tool_calls?.length ?? 0,
          usage: response.usage,
        });

        const assistantMessage = choice.message;
        messages.push(assistantMessage);

        if (choice.finish_reason === "stop" || !assistantMessage.tool_calls?.length) {
          finalResponse = assistantMessage.content ?? "";
          log("PLANNER", "Agent reached final response", { iteration: iterations });
          break;
        }

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== "function") continue;

          const toolName = toolCall.function.name;
          let parsedArgs: unknown;
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            log("TOOL", `Failed to parse args for ${toolName}`, {
              raw: toolCall.function.arguments.slice(0, 200),
            });
            parsedArgs = {};
          }

          log("TOOL", `Executing ${toolName}`, {
            toolCallId: toolCall.id,
            args: parsedArgs,
          });

          const result = await this.workflow.executeToolCall(
            input.userId,
            dbUserId,
            toolName,
            parsedArgs
          );

          toolsUsed.push(toolName);
          toolResults.push(result);

          if (result.success) {
            log("TOOL", `${toolName} succeeded`);
          } else {
            log("TOOL", `${toolName} failed`, { error: result.error });
          }

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(
              result.success ? result.data : { error: result.error }
            ),
          });
        }
      }

      if (iterations >= AGENT_MAX_TOOL_ITERATIONS && !finalResponse) {
        log("PLANNER", "Max iterations reached without final response", { iterations });
        finalResponse = "Actions completed (max planning steps reached).";
      }

      const resultPayload = { response: finalResponse, toolsUsed, toolResults };
      await this.repo.updateSuccess(execution.id, resultPayload);

      log("AGENT", "Execution completed", {
        executionId: execution.id,
        toolsUsed,
        iterations,
      });

      return {
        executionId: execution.id,
        response: finalResponse,
        toolsUsed,
        status: "SUCCESS",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : AGENT_ERRORS.EXECUTION_FAILED;
      log("AGENT", "Execution failed with unexpected error", { error: message });
      await this.repo.updateFailed(execution.id, message);

      return {
        executionId: execution.id,
        response: message,
        toolsUsed,
        status: "FAILED",
      };
    }
  }
}
