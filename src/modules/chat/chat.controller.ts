import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionSchema, sendMessageSchema } from "./chat.schema";
import type { ChatService } from "./chat.service";

async function getDbUserId(clerkUserId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function handleCreateSession(req: NextRequest, service: ChatService) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const body = await req.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body);
  const title = parsed.success ? parsed.data.title : undefined;

  const chatSession = await service.createSession(dbUserId, title);
  return ok(chatSession, 201);
}

export async function handleListSessions(_req: NextRequest, service: ChatService) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const result = await service.listSessions(dbUserId);
  return ok(result);
}

export async function handleGetSession(
  _req: NextRequest,
  sessionId: string,
  service: ChatService
) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const chatSession = await service.getSession(sessionId, dbUserId);
  if (!chatSession) return fail("Session not found", "NOT_FOUND", 404);

  return ok(chatSession);
}

export async function handleDeleteSession(
  _req: NextRequest,
  sessionId: string,
  service: ChatService
) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  await service.deleteSession(sessionId, dbUserId);
  return ok({ deleted: true });
}

export async function handleSendMessage(
  req: NextRequest,
  sessionId: string,
  service: ChatService
) {
  const session = await requireAuth();

  const dbUserId = await getDbUserId(session.userId);
  if (!dbUserId) return fail("User not found", "NOT_FOUND", 404);

  const body = await req.json().catch(() => null);
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0].message, "VALIDATION_ERROR", 400);
  }

  const result = await service.sendMessage(sessionId, session.userId, dbUserId, parsed.data.prompt);
  return ok(result);
}
