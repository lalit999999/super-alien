import type OpenAI from "openai";
import { agentTools } from "./agent.tools";
import { AgentWorkflow } from "./agent.workflow";
import type { AgentRepository } from "./agent.repository";
import type { ActiveContext, AgentChatInput, AgentChatOutput, ToolResult } from "./agent.types";
import {
  AGENT_MODEL,
  AGENT_MAX_TOKENS,
  AGENT_MAX_TOOL_ITERATIONS,
  buildAgentSystemPrompt,
  AGENT_ERRORS,
} from "./agent.constants";
import { sanitizeArgsForLog } from "@/modules/shared/utils/log-sanitizer";

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

// ─── Input normalization ──────────────────────────────────────────────────────

const YES_TOKENS = new Set(["yes", "yeah", "yep", "yup", "sure", "ok", "okay", "do it", "sounds good", "proceed", "go ahead", "affirmative", "yea", "k"]);
const NO_TOKENS = new Set(["no", "nvm", "cancel", "nope", "nah", "stop", "nevermind", "never mind"]);

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (__, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

type NormalizeResult = { normalized: string; isConfirm: boolean; isDeny: boolean };

function normalizeConfirmationInput(prompt: string): NormalizeResult {
  const clean = prompt.trim().toLowerCase();

  if (YES_TOKENS.has(clean)) return { normalized: "yes", isConfirm: true, isDeny: false };
  if (NO_TOKENS.has(clean)) return { normalized: "no", isConfirm: false, isDeny: true };

  // Fuzzy match short tokens (≤ 6 chars) within edit-distance 2
  if (clean.length <= 6) {
    for (const token of YES_TOKENS) {
      if (token.length <= 6 && levenshtein(clean, token) <= 2) {
        log("NORM", `Normalized "${clean}" → yes (fuzzy match "${token}")`);
        return { normalized: "yes", isConfirm: true, isDeny: false };
      }
    }
    for (const token of NO_TOKENS) {
      if (token.length <= 6 && levenshtein(clean, token) <= 2) {
        log("NORM", `Normalized "${clean}" → no (fuzzy match "${token}")`);
        return { normalized: "no", isConfirm: false, isDeny: true };
      }
    }
  }

  return { normalized: prompt, isConfirm: false, isDeny: false };
}

// ─── ActiveContext helpers ────────────────────────────────────────────────────

// Tool arg fields that must be grounded in real IDs (never fabricated).
const ID_ARG_FIELDS = new Set(["emailId", "threadId", "corsairEventId", "eventId"]);

function extractIdsFromResult(result: ToolResult): Set<string> {
  const ids = new Set<string>();
  if (!result.success || !result.data) return ids;
  const d = result.data as Record<string, unknown>;

  // searchEmails → { emails: [...] }
  const emails = (d.emails as Record<string, unknown>[] | undefined) ?? [];
  for (const e of emails) {
    if (typeof e.id === "string" && e.id) ids.add(e.id);
    if (typeof e.corsairEmailId === "string" && e.corsairEmailId) ids.add(e.corsairEmailId);
    if (typeof e.threadId === "string" && e.threadId) ids.add(e.threadId);
  }

  // getEmail / direct email object
  if (typeof d.id === "string" && d.id) ids.add(d.id);
  if (typeof d.corsairEmailId === "string" && d.corsairEmailId) ids.add(d.corsairEmailId);
  if (typeof d.threadId === "string" && d.threadId) ids.add(d.threadId);

  // getEvents → { events: [...] }
  const events = (d.events as Record<string, unknown>[] | undefined) ?? [];
  for (const ev of events) {
    if (typeof ev.id === "string" && ev.id) ids.add(ev.id);
    if (typeof ev.corsairEventId === "string" && ev.corsairEventId) ids.add(ev.corsairEventId);
  }

  // createEvent / updateEvent direct result
  if (typeof d.corsairEventId === "string" && d.corsairEventId) ids.add(d.corsairEventId);

  return ids;
}

function buildKnownIds(ctx: ActiveContext, toolResults: ToolResult[]): Set<string> {
  const ids = new Set<string>();
  if (ctx.lastEmailId) ids.add(ctx.lastEmailId);
  if (ctx.lastCorsairEmailId) ids.add(ctx.lastCorsairEmailId);
  if (ctx.lastThreadId) ids.add(ctx.lastThreadId);
  if (ctx.lastEventId) ids.add(ctx.lastEventId);
  if (ctx.lastCorsairEventId) ids.add(ctx.lastCorsairEventId);
  if (ctx.pendingAction?.targetId) ids.add(ctx.pendingAction.targetId);
  for (const id of ctx.lastSearchResultIds ?? []) ids.add(id);
  for (const r of toolResults) {
    for (const id of extractIdsFromResult(r)) ids.add(id);
  }
  return ids;
}

// Returns an error message if any ID arg is ungrounded, otherwise null.
function validateIdArgs(args: unknown, knownIds: Set<string>): string | null {
  if (typeof args !== "object" || !args) return null;
  for (const field of ID_ARG_FIELDS) {
    const value = (args as Record<string, unknown>)[field];
    if (typeof value === "string" && value && !knownIds.has(value)) {
      return `ID "${value}" passed to "${field}" was not returned by any prior tool call. ` +
        `Call searchEmails or getEvents first to obtain a valid ID, then retry.`;
    }
  }
  return null;
}

function updateContextFromResult(ctx: ActiveContext, toolName: string, result: ToolResult): ActiveContext {
  if (!result.success || !result.data) return ctx;
  const d = result.data as Record<string, unknown>;
  const updated: ActiveContext = { ...ctx };

  if (toolName === "searchEmails") {
    const emails = (d.emails as Record<string, unknown>[] | undefined) ?? [];
    if (emails.length > 0) {
      updated.lastSearchResultIds = emails
        .map((e) => (typeof e.id === "string" ? e.id : ""))
        .filter(Boolean);
      const first = emails[0];
      if (first) {
        if (typeof first.id === "string") updated.lastEmailId = first.id;
        if (typeof first.corsairEmailId === "string") updated.lastCorsairEmailId = first.corsairEmailId;
        if (typeof first.threadId === "string") updated.lastThreadId = first.threadId;
      }
    }
  } else if (toolName === "getEmail") {
    if (typeof d.id === "string") updated.lastEmailId = d.id;
    if (typeof d.corsairEmailId === "string") updated.lastCorsairEmailId = d.corsairEmailId;
    if (typeof d.threadId === "string") updated.lastThreadId = d.threadId;
  } else if (toolName === "getThread") {
    if (typeof d.threadId === "string") updated.lastThreadId = d.threadId;
  } else if (toolName === "getEvents") {
    const events = (d.events as Record<string, unknown>[] | undefined) ?? [];
    const first = events[0];
    if (first) {
      if (typeof first.id === "string") updated.lastEventId = first.id;
      if (typeof first.corsairEventId === "string") updated.lastCorsairEventId = first.corsairEventId;
    }
  } else if (toolName === "createEvent") {
    if (typeof d.id === "string") updated.lastEventId = d.id;
    if (typeof d.corsairEventId === "string") updated.lastCorsairEventId = d.corsairEventId;
  }

  return updated;
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
      hasContext: !!input.activeContext,
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
    let activeContext: ActiveContext = input.activeContext ?? {};

    // Normalize short confirmation inputs before sending to LLM
    const { normalized: normalizedPrompt, isConfirm } = normalizeConfirmationInput(input.prompt);
    const promptToSend =
      isConfirm && activeContext.pendingAction
        ? `yes — proceed with: ${activeContext.pendingAction.type} on ${activeContext.pendingAction.targetId}`
        : normalizedPrompt;

    if (promptToSend !== input.prompt) {
      log("NORM", "Prompt normalized", { original: input.prompt, normalized: promptToSend });
    }

    try {
      const historyMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
        (input.history ?? []).map((h) => ({
          role: h.role,
          content: h.content,
        }));

      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: "system", content: buildAgentSystemPrompt(activeContext) },
        ...historyMessages,
        { role: "user", content: promptToSend },
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
              updatedContext: activeContext,
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

        const knownIds = buildKnownIds(activeContext, toolResults);

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

          // Hard constraint: reject ungrounded ID arguments
          const idError = validateIdArgs(parsedArgs, knownIds);
          if (idError) {
            log("TOOL", `ID validation failed for ${toolName}`, { error: idError });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: idError }),
            });
            continue;
          }

          log("TOOL", `Executing ${toolName}`, {
            toolCallId: toolCall.id,
            args: sanitizeArgsForLog((parsedArgs ?? {}) as Record<string, unknown>),
          });

          const result = await this.workflow.executeToolCall(
            input.userId,
            dbUserId,
            toolName,
            parsedArgs
          );

          toolsUsed.push(toolName);
          toolResults.push(result);

          // Update ActiveContext with IDs from this result
          activeContext = updateContextFromResult(activeContext, toolName, result);

          // Also update knownIds for remaining tool calls in this batch
          for (const id of extractIdsFromResult(result)) knownIds.add(id);

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

      // Clear pendingAction after a confirmed turn
      if (isConfirm && activeContext.pendingAction) {
        activeContext = { ...activeContext, pendingAction: undefined };
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
        updatedContext: activeContext,
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
        updatedContext: activeContext,
      };
    }
  }
}
