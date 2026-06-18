"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Calendar,
  MessageSquare,
  Settings,
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-55 flex-col border-r border-ps-border bg-ps-surface lg:flex">
      {/* Logo */}
      <div className="flex h-[57px] items-center gap-2.5 border-b border-ps-border px-5">
        <Image
          src="/Logo.png"
          alt="SuperAlien"
          width={28}
          height={28}
          className="rounded-lg"
        />
        <span className="text-[15px] font-semibold tracking-tight text-ps-text">
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
                  ? "bg-ps-accent text-white"
                  : "text-ps-secondary hover:bg-ps-surface-2 hover:text-ps-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-ps-border px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === "/settings"
              ? "bg-ps-accent text-white"
              : "text-ps-secondary hover:bg-ps-surface-2 hover:text-ps-text"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
