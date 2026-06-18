import { type NextRequest } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth";
import { ok, fail } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { env } from "@/config/env";
import { BillingRepository } from "./billing.repository";
import { BillingService } from "./billing.service";
import { razorpay } from "./billing.provider";
import { createSubscriptionSchema, historyQuerySchema } from "./billing.schema";
import type { RazorpayWebhookPayload } from "./billing.types";
import { UsageRepository } from "@/modules/usage/usage.repository";

function buildService() {
  const repo = new BillingRepository(prisma);
  const usageRepo = new UsageRepository(prisma);
  return new BillingService(razorpay, repo, usageRepo);
}

async function resolveInternalUserId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function handleCreateSubscription(req: Request) {
  try {
    const { userId } = await requireAuth();

    const body = await req.json().catch(() => ({}));
    const { planId } = createSubscriptionSchema.parse(body);

    const internalId = await resolveInternalUserId(userId);
    if (!internalId) return fail("User not found", "USER_NOT_FOUND", 404);

    const service = buildService();
    const result = await service.createSubscription(internalId, planId);

    return ok({ ...result, keyId: env.RAZORPAY_KEY_ID }, 201);
  } catch (err) {
    console.error("[billing/subscribe]", err);
    return fail(String(err), "INTERNAL_ERROR", 500);
  }
}

export async function handleGetUsage(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const internalId = await resolveInternalUserId(userId);
    if (!internalId) return fail("User not found", "USER_NOT_FOUND", 404);

    const service = buildService();
    const data = await service.getUsageDashboard(internalId);
    return ok(data);
  } catch (err) {
    console.error("[billing/usage]", err);
    return fail(String(err), "INTERNAL_ERROR", 500);
  }
}

export async function handleGetHistory(req: Request) {
  try {
    const { userId } = await requireAuth();
    const internalId = await resolveInternalUserId(userId);
    if (!internalId) return fail("User not found", "USER_NOT_FOUND", 404);

    const url = new URL(req.url);
    const parsed = historyQuerySchema.safeParse({
      page: url.searchParams.get("page"),
      pageSize: url.searchParams.get("pageSize"),
    });
    const { page, pageSize } = parsed.success ? parsed.data : { page: 1, pageSize: 10 };

    const service = buildService();
    const data = await service.getPaymentHistory(internalId, page, pageSize);
    return ok(data);
  } catch (err) {
    console.error("[billing/history]", err);
    return fail(String(err), "INTERNAL_ERROR", 500);
  }
}

export async function handleCancelSubscription(_req: Request) {
  try {
    const { userId } = await requireAuth();
    const internalId = await resolveInternalUserId(userId);
    if (!internalId) return fail("User not found", "USER_NOT_FOUND", 404);

    const service = buildService();
    await service.initiateCancel(internalId);
    return ok({ scheduled: true });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return fail(String(err), "INTERNAL_ERROR", 500);
  }
}

export async function handleRazorpayWebhook(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return fail("Invalid signature", "INVALID_SIGNATURE", 401);
  }

  let payload: RazorpayWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return fail("Invalid JSON", "INVALID_JSON", 400);
  }

  // Use a composite key: event + subscription id as the idempotency key
  const subId = payload.payload.subscription?.entity?.id ?? "unknown";
  const eventId = `${payload.event}:${subId}:${payload.account_id}`;

  try {
    const service = buildService();
    await service.handleWebhookEvent(payload, eventId);
    return ok({ received: true });
  } catch (err) {
    console.error("[webhooks/razorpay]", err);
    return fail("Webhook processing failed", "WEBHOOK_FAILED", 500);
  }
}
