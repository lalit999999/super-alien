import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { AuthRepository } from "@/modules/auth";

// Falls back to ?userId= query param so curl testing works without a session.
export async function resolveClerkUserId(req: Request): Promise<string | null> {
  const { userId } = await auth();
  if (userId) return userId;
  return new URL(req.url).searchParams.get("userId");
}

// Resolves clerkUserId → DB user row. Accepts ?userId= as fallback for curl.
export async function resolveDbUser(req: Request) {
  const clerkUserId = await resolveClerkUserId(req);
  if (!clerkUserId) return { clerkUserId: null, dbUser: null };

  const repo = new AuthRepository(prisma);
  const dbUser = await repo.findByClerkUserId(clerkUserId);
  return { clerkUserId, dbUser };
}
