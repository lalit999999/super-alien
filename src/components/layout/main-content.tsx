"use client";

import { ReactNode } from "react";
import { useSidebar } from "@/components/layout/sidebar-context";

export function MainContent({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col transition-[padding-left] duration-150 ${
        collapsed ? "lg:pl-14" : "lg:pl-55"
      }`}
    >
      {children}
    </div>
  );
}
