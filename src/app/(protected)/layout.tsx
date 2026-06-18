import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { OnboardingRepository } from "@/modules/onboarding/onboarding.repository";
import { ONBOARDING_EXEMPT_PATHS } from "@/modules/onboarding/onboarding.constants";
import { BillingRepository } from "@/modules/billing/billing.repository";
import { BILLING_EXEMPT_PATHS } from "@/modules/billing/billing.constants";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  const isOnboardingExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (!isOnboardingExempt) {
    const repo = new OnboardingRepository(prisma);
    const status = await repo.findStatusByClerkUserId(userId);

    if (!status || !status.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  const isBillingExempt = BILLING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (!isBillingExempt) {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (user) {
      const billingRepo = new BillingRepository(prisma);
      const activeSub = await billingRepo.findActiveSubscriptionByUserId(user.id);

      if (!activeSub) {
        redirect("/billing/upgrade");
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-ps-bg">
      {/* Desktop sidebar — hidden on mobile, always visible on lg+ */}
      <Sidebar />

      {/* Main content — full width on mobile, offset by sidebar on desktop */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-55">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
