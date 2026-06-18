export const BILLING_EXEMPT_PATHS = ["/billing", "/settings", "/onboarding"] as const;

export const RAZORPAY_WEBHOOK_EVENTS = {
  SUBSCRIPTION_ACTIVATED: "subscription.activated",
  SUBSCRIPTION_CHARGED: "subscription.charged",
  SUBSCRIPTION_CANCELLED: "subscription.cancelled",
  SUBSCRIPTION_HALTED: "subscription.halted",
} as const;
