import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { prisma } from "@/lib/prisma";
import { OnboardingRepository } from "@/modules/onboarding/onboarding.repository";
import { ONBOARDING_EXEMPT_PATHS } from "@/modules/onboarding/onboarding.constants";

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

  const isExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (!isExempt) {
    const repo = new OnboardingRepository(prisma);
    const status = await repo.findStatusByClerkUserId(userId);

    if (status && !status.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex min-h-screen bg-[#FFFDF8]">
      <Sidebar />
      <div className="flex flex-1 flex-col pl-[220px]">
        <Topbar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
