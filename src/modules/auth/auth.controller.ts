import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

function makeService(): AuthService {
  return new AuthService(new AuthRepository(prisma));
}

export async function handleDeleteAccount(_req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  await makeService().deleteAccount(clerkUserId);

  return ok({ success: true });
}
