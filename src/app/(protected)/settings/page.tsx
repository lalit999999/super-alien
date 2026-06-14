import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  User,
  Mail,
  CalendarDays,
  RefreshCw,
  Shield,
  Bell,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E7D8C8] bg-white overflow-hidden">
      <div className="border-b border-[#E7D8C8] px-6 py-4">
        <h2 className="text-sm font-semibold text-[#332216]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-[#8C4C1F]">{description}</p>
        )}
      </div>
      <div className="divide-y divide-[#E7D8C8]">{children}</div>
    </div>
  );
}

function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <p className="text-sm font-medium text-[#332216]">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-[#8C4C1F]">{description}</p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
        connected
          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
          : "bg-[#F8F2EA] text-[#8C4C1F] border-[#E7D8C8]"
      }`}
    >
      {connected ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {connected ? "Connected" : "Not connected"}
    </span>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Your Account";

  const primaryEmail =
    user?.emailAddresses?.[0]?.emailAddress ?? "No email";

  return (
    <div className="min-h-full bg-[#FFFDF8] px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#332216]">Settings</h1>
        <p className="mt-1 text-sm text-[#544823]">
          Manage your account and integrations
        </p>
      </div>

      <div className="mx-auto max-w-2xl space-y-6">
        {/* Account */}
        <SettingsSection
          title="Account"
          description="Your profile and authentication"
        >
          <SettingsRow
            label="Profile"
            description={primaryEmail}
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#544823]">{displayName}</span>
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8" },
                }}
              />
            </div>
          </SettingsRow>

          <SettingsRow
            label="Authentication"
            description="Managed by Clerk — secure and passwordless"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-[#FEF0E7] px-3 py-1 text-xs font-medium text-[#BE5103] border border-[#E7D8C8]">
              <Shield className="h-3 w-3" />
              Clerk
            </span>
          </SettingsRow>
        </SettingsSection>

        {/* Integrations */}
        <SettingsSection
          title="Integrations"
          description="Connected services and sync status"
        >
          <SettingsRow
            label="Gmail"
            description="Read and manage your emails via Google"
          >
            <div className="flex items-center gap-2">
              <StatusBadge connected={true} />
              <button className="flex items-center gap-1.5 rounded-lg border border-[#E7D8C8] bg-[#F8F2EA] px-3 py-1.5 text-xs font-medium text-[#544823] transition-colors hover:bg-[#EFE5D5]">
                <RefreshCw className="h-3 w-3" />
                Sync
              </button>
            </div>
          </SettingsRow>

          <SettingsRow
            label="Google Calendar"
            description="Sync your events and meetings"
          >
            <div className="flex items-center gap-2">
              <StatusBadge connected={true} />
              <button className="flex items-center gap-1.5 rounded-lg border border-[#E7D8C8] bg-[#F8F2EA] px-3 py-1.5 text-xs font-medium text-[#544823] transition-colors hover:bg-[#EFE5D5]">
                <RefreshCw className="h-3 w-3" />
                Sync
              </button>
            </div>
          </SettingsRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Control how and when you get notified"
        >
          <SettingsRow
            label="Email summaries"
            description="Receive AI-generated daily email summaries"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-5 w-9 rounded-full border border-[#E7D8C8] bg-[#EFE5D5] peer-checked:bg-[#BE5103] peer-checked:border-[#BE5103] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>

          <SettingsRow
            label="Meeting reminders"
            description="Get reminded before calendar events"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-5 w-9 rounded-full border border-[#E7D8C8] bg-[#EFE5D5] peer-checked:bg-[#BE5103] peer-checked:border-[#BE5103] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>

          <SettingsRow
            label="Agent notifications"
            description="Notify when the AI agent completes an action"
          >
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="h-5 w-9 rounded-full border border-[#E7D8C8] bg-[#EFE5D5] peer-checked:bg-[#BE5103] peer-checked:border-[#BE5103] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
            </label>
          </SettingsRow>
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection
          title="Data & Privacy"
          description="Your data is encrypted and never sold"
        >
          <SettingsRow
            label="Data storage"
            description="Emails and events are stored in your private database"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 border border-emerald-200">
              <Shield className="h-3 w-3" />
              Encrypted
            </span>
          </SettingsRow>

          <SettingsRow
            label="AI data usage"
            description="Your data is used only to generate responses for you"
          >
            <span className="text-xs text-[#8C4C1F]">Never shared</span>
          </SettingsRow>
        </SettingsSection>

        {/* Danger zone */}
        <SettingsSection title="Danger Zone">
          <SettingsRow
            label="Disconnect integrations"
            description="Removes all synced data and API connections"
          >
            <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100">
              Disconnect
            </button>
          </SettingsRow>
        </SettingsSection>
      </div>
    </div>
  );
}
