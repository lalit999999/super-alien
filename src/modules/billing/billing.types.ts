import type { SubscriptionStatus, PaymentStatus } from "@/config/generated/prisma/client";
import type { RateLimitResult } from "@/modules/rate-limit";

export type { SubscriptionStatus, PaymentStatus };

export interface UsageDashboard {
  subscription: {
    planId: string;
    status: SubscriptionStatus;
    renewsAt: Date | null;
    currentPeriodStart: Date | null;
  } | null;
  tokenUsage: {
    daily: Array<{ date: string; tokens: number }>;
    periodTotal: number;
  };
  rateLimits: {
    chat: RateLimitResult;
    summaries: RateLimitResult;
    drafts: RateLimitResult;
  };
}

export interface PaymentHistoryPage {
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: Date;
    razorpayPaymentId: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  shortUrl: string | null;
}

export interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription?: {
      entity: RazorpaySubscriptionEntity;
    };
    payment?: {
      entity: RazorpayPaymentEntity;
    };
  };
}

export interface RazorpaySubscriptionEntity {
  id: string;
  plan_id: string;
  status: string;
  current_start: number | null;
  current_end: number | null;
  charge_at: number | null;
}

export interface RazorpayPaymentEntity {
  id: string;
  amount: number;
  currency: string;
  status: string;
  subscription_id: string;
}
