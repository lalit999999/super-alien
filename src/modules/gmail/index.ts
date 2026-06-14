export { GmailService } from "./gmail.service";
export { GmailRepository } from "./gmail.repository";
export {
  handleSync,
  handleListEmails,
  handleGetEmail,
  handleMarkAsRead,
  handleClassifyEmails,
  handleSendEmail,
  handleSearchEmails,
} from "./gmail.controller";
export { gmailListQuerySchema, gmailSyncBodySchema, sendEmailBodySchema, searchEmailsQuerySchema } from "./gmail.schema";
export { GMAIL_ERRORS, GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";
export type {
  DbEmail,
  GmailUpsertInput,
  ParsedMessage,
  GmailSyncResult,
  GmailListOptions,
  GmailPagination,
  SendEmailInput,
} from "./gmail.types";
