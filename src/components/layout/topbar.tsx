"use client";

import { Search, Bell } from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-[57px] items-center justify-between border-b border-[#E7D8C8] bg-[#FFFDF8] px-6">
      {/* Search */}
      <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-[#E7D8C8] bg-[#F8F2EA] px-3 py-2 text-sm text-[#8C4C1F] transition-colors focus-within:border-[#BE5103] focus-within:ring-2 focus-within:ring-[#BE5103]/10">
        <Search className="h-4 w-4 shrink-0 text-[#8C4C1F]" />
        <input
          type="text"
          placeholder="Search emails, events..."
          className="w-full bg-transparent text-[#332216] placeholder:text-[#8C4C1F] outline-none text-sm"
        />
        <kbd className="hidden rounded border border-[#E7D8C8] bg-[#EFE5D5] px-1.5 py-0.5 text-[11px] font-medium text-[#544823] sm:block">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#544823] transition-colors hover:bg-[#EFE5D5]">
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
