import {
  sendEmail,
  createEvent,
  getEvents,
} from "@/modules/corsair/corsair.service";
import {
  sendEmailArgsSchema,
  createEventArgsSchema,
  getEventsArgsSchema,
} from "./agent.schema";
import { AGENT_TOOL_NAMES } from "./agent.constants";
import type { ToolResult } from "./agent.types";

export async function executeToolCall(
  userId: string,
  toolName: string,
  rawArgs: unknown
): Promise<ToolResult> {
  try {
    if (toolName === AGENT_TOOL_NAMES.SEND_EMAIL) {
      const args = sendEmailArgsSchema.parse(rawArgs);
      const data = await sendEmail(userId, {
        to: args.to,
        subject: args.subject,
        body: args.body,
        threadId: args.threadId,
      });
      return { toolName, success: true, data };
    }

    if (toolName === AGENT_TOOL_NAMES.CREATE_EVENT) {
      const args = createEventArgsSchema.parse(rawArgs);
      const tz = args.timeZone ?? "UTC";
      const data = await createEvent(userId, {
        event: {
          summary: args.summary,
          description: args.description,
          location: args.location,
          start: { dateTime: args.startDateTime, timeZone: tz },
          end: { dateTime: args.endDateTime, timeZone: tz },
          attendees: args.attendees?.map((email) => ({ email })),
        },
        sendUpdates: args.attendees?.length ? "all" : "none",
      });
      return { toolName, success: true, data };
    }

    if (toolName === AGENT_TOOL_NAMES.GET_EVENTS) {
      const args = getEventsArgsSchema.parse(rawArgs);
      const data = await getEvents(userId, {
        timeMin: args.timeMin ?? new Date().toISOString(),
        timeMax: args.timeMax,
        maxResults: args.maxResults ?? 10,
      });
      return { toolName, success: true, data };
    }

    return {
      toolName,
      success: false,
      error: `Unknown tool: ${toolName}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { toolName, success: false, error: message };
  }
}
