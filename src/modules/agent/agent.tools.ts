import type OpenAI from "openai";

export const agentTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  // ─── Email reads (DB-first) ───────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "searchEmails",
      description:
        "Search emails from the user's inbox by keyword, sender, category, or date range. Queries the local database — fast. Always call this before any email action to locate relevant emails.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Keyword to search across subject, sender, and body",
          },
          sender: {
            type: "string",
            description: "Filter by sender name or email address (partial match)",
          },
          category: {
            type: "string",
            enum: ["IMPORTANT", "FINANCE", "MEETING", "SOCIAL", "PROMOTION", "NEWSLETTER", "ORDER", "OTHER"],
            description: "Filter by AI-classified category",
          },
          from: {
            type: "string",
            description: "Only emails received after this date (ISO 8601)",
          },
          to: {
            type: "string",
            description: "Only emails received before this date (ISO 8601)",
          },
          limit: {
            type: "number",
            description: "Max results to return (default 10, max 50)",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getEmail",
      description: "Fetch the full details (subject, sender, body) of a specific email by its database ID.",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "The database ID of the email (from searchEmails results)",
          },
        },
        required: ["emailId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarizeEmail",
      description:
        "Generate or retrieve an AI summary for an email. Returns a short summary, medium summary, and bullet points.",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "The database ID of the email to summarize",
          },
        },
        required: ["emailId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "classifyEmail",
      description:
        "Classify an email into a category (IMPORTANT, FINANCE, MEETING, SOCIAL, PROMOTION, NEWSLETTER, ORDER, OTHER).",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "The database ID of the email to classify",
          },
        },
        required: ["emailId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generateDraft",
      description:
        "Generate an email draft. Provide emailId to reply to an existing email, or provide prompt to compose a new one.",
      parameters: {
        type: "object",
        properties: {
          emailId: {
            type: "string",
            description: "ID of the email to reply to (leave empty for a new email)",
          },
          tone: {
            type: "string",
            enum: ["professional", "friendly", "short", "detailed"],
            description: "Tone for the draft (default: professional)",
          },
          prompt: {
            type: "string",
            description: "What the new email should say (for composing, not replying)",
          },
          context: {
            type: "string",
            description: "Extra context or instructions for the draft",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  // ─── Email actions (Corsair) ──────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "sendEmail",
      description: "Send an email on behalf of the user via Gmail.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Recipient email address",
          },
          subject: {
            type: "string",
            description: "Email subject line",
          },
          body: {
            type: "string",
            description: "Email body (plain text)",
          },
          threadId: {
            type: "string",
            description: "Gmail thread ID to reply in an existing thread (optional)",
          },
        },
        required: ["to", "subject", "body"],
        additionalProperties: false,
      },
    },
  },
  // ─── Calendar reads (DB-first) ────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "getEvents",
      description:
        "Retrieve the user's calendar events from the local database. Optionally filter by date range.",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            description: "Start of date range in ISO 8601 format (default: now)",
          },
          timeMax: {
            type: "string",
            description: "End of date range in ISO 8601 format",
          },
          limit: {
            type: "number",
            description: "Max events to return (default 10, max 50)",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
  // ─── Calendar actions (Corsair) ───────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "createEvent",
      description: "Create a new Google Calendar event on behalf of the user.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Event title",
          },
          startDateTime: {
            type: "string",
            description: "Start date/time in ISO 8601 format (e.g. 2026-06-15T16:00:00)",
          },
          endDateTime: {
            type: "string",
            description: "End date/time in ISO 8601 format",
          },
          description: {
            type: "string",
            description: "Event description or agenda",
          },
          location: {
            type: "string",
            description: "Event location or meeting link",
          },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "List of attendee email addresses",
          },
          timeZone: {
            type: "string",
            description: "Time zone (e.g. America/New_York). Defaults to UTC.",
          },
        },
        required: ["summary", "startDateTime", "endDateTime"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateEvent",
      description: "Update an existing Google Calendar event. Provide only the fields to change.",
      parameters: {
        type: "object",
        properties: {
          corsairEventId: {
            type: "string",
            description: "The Google Calendar event ID (from getEvents results)",
          },
          summary: { type: "string", description: "New event title" },
          startDateTime: { type: "string", description: "New start date/time in ISO 8601 format" },
          endDateTime: { type: "string", description: "New end date/time in ISO 8601 format" },
          description: { type: "string", description: "New event description" },
          location: { type: "string", description: "New event location" },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "Updated list of attendee email addresses",
          },
          timeZone: { type: "string", description: "Time zone for the event" },
        },
        required: ["corsairEventId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteEvent",
      description: "Delete a Google Calendar event permanently.",
      parameters: {
        type: "object",
        properties: {
          corsairEventId: {
            type: "string",
            description: "The Google Calendar event ID to delete (from getEvents results)",
          },
        },
        required: ["corsairEventId"],
        additionalProperties: false,
      },
    },
  },
  // ─── Composite workflows ──────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "scheduleMeetingAndInvite",
      description:
        "Create a calendar event AND send email invitations to all attendees in one step. Use this whenever the user wants to schedule a meeting with guests.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "Meeting title" },
          startDateTime: { type: "string", description: "Meeting start in ISO 8601 format" },
          endDateTime: { type: "string", description: "Meeting end in ISO 8601 format" },
          attendeeEmails: {
            type: "array",
            items: { type: "string" },
            description: "Email addresses of all attendees (required)",
          },
          description: { type: "string", description: "Meeting agenda or description" },
          location: { type: "string", description: "Location or video link" },
          timeZone: {
            type: "string",
            description: "Time zone (e.g. Asia/Kolkata). Defaults to UTC.",
          },
          invitationBody: {
            type: "string",
            description: "Custom body text for the invitation emails (auto-generated if omitted)",
          },
        },
        required: ["summary", "startDateTime", "endDateTime", "attendeeEmails"],
        additionalProperties: false,
      },
    },
  },
];
