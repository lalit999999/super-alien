export const BILLING_EXEMPT_PATHS = [
  "/billing",
  "/settings",
  "/onboarding",
  "/dashboard",
  "/inbox",
  "/calendar",
  "/profile",
] as const;

export const PRO_PLAN_AMOUNT_PAISE = 100; // ₹999.00
export const BILLING_PERIOD_DAYS = 30;

export const RAZORPAY_WEBHOOK_EVENTS = {
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_CHARGED: "subscription.charged",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  SUBSCRIPTION_HALTED: "subscription.halted",
} as const;
