import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { MainContent } from "@/components/layout/main-content";
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

  const isOnboardingExempt = ONBOARDING_EXEMPT_PATHS.some((p) => pathname.startsWith(p));

  if (!isOnboardingExempt) {
    const repo = new OnboardingRepository(prisma);
    const status = await repo.findStatusByClerkUserId(userId);

    if (!status || !status.onboardingCompleted) {
      redirect("/onboarding");
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-ps-bg">
        <Sidebar />
        <MainContent>
          <Topbar />
          <main className="flex-1">{children}</main>
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
