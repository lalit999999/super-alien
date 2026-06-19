import type { PrismaClient } from "@/config/generated/prisma/client";
import { SubscriptionStatus, PaymentStatus } from "@/config/generated/prisma/client";

export class BillingRepository {
  constructor(private readonly db: PrismaClient) {}

  async findActiveSubscriptionByUserId(userId: string) {
    return this.db.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        OR: [
          { currentPeriodEnd: { gt: new Date() } },
          { currentPeriodEnd: null },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
    return this.db.subscription.findUnique({
      where: { razorpaySubscriptionId },
    });
  }

  async findSubscriptionByUserId(userId: string) {
    return this.db.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSubscription(data: {
    userId: string;
    razorpaySubscriptionId: string;
    razorpayPlanId: string;
    status: SubscriptionStatus;
  }) {
    return this.db.subscription.create({ data });
  }

  async updateSubscriptionStatus(
    razorpaySubscriptionId: string,
    status: SubscriptionStatus,
    periodData?: { currentPeriodStart?: Date; currentPeriodEnd?: Date }
  ) {
    return this.db.subscription.update({
      where: { razorpaySubscriptionId },
      data: { status, ...periodData },
    });
  }

  async createPayment(data: {
    userId: string;
    subscriptionId: string;
    razorpayPaymentId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
  }) {
    return this.db.payment.create({ data });
  }

  async findWebhookLog(provider: string, entityId: string) {
    return this.db.webhookLog.findFirst({
      where: { provider, entityId },
    });
  }

  async createWebhookLog(data: {
    provider: string;
    eventType: string;
    entityId: string;
    tenantId: string;
    status: string;
    error?: string;
  }) {
    return this.db.webhookLog.create({ data });
  }

  async findPaymentsByUserId(userId: string, skip: number, take: number) {
    return this.db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        razorpayPaymentId: true,
      },
    });
  }

  async countPaymentsByUserId(userId: string): Promise<number> {
    return this.db.payment.count({ where: { userId } });
  }
}
