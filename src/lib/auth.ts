import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { AuthSession, AuthUser } from "@/modules/auth";

/**
 * Returns the Clerk session object.
 * Throws a redirect to /sign-in if the user is not authenticated.
 * Use in Server Components and Route Handlers that REQUIRE authentication.
 */
export async function requireAuth(): Promise<AuthSession> {
  const { userId, sessionId, orgId } = await auth();

  if (!userId || !sessionId) {
    redirect("/sign-in");
  }

  return { userId, sessionId, orgId: orgId ?? undefined };
}

/**
 * Returns the Clerk session object or null.
 * Does NOT redirect. Use when a page is accessible to both guests and users.
 */
export async function getOptionalAuth(): Promise<AuthSession | null> {
  const { userId, sessionId, orgId } = await auth();

  if (!userId || !sessionId) return null;

  return { userId, sessionId, orgId: orgId ?? undefined };
}

/**
 * Returns the full Clerk User object for the currently signed-in user.
 * Throws a redirect to /sign-in if the user is not authenticated.
 * More expensive than requireAuth() — only call when you need user profile data.
 */
export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return {
    id: user.id,
    emailAddresses: user.emailAddresses,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
