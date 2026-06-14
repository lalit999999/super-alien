import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/response";
import { GmailService } from "@/modules/gmail";
import { GmailRepository } from "@/modules/gmail";
import { CalendarService } from "@/modules/calendar";
import { CalendarRepository } from "@/modules/calendar";
import { WebhookRepository } from "./webhook.repository";
import { WebhookService } from "./webhook.service";
import { webhookQuerySchema } from "./webhook.schema";
import { WEBHOOK_ERRORS } from "./webhook.constants";

function makeService(): WebhookService {
  const webhookRepo = new WebhookRepository(prisma);
  const gmailService = new GmailService(new GmailRepository(prisma));
  const calendarService = new CalendarService(new CalendarRepository(prisma));
  return new WebhookService(webhookRepo, gmailService, calendarService);
}

async function resolveUser(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const queryParsed = webhookQuerySchema.safeParse({
    tenantId: searchParams.get("tenantId"),
  });

  if (!queryParsed.success) {
    return {
      error: fail("Missing tenantId", WEBHOOK_ERRORS.TENANT_MISSING, 400),
      user: null,
      tenantId: "",
    };
  }

  const tenantId = queryParsed.data.tenantId;
  const repo = new WebhookRepository(prisma);
  const user = await repo.findUserByClerkId(tenantId);

  if (!user) {
    return {
      error: fail("User not found", WEBHOOK_ERRORS.USER_NOT_FOUND, 404),
      user: null,
      tenantId,
    };
  }

  return { error: null, user, tenantId };
}

export async function handleGmailWebhook(req: NextRequest) {
  const { error, tenantId } = await resolveUser(req);
  if (error) return error;

  const body = await req.text();
  const rawHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    rawHeaders[key] = value;
  });

  const service = makeService();
  const result = await service.processGmailWebhook(rawHeaders, body, tenantId, tenantId);

  return ok({ processed: result.synced, action: result.action }, 200);
}

export async function handleCalendarWebhook(req: NextRequest) {
  const { error, user, tenantId } = await resolveUser(req);
  if (error) return error;

  const body = await req.text();
  const rawHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    rawHeaders[key] = value;
  });

  const service = makeService();
  const result = await service.processCalendarWebhook(rawHeaders, body, tenantId, user!.id);

  return ok({ processed: result.synced, action: result.action }, 200);
}
