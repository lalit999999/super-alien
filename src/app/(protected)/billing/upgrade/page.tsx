import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BillingRepository } from "@/modules/billing/billing.repository";
import { UpgradeForm } from "@/components/billing/upgrade-form";

export default async function UpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (user) {
    const sub = await new BillingRepository(prisma).findActiveSubscriptionByUserId(user.id);
    if (sub) redirect("/billing");
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-ps-bg px-4 py-12">
      <UpgradeForm />
    </div>
  );
}
