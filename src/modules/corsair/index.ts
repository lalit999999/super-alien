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
  SendEmailOutput,
  GetEventsOutput,
  CreateEventOutput,
  UpdateEventOutput,
  DeleteEventOutput,
  CorsairGetEmailsOptions,
  CorsairGetEventsOptions,
  CorsairCreateEventOptions,
  CorsairUpdateEventOptions,
  CorsairDeleteEventOptions,
} from "./corsair.types";

export {
  CORSAIR_MANAGEMENT_BASE_PATH,
  GMAIL_LABEL,
  GMAIL_DEFAULT_MAX_RESULTS,
  CALENDAR_DEFAULT_MAX_RESULTS,
  CALENDAR_ID_PRIMARY,
} from "./corsair.constants";
