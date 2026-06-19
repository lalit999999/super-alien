"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapse: () => void;
  setCollapsed: (v: boolean) => void;
};

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleCollapse: () => {},
  setCollapsed: () => {},
});

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("sidebar-collapsed");
      if (stored === "true") setCollapsedState(true);
    } catch {}
  }, []);

  function setCollapsed(v: boolean) {
    setCollapsedState(v);
    try {
      localStorage.setItem("sidebar-collapsed", String(v));
    } catch {}
  }

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, toggleCollapse: () => setCollapsed(!collapsed) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
