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

// ─── Logger ───────────────────────────────────────────────────────────────────

function log(prefix: string, message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : "";
  console.log(`${ts} [${prefix}] ${message}${metaStr}`);
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

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
    log("TOOL", `Starting ${toolName}`);
    try {
      let result: ToolResult;
      switch (toolName) {
        case AGENT_TOOL_NAMES.SEARCH_EMAILS:
          result = await this.handleSearchEmails(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.GET_EMAIL:
          result = await this.handleGetEmail(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.SUMMARIZE_EMAIL:
          result = await this.handleSummarizeEmail(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.CLASSIFY_EMAIL:
          result = await this.handleClassifyEmail(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.GENERATE_DRAFT:
          result = await this.handleGenerateDraft(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.SEND_EMAIL:
          result = await this.handleSendEmail(clerkUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.GET_EVENTS:
          result = await this.handleGetEvents(dbUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.CREATE_EVENT:
          result = await this.handleCreateEvent(clerkUserId, dbUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.UPDATE_EVENT:
          result = await this.handleUpdateEvent(clerkUserId, dbUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.DELETE_EVENT:
          result = await this.handleDeleteEvent(clerkUserId, dbUserId, rawArgs);
          break;
        case AGENT_TOOL_NAMES.SCHEDULE_MEETING_AND_INVITE:
          result = await this.handleScheduleMeetingAndInvite(clerkUserId, dbUserId, rawArgs);
          break;
        default:
          result = { toolName, success: false, error: `Unknown tool: ${toolName}` };
      }

      if (result.success) {
        log("TOOL", `${toolName} completed successfully`);
      } else {
        log("TOOL", `${toolName} returned failure`, { error: result.error });
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("TOOL", `${toolName} threw unexpected error`, { error: message });
      return { toolName, success: false, error: message };
    }
  }

  // ─── Email reads (DB-first) ─────────────────────────────────────────────────

  private async handleSearchEmails(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = searchEmailsArgsSchema.parse(rawArgs);
    log("GMAIL", "Searching emails", { q: args.q, sender: args.sender, limit: args.limit });

    const emails = await this.gmail.searchEmailsInDb(clerkUserId, {
      q: args.q,
      sender: args.sender,
      category: args.category,
      from: args.from ? new Date(args.from) : undefined,
      to: args.to ? new Date(args.to) : undefined,
      limit: args.limit,
    });

    log("GMAIL", "Search complete", { count: emails.length });

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
    log("GMAIL", "Fetching email", { emailId: args.emailId });

    const email = await this.gmail.getEmailDetails(clerkUserId, args.emailId);
    if (!email) {
      log("GMAIL", "Email not found", { emailId: args.emailId });
      return { toolName: AGENT_TOOL_NAMES.GET_EMAIL, success: false, error: "Email not found" };
    }
    return { toolName: AGENT_TOOL_NAMES.GET_EMAIL, success: true, data: email };
  }

  private async handleSummarizeEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = summarizeEmailArgsSchema.parse(rawArgs);
    log("AI", "Summarizing email", { emailId: args.emailId });

    const result = await this.ai.summarizeEmailById(args.emailId, clerkUserId);
    log("AI", "Summarization complete", { emailId: args.emailId });
    return { toolName: AGENT_TOOL_NAMES.SUMMARIZE_EMAIL, success: true, data: result };
  }

  private async handleClassifyEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = classifyEmailArgsSchema.parse(rawArgs);
    log("AI", "Classifying email", { emailId: args.emailId });

    const result = await this.ai.classifyEmail(args.emailId, clerkUserId);
    log("AI", "Classification complete", { emailId: args.emailId, category: result.category });
    return { toolName: AGENT_TOOL_NAMES.CLASSIFY_EMAIL, success: true, data: result };
  }

  private async handleGenerateDraft(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = generateDraftArgsSchema.parse(rawArgs);

    if (args.emailId) {
      log("AI", "Generating reply draft", { emailId: args.emailId, tone: args.tone });
      const result = await this.ai.generateDraftFromEmail(args.emailId, args.tone, clerkUserId);
      log("AI", "Reply draft generated", { emailId: args.emailId });
      return { toolName: AGENT_TOOL_NAMES.GENERATE_DRAFT, success: true, data: result };
    }

    log("AI", "Generating new email draft", { tone: args.tone });
    const result = await this.ai.generateDraft({
      prompt: args.prompt ?? "Write a professional email",
      context: args.context,
    });
    log("AI", "New draft generated");
    return { toolName: AGENT_TOOL_NAMES.GENERATE_DRAFT, success: true, data: result };
  }

  // ─── Email actions (Corsair) ────────────────────────────────────────────────

  private async handleSendEmail(clerkUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = sendEmailArgsSchema.parse(rawArgs);
    log("GMAIL", "Sending email", { to: args.to, subject: args.subject });

    const data = await this.gmail.sendEmail(clerkUserId, {
      to: args.to,
      subject: args.subject,
      body: args.body,
      threadId: args.threadId,
    });
    log("GMAIL", "Email sent", { to: args.to });
    return { toolName: AGENT_TOOL_NAMES.SEND_EMAIL, success: true, data };
  }

  // ─── Calendar reads (DB-first) ──────────────────────────────────────────────

  private async handleGetEvents(dbUserId: string, rawArgs: unknown): Promise<ToolResult> {
    const args = getEventsArgsSchema.parse(rawArgs);
    const limit = args.limit ?? 10;
    log("CALENDAR", "Fetching events", { timeMin: args.timeMin, timeMax: args.timeMax, limit });

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

    log("CALENDAR", "Events fetched", { count: events.length });
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
    log("CALENDAR", "Creating event", {
      summary: args.summary,
      start: args.startDateTime,
      end: args.endDateTime,
      attendees: args.attendees?.length ?? 0,
    });

    const event = await this.calendar.createCalendarEvent(clerkUserId, dbUserId, {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: { dateTime: args.startDateTime, timeZone: tz },
      end: { dateTime: args.endDateTime, timeZone: tz },
      attendees: args.attendees?.map((email) => ({ email })),
      sendUpdates: args.attendees?.length ? "all" : "none",
    });
    log("CALENDAR", "Event created");
    return { toolName: AGENT_TOOL_NAMES.CREATE_EVENT, success: true, data: event };
  }

  private async handleUpdateEvent(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = updateEventArgsSchema.parse(rawArgs);
    const tz = args.timeZone ?? "UTC";
    log("CALENDAR", "Updating event", { corsairEventId: args.corsairEventId });

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
    log("CALENDAR", "Event updated", { corsairEventId: args.corsairEventId });
    return { toolName: AGENT_TOOL_NAMES.UPDATE_EVENT, success: true, data: event };
  }

  private async handleDeleteEvent(
    clerkUserId: string,
    dbUserId: string,
    rawArgs: unknown
  ): Promise<ToolResult> {
    const args = deleteEventArgsSchema.parse(rawArgs);
    log("CALENDAR", "Deleting event", { corsairEventId: args.corsairEventId });

    await this.calendar.deleteCalendarEvent(clerkUserId, dbUserId, args.corsairEventId);
    log("CALENDAR", "Event deleted", { corsairEventId: args.corsairEventId });
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
    log("CALENDAR", "Scheduling meeting with invites", {
      summary: args.summary,
      start: args.startDateTime,
      attendees: args.attendeeEmails,
    });

    const event = await this.calendar.createCalendarEvent(clerkUserId, dbUserId, {
      summary: args.summary,
      description: args.description,
      location: args.location,
      start: { dateTime: args.startDateTime, timeZone: tz },
      end: { dateTime: args.endDateTime, timeZone: tz },
      attendees: args.attendeeEmails.map((email) => ({ email })),
      sendUpdates: "all",
    });
    log("CALENDAR", "Meeting event created");

    const defaultBody =
      `You're invited to "${args.summary}".\n\n` +
      `Start: ${args.startDateTime}\nEnd: ${args.endDateTime}` +
      (args.location ? `\nLocation: ${args.location}` : "") +
      (args.description ? `\n\nAgenda:\n${args.description}` : "");

    const body = args.invitationBody ?? defaultBody;

    const invitations: Array<{ to: string; success: boolean; error?: string }> = [];
    for (const attendeeEmail of args.attendeeEmails) {
      try {
        log("GMAIL", "Sending invitation email", { to: attendeeEmail });
        await this.gmail.sendEmail(clerkUserId, {
          to: attendeeEmail,
          subject: `Invitation: ${args.summary}`,
          body,
        });
        invitations.push({ to: attendeeEmail, success: true });
        log("GMAIL", "Invitation email sent", { to: attendeeEmail });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        log("GMAIL", "Invitation email failed", { to: attendeeEmail, error });
        invitations.push({ to: attendeeEmail, success: false, error });
      }
    }

    const allInvitesSent = invitations.every((i) => i.success);
    log("TOOL", "scheduleMeetingAndInvite finished", {
      eventCreated: true,
      invitationsSent: invitations.filter((i) => i.success).length,
      invitationsFailed: invitations.filter((i) => !i.success).length,
    });

    return {
      toolName: AGENT_TOOL_NAMES.SCHEDULE_MEETING_AND_INVITE,
      success: true,
      data: {
        event,
        invitations,
        eventCreated: true,
        allInvitesSent,
      },
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
