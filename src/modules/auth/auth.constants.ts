export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  AFTER_SIGN_IN: "/dashboard",
  AFTER_SIGN_UP: "/dashboard",
  AFTER_SIGN_OUT: "/",
} as const;

export const PUBLIC_ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
] as const;

export const PROTECTED_ROUTES = [
  "/dashboard",
  "/inbox",
  "/calendar",
  "/chat",
  "/settings",
] as const;
