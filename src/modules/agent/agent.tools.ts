import type OpenAI from "openai";

export const agentTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "sendEmail",
      description: "Send an email on behalf of the user via Gmail",
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
            description: "Email body content (plain text)",
          },
          threadId: {
            type: "string",
            description: "Optional Gmail thread ID to reply in an existing thread",
          },
        },
        required: ["to", "subject", "body"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createEvent",
      description: "Create a Google Calendar event on behalf of the user",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Event title",
          },
          startDateTime: {
            type: "string",
            description: "Start date/time in ISO 8601 format (e.g. 2026-06-14T16:00:00)",
          },
          endDateTime: {
            type: "string",
            description: "End date/time in ISO 8601 format",
          },
          description: {
            type: "string",
            description: "Optional event description or agenda",
          },
          location: {
            type: "string",
            description: "Optional event location",
          },
          attendees: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of attendee email addresses",
          },
          timeZone: {
            type: "string",
            description: "Time zone for the event (e.g. America/New_York). Defaults to UTC.",
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
      name: "getEvents",
      description: "Retrieve the user's upcoming Google Calendar events",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            description: "Start of time range in ISO 8601 format. Defaults to now.",
          },
          timeMax: {
            type: "string",
            description: "End of time range in ISO 8601 format.",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of events to return (1-50). Defaults to 10.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },
];
