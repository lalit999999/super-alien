"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/layout/user-avatar";
import {
  User,
  Settings,
  Plug,
  SlidersHorizontal,
  LogOut,
  ChevronDown,
} from "lucide-react";

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-ps-surface-2" />;
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "Account";

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  const handleSignOut = () => {
    signOut(() => router.push("/sign-in"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="group flex items-center gap-1.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ps-accent focus-visible:ring-offset-1 focus-visible:ring-offset-ps-bg"
          aria-label="Open account menu"
        >
          <UserAvatar size="md" />
          <ChevronDown className="h-3 w-3 text-ps-muted transition-transform duration-150 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 border-ps-border bg-ps-bg p-0 shadow-lg shadow-ps-text/10"
      >
        {/* Profile header */}
        <div className="flex items-center gap-3 border-b border-ps-border px-4 py-3.5">
          <UserAvatar size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ps-text">
              {displayName}
            </p>
            <p className="truncate text-xs text-ps-muted">{email}</p>
          </div>
        </div>

        <div className="p-1.5">
          {/* Account */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ps-muted/70">
              Account
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/settings")}
            >
              <User className="h-3.5 w-3.5 text-ps-accent" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-3.5 w-3.5 text-ps-accent" />
              Settings
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5 bg-ps-border" />

          {/* Workspace */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-ps-muted/70">
              Workspace
            </DropdownMenuLabel>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/settings")}
            >
              <Plug className="h-3.5 w-3.5 text-ps-accent" />
              Connected Accounts
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-ps-text hover:bg-ps-surface focus:bg-ps-surface focus:text-ps-text"
              onClick={() => router.push("/settings")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-ps-accent" />
              Preferences
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1.5 bg-ps-border" />

          {/* Danger zone */}
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
