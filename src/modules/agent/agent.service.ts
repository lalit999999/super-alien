import type OpenAI from "openai";
import { agentTools } from "./agent.tools";
import { executeToolCall } from "./agent.workflow";
import type { AgentRepository } from "./agent.repository";
import type { AgentChatInput, AgentChatOutput, ToolResult } from "./agent.types";
import {
  AGENT_MODEL,
  AGENT_MAX_TOKENS,
  AGENT_MAX_TOOL_ITERATIONS,
  AGENT_SYSTEM_PROMPT,
  AGENT_ERRORS,
} from "./agent.constants";

export class AgentService {
  constructor(
    private readonly openai: OpenAI,
    private readonly repo: AgentRepository
  ) {}

  async chat(input: AgentChatInput): Promise<AgentChatOutput> {
    const execution = await this.repo.create(input.userId, input.prompt);
    const toolsUsed: string[] = [];
    const toolResults: ToolResult[] = [];

    try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        { role: "user", content: input.prompt },
      ];

      let finalResponse = "";
      let iterations = 0;

      while (iterations < AGENT_MAX_TOOL_ITERATIONS) {
        iterations++;

        const response = await this.openai.chat.completions.create({
          model: AGENT_MODEL,
          max_tokens: AGENT_MAX_TOKENS,
          messages,
          tools: agentTools,
          tool_choice: "auto",
        });

        const choice = response.choices[0];

        if (!choice) throw new Error(AGENT_ERRORS.NO_RESPONSE);

        const assistantMessage = choice.message;
        messages.push(assistantMessage);

        if (choice.finish_reason === "stop" || !assistantMessage.tool_calls?.length) {
          finalResponse = assistantMessage.content ?? "";
          break;
        }

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== "function") continue;
          const toolName = toolCall.function.name;
          let parsedArgs: unknown;
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            parsedArgs = {};
          }

          const result = await executeToolCall(input.userId, toolName, parsedArgs);
          toolsUsed.push(toolName);
          toolResults.push(result);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(
              result.success ? result.data : { error: result.error }
            ),
          });
        }
      }

      if (!finalResponse) {
        finalResponse = "Actions completed successfully.";
      }

      const resultPayload = {
        response: finalResponse,
        toolsUsed,
        toolResults,
      };

      await this.repo.updateSuccess(execution.id, resultPayload);

      return {
        executionId: execution.id,
        response: finalResponse,
        toolsUsed,
        status: "SUCCESS",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : AGENT_ERRORS.EXECUTION_FAILED;
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
