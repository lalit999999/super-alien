// The only public API surface for the Corsair integration layer.
// All other modules MUST import from here — never from sub-files directly.

export { corsairInstance } from "./corsair.client";

export {
  getEmails,
  getEmailById,
  sendEmail,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEmails,
  getThread,
  archiveEmail,
  trashEmail,
  markEmailRead,
  markEmailUnread,
} from "./corsair.service";

export {
  sendEmailSchema,
  getEmailsSchema,
  createEventSchema,
  getEventsSchema,
  type SendEmailPayload,
  type GetEmailsPayload,
  type CreateEventPayload,
  type GetEventsPayload,
} from "./corsair.schema";

export type {
  GetEmailsOutput,
  GetEmailByIdOutput,
  SendEmailInput,
  SendEmailOutput,
  GetThreadOutput,
  ModifyEmailOutput,
  GetEventsOutput,
  CreateEventOutput,
  UpdateEventOutput,
  DeleteEventOutput,
  CorsairGetEmailsOptions,
  CorsairGetEventsOptions,
  CorsairCreateEventOptions,
  CorsairUpdateEventOptions,
  CorsairDeleteEventOptions,
  CorsairMessagePart,
} from "./corsair.types";

export {
  CORSAIR_MANAGEMENT_BASE_PATH,
  GMAIL_LABEL,
  GMAIL_DEFAULT_MAX_RESULTS,
  CALENDAR_DEFAULT_MAX_RESULTS,
  CALENDAR_ID_PRIMARY,
} from "./corsair.constants";
