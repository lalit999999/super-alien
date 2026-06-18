export const PROFILE_ERRORS = {
  USERNAME_INVALID: "Username must be 3-30 characters, alphanumeric only",
  USERNAME_TAKEN: "This username is already taken",
  USERNAME_RESERVED: "This username is reserved",

  PASSWORD_WEAK: "Password must contain uppercase, lowercase, number, and special character",
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters",
  PASSWORD_RECENTLY_USED: "You cannot reuse a recent password",
  PASSWORD_CURRENT_INVALID: "Current password is incorrect",

  PHONE_INVALID_FORMAT: "Please enter a valid international phone number",
  EMAIL_INVALID_FORMAT: "Please enter a valid email address",
  PHONE_ALREADY_EXISTS: "This phone number is already in use",
  EMAIL_ALREADY_EXISTS: "This email address is already in use",
  VERIFICATION_CODE_INVALID: "Invalid or expired verification code",
  VERIFICATION_CODE_EXPIRED: "Verification code expired. Please request a new one",

  OAUTH_READ_ONLY: "This field cannot be updated because your account uses OAuth login",
  RATE_LIMIT: "Too many attempts. Please wait a moment and try again",
  SESSION_EXPIRED: "Your session has expired. Please sign in again",
} as const;

export function formatProfileError(error: Error): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("username")) {
    if (msg.includes("taken")) return PROFILE_ERRORS.USERNAME_TAKEN;
    if (msg.includes("reserved")) return PROFILE_ERRORS.USERNAME_RESERVED;
    return PROFILE_ERRORS.USERNAME_INVALID;
  }
  if (msg.includes("password")) {
    if (msg.includes("weak")) return PROFILE_ERRORS.PASSWORD_WEAK;
    if (msg.includes("current")) return PROFILE_ERRORS.PASSWORD_CURRENT_INVALID;
    if (msg.includes("recently")) return PROFILE_ERRORS.PASSWORD_RECENTLY_USED;
    return PROFILE_ERRORS.PASSWORD_TOO_SHORT;
  }
  if (msg.includes("phone")) {
    if (msg.includes("already")) return PROFILE_ERRORS.PHONE_ALREADY_EXISTS;
    return PROFILE_ERRORS.PHONE_INVALID_FORMAT;
  }
  if (msg.includes("email")) {
    if (msg.includes("already")) return PROFILE_ERRORS.EMAIL_ALREADY_EXISTS;
    return PROFILE_ERRORS.EMAIL_INVALID_FORMAT;
  }
  if (msg.includes("verification")) {
    if (msg.includes("expired")) return PROFILE_ERRORS.VERIFICATION_CODE_EXPIRED;
    return PROFILE_ERRORS.VERIFICATION_CODE_INVALID;
  }
  if (msg.includes("oauth")) return PROFILE_ERRORS.OAUTH_READ_ONLY;
  if (msg.includes("rate")) return PROFILE_ERRORS.RATE_LIMIT;
  if (msg.includes("session")) return PROFILE_ERRORS.SESSION_EXPIRED;

  return error.message || "An error occurred while updating your profile";
}
