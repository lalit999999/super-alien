import crypto from "crypto";
import type Razorpay from "razorpay";
import type { BillingRepository } from "./billing.repository";
import type { UsageRepository } from "@/modules/usage/usage.repository";
import {
  SubscriptionStatus,
  PaymentStatus,
} from "@/config/generated/prisma/client";
import {
  RAZORPAY_WEBHOOK_EVENTS,
  PRO_PLAN_AMOUNT_PAISE,
  BILLING_PERIOD_DAYS,
} from "./billing.constants";
import type {
  RazorpayWebhookPayload,
  UsageDashboard,
  PaymentHistoryPage,
} from "./billing.types";
import { rateLimitService } from "@/modules/rate-limit";
import { env } from "@/config/env";

export class BillingService {
  constructor(
    private readonly razorpay: Razorpay,
    private readonly repo: BillingRepository,
    private readonly usageRepo?: UsageRepository,
  ) {}

  async createOneTimeOrder(
    userId: string,
  ): Promise<{ orderId: string; amount: number; currency: string }> {
    const order = await this.razorpay.orders.create({
      amount: PRO_PLAN_AMOUNT_PAISE,
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${userId.slice(-8)}`,
      notes: { userId },
    });
    return {
      orderId: order.id,
      amount: PRO_PLAN_AMOUNT_PAISE,
      currency: "INR",
    };
  }

  async verifyAndActivate(
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<{ currentPeriodEnd: Date }> {
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    ) {
      throw new Error("Invalid payment signature");
    }

    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const sub = await this.repo.createSubscription({
      userId,
      razorpaySubscriptionId: orderId,
      razorpayPlanId: "one-time-monthly",
      status: SubscriptionStatus.ACTIVE,
    });
    await this.repo.updateSubscriptionStatus(
      orderId,
      SubscriptionStatus.ACTIVE,
      {
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    );
    await this.repo.createPayment({
      userId,
      subscriptionId: sub.id,
      razorpayPaymentId: paymentId,
      amount: PRO_PLAN_AMOUNT_PAISE,
      currency: "INR",
      status: PaymentStatus.CAPTURED,
    });

    return { currentPeriodEnd: periodEnd };
  }

  async cancelSubscription(userId: string): Promise<void> {
    const sub = await this.repo.findSubscriptionByUserId(userId);
    if (!sub) throw new Error("No subscription found for user");

    await this.repo.updateSubscriptionStatus(
      sub.razorpaySubscriptionId,
      SubscriptionStatus.CANCELLED,
    );
  }

  async initiateCancel(userId: string): Promise<void> {
    const sub = await this.repo.findSubscriptionByUserId(userId);
    if (!sub) throw new Error("No active subscription found");
    await this.repo.updateSubscriptionStatus(
      sub.razorpaySubscriptionId,
      SubscriptionStatus.CANCELLED,
    );
  }

  async getUsageDashboard(userId: string): Promise<UsageDashboard> {
    const sub = await this.repo.findActiveSubscriptionByUserId(userId);

    const periodStart =
      sub?.currentPeriodStart ??
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd =
      sub?.currentPeriodEnd ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [daily, periodTotal, chatPeek, summariesPeek, draftsPeek] =
      await Promise.all([
        this.usageRepo?.findDailyTotalsForPeriod(
          userId,
          periodStart,
          periodEnd,
        ) ?? [],
        this.usageRepo?.sumTokensForPeriod(userId, periodStart, periodEnd) ?? 0,
        rateLimitService.peekChat(userId),
        rateLimitService.peekSummaries(userId),
        rateLimitService.peekDrafts(userId),
      ]);

    return {
      subscription: sub
        ? {
            planId: sub.razorpayPlanId,
            status: sub.status,
            renewsAt: sub.currentPeriodEnd,
            currentPeriodStart: sub.currentPeriodStart,
          }
        : null,
      tokenUsage: { daily, periodTotal },
      rateLimits: {
        chat: chatPeek,
        summaries: summariesPeek,
        drafts: draftsPeek,
      },
    };
  }

  async getPaymentHistory(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaymentHistoryPage> {
    const skip = (page - 1) * pageSize;
    const [payments, total] = await Promise.all([
      this.repo.findPaymentsByUserId(userId, skip, pageSize),
      this.repo.countPaymentsByUserId(userId),
    ]);
    return { payments, total, page, pageSize };
  }

  async handleWebhookEvent(
    payload: RazorpayWebhookPayload,
    eventId: string,
  ): Promise<void> {
    const existing = await this.repo.findWebhookLog("razorpay", eventId);
    if (existing) return;

    await this.repo.createWebhookLog({
      provider: "razorpay",
      eventType: payload.event,
      entityId: eventId,
      tenantId: payload.account_id ?? "unknown",
      status: "processing",
    });

    try {
      await this.processEvent(payload);

      await this.repo.createWebhookLog({
        provider: "razorpay",
        eventType: payload.event,
        entityId: `${eventId}:done`,
        tenantId: payload.account_id ?? "unknown",
        status: "processed",
      });
    } catch (err) {
      await this.repo.createWebhookLog({
        provider: "razorpay",
        eventType: payload.event,
        entityId: `${eventId}:error`,
        tenantId: payload.account_id ?? "unknown",
        status: "failed",
        error: String(err),
      });
      throw err;
    }
  }

  private async processEvent(payload: RazorpayWebhookPayload): Promise<void> {
    const sub = payload.payload.subscription?.entity;
    const payment = payload.payload.payment?.entity;

    switch (payload.event) {
      case RAZORPAY_WEBHOOK_EVENTS.SUBSCRIPTION_ACTIVATED: {
        if (!sub) break;
        await this.repo.updateSubscriptionStatus(
          sub.id,
          SubscriptionStatus.ACTIVE,
          {
            currentPeriodStart: sub.current_start
              ? new Date(sub.current_start * 1000)
              : undefined,
            currentPeriodEnd: sub.current_end
              ? new Date(sub.current_end * 1000)
              : undefined,
          },
        );
        break;
      }

      case RAZORPAY_WEBHOOK_EVENTS.SUBSCRIPTION_CHARGED: {
        if (!sub || !payment) break;
        await this.repo.updateSubscriptionStatus(
          sub.id,
          SubscriptionStatus.ACTIVE,
          {
            currentPeriodStart: sub.current_start
              ? new Date(sub.current_start * 1000)
              : undefined,
            currentPeriodEnd: sub.current_end
              ? new Date(sub.current_end * 1000)
              : undefined,
          },
        );
        const dbSub = await this.repo.findSubscriptionByRazorpayId(sub.id);
        if (dbSub) {
          await this.repo.createPayment({
            userId: dbSub.userId,
            subscriptionId: dbSub.id,
            razorpayPaymentId: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: PaymentStatus.CAPTURED,
          });
        }
        break;
      }

      case RAZORPAY_WEBHOOK_EVENTS.SUBSCRIPTION_CANCELLED: {
        if (!sub) break;
        await this.repo.updateSubscriptionStatus(
          sub.id,
          SubscriptionStatus.CANCELLED,
        );
        break;
      }

      case RAZORPAY_WEBHOOK_EVENTS.SUBSCRIPTION_HALTED: {
        if (!sub) break;
        await this.repo.updateSubscriptionStatus(
          sub.id,
          SubscriptionStatus.HALTED,
        );
        break;
      }
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await this.repo.findActiveSubscriptionByUserId(userId);
    return sub !== null;
  }
}
