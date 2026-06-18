"use client";

import { IdentitySection } from "@/components/profile/identity-section";
import { AccountOverview } from "@/components/profile/account-overview";
import { AppDataSection } from "@/components/profile/app-data-section";
import { DangerZone } from "@/components/profile/danger-zone";

export default function ProfilePage() {
  return (
    <div className="min-h-full bg-ps-bg px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold text-ps-text sm:text-2xl">Profile</h1>
        <p className="mt-1 text-sm text-ps-secondary">
          Manage your identity, security, and connected accounts
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        <IdentitySection />
        <AccountOverview />
        <AppDataSection />
        <DangerZone />
      </div>
    </div>
  );
}
