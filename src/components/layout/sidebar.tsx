"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  Mail,
  Calendar,
  MessageSquare,
  Zap,
  Settings,
  User,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountMenu } from "@/components/layout/account-menu";
import { useSidebar } from "@/components/layout/sidebar-context";

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 220;
const SNAP_THRESHOLD = (COLLAPSED_WIDTH + EXPANDED_WIDTH) / 2;

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "Inbox", icon: Mail },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/chat", label: "Chat", icon: MessageSquare },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isFreePlan, setIsFreePlan] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [isDragging, setIsDragging] = useState(false);
  const [dragWidth, setDragWidth] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((j) => {
        if (j.data?.subscription?.status !== "ACTIVE") {
          setIsFreePlan(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

      const onMouseMove = (mv: MouseEvent) => {
        const newWidth = Math.max(
          COLLAPSED_WIDTH,
          Math.min(EXPANDED_WIDTH, startWidth + mv.clientX - startX)
        );
        setDragWidth(newWidth);
        setIsDragging(true);
      };

      const onMouseUp = (up: MouseEvent) => {
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        const finalWidth = startWidth + up.clientX - startX;
        setCollapsed(finalWidth < SNAP_THRESHOLD);
        setDragWidth(null);
        setIsDragging(false);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [collapsed, setCollapsed]
  );

  const sidebarWidth =
    isDragging && dragWidth !== null
      ? dragWidth
      : collapsed
      ? COLLAPSED_WIDTH
      : EXPANDED_WIDTH;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-ps-border bg-ps-surface lg:flex",
        !isDragging && "transition-[width] duration-150"
      )}
      style={{ width: sidebarWidth }}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-[57px] shrink-0 items-center border-b border-ps-border",
          collapsed ? "justify-center" : "gap-2.5 px-5"
        )}
      >
        <Image
          src="/Logo.png"
          alt="SuperAlien"
          width={28}
          height={28}
          className="shrink-0 rounded-lg"
        />
        {!collapsed && (
          <span className="text-[15px] font-semibold tracking-tight text-ps-text">
            SuperAlien
          </span>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-2.5",
                active
                  ? "bg-ps-accent text-white"
                  : "text-ps-secondary hover:bg-ps-surface-2 hover:text-ps-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}

        {isFreePlan && (
          <Link
            href="/billing/upgrade"
            title={collapsed ? "Upgrade to Pro" : undefined}
            className={cn(
              "mt-2 flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed ? "justify-center" : "gap-2.5",
              pathname.startsWith("/billing/upgrade")
                ? "bg-ps-accent text-white"
                : "text-ps-accent hover:bg-ps-accent-light"
            )}
          >
            <Zap className="h-4 w-4 shrink-0" />
            {!collapsed && "Upgrade to Pro"}
          </Link>
        )}
      </nav>

      {/* Settings / Profile / Billing */}
      <div className="px-3 pb-1">
        <hr className="border-ps-border my-1" />
        {bottomNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center" : "gap-2.5",
                active
                  ? "bg-ps-accent text-white"
                  : "text-ps-secondary hover:bg-ps-surface-2 hover:text-ps-text"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          );
        })}
      </div>

      {/* Account menu */}
      <div className="border-t border-ps-border px-3 py-3">
        <AccountMenu collapsed={collapsed} />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="absolute right-0 top-0 h-full w-2 cursor-col-resize group"
      >
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-3 w-0.5 rounded-full bg-ps-border" />
          <div className="h-3 w-0.5 rounded-full bg-ps-border" />
        </div>
      </div>
    </aside>
  );
}
