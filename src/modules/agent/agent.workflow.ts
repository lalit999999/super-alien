import type { GmailService } from "@/modules/gmail";
import type { CalendarService } from "@/modules/calendar";
import type { AiService } from "@/modules/ai";
import {
  searchEmailsArgsSchema,
  getEmailArgsSchema,
  summarizeEmailArgsSchema,
  classifyEmailArgsSchema,
  generateDraftArgsSchema,
  sendEmailArgsSchema,
  getEventsArgsSchema,
  createEventArgsSchema,
  updateEventArgsSchema,
  deleteEventArgsSchema,
  scheduleMeetingAndInviteArgsSchema,
} from "./agent.schema";
import { AGENT_TOOL_NAMES } from "./agent.constants";
import type { ToolResult } from "./agent.types";

export class AgentWorkflow {
  constructor(
    private readonly gmail: GmailService,
    private readonly calendar: CalendarService,
    private readonly ai: AiService
  ) {}

  async executeToolCall(
    clerkUserId: string,
    dbUserId: string,
    toolName: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    try {
      switch (toolName) {
        case AGENT_TOOL_NAMES.SEARCH_EMAILS:
          return await this.handleSearchEmails(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.GET_EMAIL:
          return await this.handleGetEmail(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.SUMMARIZE_EMAIL:
          return await this.handleSummarizeEmail(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.CLASSIFY_EMAIL:
          return await this.handleClassifyEmail(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.GENERATE_DRAFT:
          return await this.handleGenerateDraft(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.SEND_EMAIL:
          return await this.handleSendEmail(clerkUserId, rawArgs);
        case AGENT_TOOL_NAMES.GET_EVENTS:
          return await this.handleGetEvents(dbUserId, rawArgs);
        case AGENT_TOOL_NAMES.CREATE_EVENT:
          return await this.handleCreateEvent(clerkUserId, dbUserId, rawArgs);
        case AGENT_TOOL_NAMES.UPDATE_EVENT:
          return await this.handleUpdateEvent(clerkUserId, dbUserId, rawArgs);
        case AGENT_TOOL_NAMES.DELETE_EVENT:
          return await this.handleDeleteEvent(clerkUserId, dbUserId, rawArgs);
        case AGENT_TOOL_NAMES.SCHEDULE_MEETING_AND_INVITE:
          return await this.handleScheduleMeetingAndInvite(clerkUserId, dbUserId, rawArgs);
        default:
          return { toolName, success: false, error: `Unknown tool: ${toolName}` };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { toolName, success: false, error: message };
    }
  }

  // ─── Email reads (DB-first) ─────────────────────────────────────────────────

  private async handleSearchEmails(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = searchEmailsArgsSchema.parse(rawArgs);
    const emails = await this.gmail.searchEmailsInDb(clerkUserId, {
      q: args.q,
      sender: args.sender,
      category: args.category,
      from: args.from ? new Date(args.from) : undefined,
      to: args.to ? new Date(args.to) : undefined,
      limit: args.limit,
    });

    const data = {
      emails: emails.map((e) => ({
        id: e.id,
        corsairEmailId: e.corsairEmailId,
        subject: e.subject,
        sender: e.sender,
        snippet: e.snippet,
        isRead: e.isRead,
        receivedAt: e.receivedAt,
      })),
      count: emails.length,
    };
    return { toolName: AGENT_TOOL_NAMES.SEARCH_EMAILS, success: true, data };
  }

  private async handleGetEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = getEmailArgsSchema.parse(rawArgs);
    const email = await this.gmail.getEmailDetails(clerkUserId, args.emailId);
    if (!email) {
      return { toolName: AGENT_TOOL_NAMES.GET_EMAIL, success: false, error: "Email not found" };
    }
    return { toolName: AGENT_TOOL_NAMES.GET_EMAIL, success: true, data: email };
  }

  private async handleSummarizeEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = summarizeEmailArgsSchema.parse(rawArgs);
    const result = await this.ai.summarizeEmailById(args.emailId, clerkUserId);
    return { toolName: AGENT_TOOL_NAMES.SUMMARIZE_EMAIL, success: true, data: result };
  }

  private async handleClassifyEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = classifyEmailArgsSchema.parse(rawArgs);
    const result = await this.ai.classifyEmail(args.emailId, clerkUserId);
    return { toolName: AGENT_TOOL_NAMES.CLASSIFY_EMAIL, success: true, data: result };
  }

  private async handleGenerateDraft(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = generateDraftArgsSchema.parse(rawArgs);

    if (args.emailId) {
      const result = await this.ai.generateDraftFromEmail(args.emailId, args.tone, clerkUserId);
      return { toolName: AGENT_TOOL_NAMES.GENERATE_DRAFT, success: true, data: result };
    }

    const result = await this.ai.generateDraft({
      prompt: args.prompt ?? "Write a professional email",
      context: args.context,
    });
    return { toolName: AGENT_TOOL_NAMES.GENERATE_DRAFT, success: true, data: result };
  }

  // ─── Email actions (Corsair) ────────────────────────────────────────────────

  private async handleSendEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = sendEmailArgsSchema.parse(rawArgs);
    const data = await this.gmail.sendEmail(clerkUserId, {
      to: args.to,
      subject: args.subject,
      body: args.body,
      threadId: args.threadId,
    });
    return { toolName: AGENT_TOOL_NAMES.SEND_EMAIL, success: true, data };
  }

  // ─── Calendar reads (DB-first) ──────────────────────────────────────────────

  private async handleGetEvents(dbUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = getEventsArgsSchema.parse(rawArgs);
    const limit = args.limit ?? 10;

    let events;
    if (args.timeMin ?? args.timeMax) {
      const from = args.timeMin ? new Date(args.timeMin) : new Date();
      const to = args.timeMax
        ? new Date(args.timeMax)
        : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
      events = await this.calendar.getEventsByDateRange(dbUserId, from, to);
    } else {
      events = await this.calendar.getUpcomingEvents(dbUserId, limit);
    }

    return {
      toolName: AGENT_TOOL_NAMES.GET_EVENTS,
      success: true,
      data: { events, count: events.length },
    };
  }

  // ─── Calendar actions (Corsair) ─────────────────────────────────────────────

  private async handleCreateEvent(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = createEventArgsSchema.parse(rawArgs);
    const tz = args.timeZone ?? "UTC";

    const event = await this.calendar.createCalendarEvent(clerkUserId, dbUserId, {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: { dateTime: args.startDateTime, timeZone: tz },
      end: { dateTime: args.endDateTime, timeZone: tz },
      attendees: args.attendees?.map((email) => ({ email })),
      sendUpdates: args.attendees?.length ? "all" : "none",
    });
    return { toolName: AGENT_TOOL_NAMES.CREATE_EVENT, success: true, data: event };
  }

  private async handleUpdateEvent(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = updateEventArgsSchema.parse(rawArgs);
    const tz = args.timeZone ?? "UTC";

    const event = await this.calendar.updateCalendarEvent(
      clerkUserId,
      dbUserId,
      args.corsairEventId,
      {
        summary: args.summary,
        description: args.description,
        location: args.location,
        start: args.startDateTime ? { dateTime: args.startDateTime, timeZone: tz } : undefined,
        end: args.endDateTime ? { dateTime: args.endDateTime, timeZone: tz } : undefined,
        attendees: args.attendees?.map((email) => ({ email })),
      }
    );
    return { toolName: AGENT_TOOL_NAMES.UPDATE_EVENT, success: true, data: event };
  }

  private async handleDeleteEvent(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = deleteEventArgsSchema.parse(rawArgs);
    await this.calendar.deleteCalendarEvent(clerkUserId, dbUserId, args.corsairEventId);
    return {
      toolName: AGENT_TOOL_NAMES.DELETE_EVENT,
      success: true,
      data: { deleted: true, corsairEventId: args.corsairEventId },
    };
  }

  // ─── Composite workflow ──────────────────────────────────────────────────────

  private async handleScheduleMeetingAndInvite(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = scheduleMeetingAndInviteArgsSchema.parse(rawArgs);
    const tz = args.timeZone ?? "UTC";

    const event = await this.calendar.createCalendarEvent(clerkUserId, dbUserId, {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: { dateTime: args.startDateTime, timeZone: tz },
      end: { dateTime: args.endDateTime, timeZone: tz },
      attendees: args.attendeeEmails.map((email) => ({ email })),
      sendUpdates: "all",
    });

    const defaultBody =
      `You're invited to "${args.summary}".\n\n` +
      `Start: ${args.startDateTime}\nEnd: ${args.endDateTime}` +
      (args.location ? `\nLocation: ${args.location}` : "") +
      (args.description ? `\n\nAgenda:\n${args.description}` : "");

    const body = args.invitationBody ?? defaultBody;

    const invitations: Array<{ to: string; success: boolean; error?: string }> = [];
    for (const attendeeEmail of args.attendeeEmails) {
      try {
        await this.gmail.sendEmail(clerkUserId, {
          to: attendeeEmail,
          subject: `Invitation: ${args.summary}`,
          body,
        });
        invitations.push({ to: attendeeEmail, success: true });
      } catch (err) {
        invitations.push({
          to: attendeeEmail,
          success: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      toolName: AGENT_TOOL_NAMES.SCHEDULE_MEETING_AND_INVITE,
      success: true,
      data: { event, invitations },
    };
  }
}

// Kept for backwards-compatibility — AgentService now uses the class directly
export async function executeToolCall(
  _userId: string,
  _toolName: string,
  _rawArgs: unknown
): Promise<ToolResult> {
  throw new Error("Use AgentWorkflow.executeToolCall instead");
}
