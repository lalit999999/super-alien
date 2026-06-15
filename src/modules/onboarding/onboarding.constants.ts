export const ONBOARDING_EXEMPT_PATHS = ["/onboarding", "/settings"] as const;

export const CORSAIR_PLUGIN = {
  GMAIL: "gmail",
  CALENDAR: "googlecalendar",
} as const;

export type CorsairPlugin = (typeof CORSAIR_PLUGIN)[keyof typeof CORSAIR_PLUGIN];
