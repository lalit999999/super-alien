"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Calendar,
  MessageSquare,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Mail },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col border-r border-[#E7D8C8] bg-[#F8F2EA]">
      {/* Logo */}
      <div className="flex h-[57px] items-center gap-2.5 border-b border-[#E7D8C8] px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#BE5103]">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-[#332216]">
          SuperAlien
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#BE5103] text-white"
                  : "text-[#544823] hover:bg-[#EFE5D5] hover:text-[#332216]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#E7D8C8] px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-[#BE5103] text-white"
              : "text-[#544823] hover:bg-[#EFE5D5] hover:text-[#332216]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
