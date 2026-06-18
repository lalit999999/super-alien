import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BillingRepository } from "@/modules/billing/billing.repository";
import { BillingService } from "@/modules/billing/billing.service";
import { UsageRepository } from "@/modules/usage/usage.repository";
import { razorpay } from "@/modules/billing/billing.provider";
import { BillingChart } from "@/components/billing/billing-chart";
import { CancelSubscriptionButton } from "@/components/billing/cancel-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Zap, Calendar, MessageSquare } from "lucide-react";
import type { RateLimitResult } from "@/modules/rate-limit";

function buildService() {
  return new BillingService(razorpay, new BillingRepository(prisma), new UsageRepository(prisma));
}

function RateLimitGauge({
  label,
  result,
}: {
  label: string;
  result: RateLimitResult;
}) {
  const used = result.limit - result.remaining;
  const pct = result.limit > 0 ? Math.round((used / result.limit) * 100) : 0;
  const warning = pct >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ps-text">{label}</span>
        <span className={warning ? "text-orange-500" : "text-ps-muted"}>
          {used.toLocaleString()} / {result.limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ps-surface-2">
        <div
          className={`h-full rounded-full transition-all ${warning ? "bg-orange-500" : "bg-ps-accent"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-ps-muted">{pct}% used today</p>
    </div>
  );
}

export default async function BillingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!user) redirect("/sign-in");

  const service = buildService();
  const [dashboard, history] = await Promise.all([
    service.getUsageDashboard(user.id),
    service.getPaymentHistory(user.id, 1, 10),
  ]);

  const sub = dashboard.subscription;
  const renewsAt = sub?.renewsAt
    ? new Date(sub.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

  const statusLabel: Record<string, string> = {
    ACTIVE: "Active",
    CANCELLED: "Cancelled",
    HALTED: "Payment failed",
    PAST_DUE: "Past due",
    CREATED: "Pending",
    AUTHENTICATED: "Pending",
    COMPLETED: "Completed",
    EXPIRED: "Expired",
  };

  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Billing</h1>
          <p className="mt-1 text-sm text-ps-secondary">
            Plan details, token usage, and payment history
          </p>
        </div>
        {sub && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full bg-ps-accent-light px-3 py-1 text-xs font-medium text-ps-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-ps-accent" />
              {statusLabel[sub.status] ?? sub.status}
            </div>
            <CancelSubscriptionButton />
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="mb-6 grid gap-3 sm:mb-8 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ps-border bg-ps-card p-4 sm:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-ps-accent-light">
            <CreditCard className="h-4 w-4 text-ps-accent" />
          </div>
          <p className="text-[11px] font-medium text-ps-muted sm:text-xs">Plan</p>
          <p className="mt-0.5 text-lg font-semibold text-ps-text sm:text-xl">
            {sub?.status === "ACTIVE" ? "Pro" : "Free"}
          </p>
        </div>

        <div className="rounded-2xl border border-ps-border bg-ps-card p-4 sm:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-ps-accent-light">
            <Calendar className="h-4 w-4 text-ps-accent" />
          </div>
          <p className="text-[11px] font-medium text-ps-muted sm:text-xs">Renews</p>
          <p className="mt-0.5 text-base font-semibold text-ps-text sm:text-lg">{renewsAt}</p>
        </div>

        <div className="rounded-2xl border border-ps-border bg-ps-card p-4 sm:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-ps-accent-light">
            <Zap className="h-4 w-4 text-ps-accent" />
          </div>
          <p className="text-[11px] font-medium text-ps-muted sm:text-xs">Tokens this period</p>
          <p className="mt-0.5 text-lg font-semibold text-ps-text sm:text-xl">
            {dashboard.tokenUsage.periodTotal.toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-ps-border bg-ps-card p-4 sm:p-5">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-ps-accent-light">
            <MessageSquare className="h-4 w-4 text-ps-accent" />
          </div>
          <p className="text-[11px] font-medium text-ps-muted sm:text-xs">Messages left today</p>
          <p className="mt-0.5 text-lg font-semibold text-ps-text sm:text-xl">
            {dashboard.rateLimits.chat.remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:mb-8 lg:grid-cols-3">
        {/* Token usage chart */}
        <div className="lg:col-span-2 rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold text-ps-text">Token usage — current period</h2>
          <BillingChart data={dashboard.tokenUsage.daily} />
        </div>

        {/* Rate limit gauges */}
        <div className="rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
          <h2 className="mb-5 text-sm font-semibold text-ps-text">Daily rate limits</h2>
          <div className="space-y-5">
            <RateLimitGauge label="Chat messages" result={dashboard.rateLimits.chat} />
            <RateLimitGauge label="Email summaries" result={dashboard.rateLimits.summaries} />
            <RateLimitGauge label="Draft replies" result={dashboard.rateLimits.drafts} />
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-2xl border border-ps-border bg-ps-card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-ps-text">Payment history</h2>
        {history.payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-ps-muted">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-ps-secondary">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-ps-muted">
                      {p.razorpayPaymentId}
                    </TableCell>
                    <TableCell className="font-medium text-ps-text">
                      {(p.amount / 100).toLocaleString("en-IN", {
                        style: "currency",
                        currency: p.currency,
                        minimumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          p.status === "CAPTURED"
                            ? "bg-green-500/10 text-green-500"
                            : p.status === "FAILED"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-ps-accent-light text-ps-accent"
                        }`}
                      >
                        {p.status === "CAPTURED" ? "Paid" : p.status === "FAILED" ? "Failed" : "Refunded"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
