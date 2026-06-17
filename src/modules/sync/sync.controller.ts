import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerSyncSchema } from "./sync.schema";
import type { SyncService } from "./sync.service";

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function handleTriggerSync(req: NextRequest, service: SyncService) {
  const session = await requireAuth();

  const body = await req.json().catch(() => null);
  const parsed = triggerSyncSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0].message, "VALIDATION_ERROR", 400);
  }

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const result = await service.triggerSync(session.userId, dbUserId, parsed.data.integration);
  return ok(result, 202);
}

export async function handleGetSyncStatus(_req: NextRequest, service: SyncService) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const result = await service.getSyncStatus(dbUserId);
  return ok(result);
}

export async function handleCheckProgress(_req: NextRequest, service: SyncService) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const result = await service.checkProgress(dbUserId);
  return ok(result);
}
