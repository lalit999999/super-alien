import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { AuthRepository } from "@/modules/auth";
import { AiService, AiRepository, openai } from "@/modules/ai";
import { prisma } from "@/lib/prisma";
import { GmailRepository } from "./gmail.repository";
import { GmailService } from "./gmail.service";
import { gmailListQuerySchema, gmailSyncBodySchema } from "./gmail.schema";
import { GMAIL_ERRORS, GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";

function makeService(): GmailService {
  const ai = new AiService(openai, new AiRepository(prisma));
  return new GmailService(new GmailRepository(prisma), ai);
}

function makeAuthRepo(): AuthRepository {
  return new AuthRepository(prisma);
}

export async function handleSync(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = gmailSyncBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", GMAIL_ERRORS.USER_NOT_FOUND, 404);
  }

  const service = makeService();
  const maxResults = parsed.data.maxResults ?? GMAIL_SYNC_MAX_RESULTS;
  const result = await service.syncEmailsFromCorsair(clerkUserId, dbUser.id, maxResults);

  return ok(result, 200);
}

export async function handleListEmails(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const { searchParams } = new URL(req.url);
  const queryParsed = gmailListQuerySchema.safeParse({
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  if (!queryParsed.success) {
    return fail("Invalid query parameters", "VALIDATION_ERROR");
  }

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", GMAIL_ERRORS.USER_NOT_FOUND, 404);
  }

  const service = makeService();
  const { emails, total } = await service.getUserEmails(dbUser.id, {
    limit: queryParsed.data.limit,
    offset: queryParsed.data.offset,
  });

  return ok({ emails, total, limit: queryParsed.data.limit, offset: queryParsed.data.offset });
}

export async function handleGetEmail(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", GMAIL_ERRORS.USER_NOT_FOUND, 404);
  }

  const service = makeService();
  const email = await service.getEmailDetails(dbUser.id, id);
  if (!email) {
    return fail("Email not found", GMAIL_ERRORS.EMAIL_NOT_FOUND, 404);
  }

  return ok(email);
}

export async function handleClassifyEmails(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const limit = typeof body.limit === "number" ? body.limit : 10;

  const dbUser = await makeAuthRepo().findByClerkUserId(clerkUserId);
  if (!dbUser) {
    return fail("User not found in database", GMAIL_ERRORS.USER_NOT_FOUND, 404);
  }

  const service = makeService();
  const result = await service.classifyEmailsForUser(dbUser.id, limit);

  return ok(result);
}
