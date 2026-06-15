"use client";

import { Search, Bell, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  const icons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  const cycles: Record<string, string> = {
    light: "dark",
    dark: "system",
    system: "light",
  };

  const current = theme ?? "system";
  const Icon = icons[current as keyof typeof icons] ?? Monitor;

  return (
    <button
      onClick={() => setTheme(cycles[current] ?? "system")}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ps-secondary transition-colors hover:bg-ps-surface"
      aria-label={`Switch theme (current: ${current})`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-14.25 items-center justify-between border-b border-ps-border bg-ps-bg px-4 sm:px-6">
      {/* Left — mobile hamburger + search */}
      <div className="flex flex-1 items-center gap-2 sm:gap-3">
        <MobileNav />

        <div className="flex max-w-xs flex-1 items-center gap-2 rounded-lg border border-ps-border bg-ps-surface px-3 py-2 text-sm transition-colors focus-within:border-ps-accent focus-within:ring-2 focus-within:ring-ps-accent/10">
          <Search className="h-4 w-4 shrink-0 text-ps-muted" />
          <input
            type="text"
            placeholder="Search emails, events..."
            className="w-full bg-transparent text-ps-text placeholder:text-ps-muted outline-none text-sm"
          />
          <kbd className="hidden rounded border border-ps-border bg-ps-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-ps-secondary sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ps-secondary transition-colors hover:bg-ps-surface">
          <Bell className="h-4 w-4" />
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
