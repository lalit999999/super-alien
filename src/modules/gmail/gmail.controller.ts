import { type NextRequest } from "next/server";
import { requireAuth, requireCurrentUser } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { AiService, AiRepository, openai } from "@/modules/ai";
import { AuthService, AuthRepository } from "@/modules/auth";
import { cacheService } from "@/modules/cache";
import { rateLimitService, getRateLimitHeaders, RATE_LIMIT_ERRORS } from "@/modules/rate-limit";
import { prisma } from "@/lib/prisma";
import { GmailRepository } from "./gmail.repository";
import { GmailService } from "./gmail.service";
import { gmailListQuerySchema, gmailSyncBodySchema, sendEmailBodySchema, searchEmailsQuerySchema } from "./gmail.schema";
import { GMAIL_ERRORS, GMAIL_SYNC_MAX_RESULTS } from "./gmail.constants";

function makeService(): GmailService {
  const ai = new AiService(openai, new AiRepository(prisma));
  return new GmailService(new GmailRepository(prisma), ai, cacheService, rateLimitService);
}

export async function handleSync(req: NextRequest) {
  const clerkUser = await requireCurrentUser();
  const clerkUserId = clerkUser.id;

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    return fail("No email address on Clerk account", "AUTH_ERROR", 400);
  }

  const authService = new AuthService(new AuthRepository(prisma));
  await authService.syncUser({ clerkUserId, email: primaryEmail });

  const body = await req.json().catch(() => ({}));
  const parsed = gmailSyncBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail("Invalid request body", "VALIDATION_ERROR");
  }

  const maxResults = parsed.data.maxResults ?? GMAIL_SYNC_MAX_RESULTS;
  const result = await makeService().syncEmailsFromCorsair(clerkUserId, maxResults);

  return ok(result, 200);
}

export async function handleListEmails(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const { searchParams } = new URL(req.url);
  const queryParsed = gmailListQuerySchema.safeParse({
    page: searchParams.get("page"),
    limit: searchParams.get("limit"),
  });

  if (!queryParsed.success) {
    return fail("Invalid query parameters", "VALIDATION_ERROR");
  }

  const { page, limit } = queryParsed.data;
  const offset = (page - 1) * limit;

  const { emails, total } = await makeService().getUserEmails(clerkUserId, { limit, offset });
  const totalPages = Math.ceil(total / limit);

  return ok({ emails, pagination: { page, limit, total, totalPages } });
}

export async function handleGetEmail(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  const email = await makeService().getEmailDetails(clerkUserId, id);
  if (!email) {
    return fail("Email not found", GMAIL_ERRORS.EMAIL_NOT_FOUND, 404);
  }

  return ok({ email });
}

export async function handleMarkAsRead(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  try {
    const result = await makeService().markRead(clerkUserId, id);
    return ok(result);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code: string }).code === "RATE_LIMIT_EXCEEDED") {
      const rl = await rateLimitService.checkGmailActions(clerkUserId);
      return new Response(
        JSON.stringify({ success: false, error: RATE_LIMIT_ERRORS.EXCEEDED, code: RATE_LIMIT_ERRORS.CODE }),
        { status: 429, headers: { "Content-Type": "application/json", ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt) } }
      );
    }
    return fail("Failed to mark email as read", "UPDATE_FAILED", 500);
  }
}

export async function handleMarkAsUnread(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  try {
    const result = await makeService().markUnread(clerkUserId, id);
    return ok(result);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code: string }).code === "RATE_LIMIT_EXCEEDED") {
      const rl = await rateLimitService.checkGmailActions(clerkUserId);
      return new Response(
        JSON.stringify({ success: false, error: RATE_LIMIT_ERRORS.EXCEEDED, code: RATE_LIMIT_ERRORS.CODE }),
        { status: 429, headers: { "Content-Type": "application/json", ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt) } }
      );
    }
    return fail("Failed to mark email as unread", "UPDATE_FAILED", 500);
  }
}

export async function handleArchiveEmail(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  try {
    const result = await makeService().archiveEmail(clerkUserId, id);
    return ok(result);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code: string }).code === "RATE_LIMIT_EXCEEDED") {
      const rl = await rateLimitService.checkGmailActions(clerkUserId);
      return new Response(
        JSON.stringify({ success: false, error: RATE_LIMIT_ERRORS.EXCEEDED, code: RATE_LIMIT_ERRORS.CODE }),
        { status: 429, headers: { "Content-Type": "application/json", ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt) } }
      );
    }
    return fail("Failed to archive email", "ACTION_FAILED", 500);
  }
}

export async function handleDeleteEmail(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await requireAuth();
  const { id } = await params;

  try {
    const result = await makeService().deleteEmail(clerkUserId, id);
    return ok(result);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code: string }).code === "RATE_LIMIT_EXCEEDED") {
      const rl = await rateLimitService.checkGmailActions(clerkUserId);
      return new Response(
        JSON.stringify({ success: false, error: RATE_LIMIT_ERRORS.EXCEEDED, code: RATE_LIMIT_ERRORS.CODE }),
        { status: 429, headers: { "Content-Type": "application/json", ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt) } }
      );
    }
    return fail("Failed to delete email", "ACTION_FAILED", 500);
  }
}

export async function handleSendEmail(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const parsed = sendEmailBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((i) => i.message).join(", "),
      "VALIDATION_ERROR"
    );
  }

  try {
    const result = await makeService().sendEmail(clerkUserId, parsed.data);
    return ok(result, 200);
  } catch (err) {
    if (err instanceof Error && (err as Error & { code: string }).code === "RATE_LIMIT_EXCEEDED") {
      const rl = await rateLimitService.checkGmailActions(clerkUserId);
      return new Response(
        JSON.stringify({ success: false, error: RATE_LIMIT_ERRORS.EXCEEDED, code: RATE_LIMIT_ERRORS.CODE }),
        { status: 429, headers: { "Content-Type": "application/json", ...getRateLimitHeaders(rl.limit, rl.remaining, rl.resetAt) } }
      );
    }
    throw err;
  }
}

export async function handleSearchEmails(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const { searchParams } = new URL(req.url);
  const queryParsed = searchEmailsQuerySchema.safeParse({
    q: searchParams.get("q"),
    maxResults: searchParams.get("maxResults"),
  });

  if (!queryParsed.success) {
    return fail(
      queryParsed.error.issues.map((i) => i.message).join(", "),
      "VALIDATION_ERROR"
    );
  }

  const result = await makeService().searchEmails(
    clerkUserId,
    queryParsed.data.q,
    queryParsed.data.maxResults
  );

  return ok(result);
}

export async function handleClassifyEmails(req: NextRequest) {
  const { userId: clerkUserId } = await requireAuth();

  const body = await req.json().catch(() => ({}));
  const limit = typeof body.limit === "number" ? body.limit : 10;

  const result = await makeService().classifyEmailsForUser(clerkUserId, limit);

  return ok(result);
}
