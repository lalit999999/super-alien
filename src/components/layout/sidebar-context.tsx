"use client";

import { createContext, useContext } from "react";

export type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapse: () => void;
};

export const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggleCollapse: () => {},
});

export function useSidebar(): SidebarContextValue {
  return useContext(SidebarContext);
}
