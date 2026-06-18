"use client";

import { useRef, useState, useCallback, useLayoutEffect } from "react";
import { type PanelImperativeHandle, type PanelSize } from "react-resizable-panels";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SidebarContext } from "./sidebar-context";
import { cn } from "@/lib/utils";

const DEFAULT_SIZE = "220px";
const MIN_SIZE = "200px";
const MAX_SIZE = "360px";
const COLLAPSED_SIZE = "64px";
const DESKTOP_BREAKPOINT = 1024;

function persistState(size: string, collapsed: boolean) {
  try {
    const value = encodeURIComponent(JSON.stringify({ size, collapsed }));
    document.cookie = `sidebar:state=${value};path=/;max-age=31536000;samesite=lax`;
    localStorage.setItem("sidebar:state", JSON.stringify({ size, collapsed }));
  } catch {}
}

export function SidebarLayout({
  initialSize = DEFAULT_SIZE,
  initialCollapsed = false,
  children,
}: {
  initialSize?: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const panelRef = useRef<PanelImperativeHandle | null>(null);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [dragging, setDragging] = useState(false);
  const lastSizeRef = useRef(initialSize);

  // On mobile (< lg), collapse sidebar panel to 0 so it takes no space
  useLayoutEffect(() => {
    if (window.innerWidth < DESKTOP_BREAKPOINT) {
      panelRef.current?.resize("0px");
    }
  }, []);

  const handleResize = useCallback((panelSize: PanelSize) => {
    const px = panelSize.inPixels;
    if (px < 70) {
      // entering collapsed territory – don't overwrite the persisted expanded size
      return;
    }
    const sizeStr = `${Math.round(px)}px`;
    lastSizeRef.current = sizeStr;
    setCollapsed(false);
    persistState(sizeStr, false);
  }, []);

  const handlePointerDown = useCallback(() => {
    setDragging(true);
    document.addEventListener(
      "pointerup",
      () => setDragging(false),
      { once: true }
    );
  }, []);

  const toggleCollapse = useCallback(() => {
    const handle = panelRef.current;
    if (!handle) return;
    if (collapsed) {
      handle.expand();
      setCollapsed(false);
      persistState(lastSizeRef.current, false);
    } else {
      handle.collapse();
      setCollapsed(true);
      persistState(lastSizeRef.current, true);
    }
  }, [collapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapse }}>
      <ResizablePanelGroup orientation="horizontal" className="h-screen bg-ps-bg">
        <ResizablePanel
          panelRef={panelRef}
          defaultSize={initialCollapsed ? COLLAPSED_SIZE : initialSize}
          minSize="0px"
          maxSize={MAX_SIZE}
          collapsible
          collapsedSize={COLLAPSED_SIZE}
          onResize={handleResize}
          className={cn(
            "hidden lg:flex",
            !dragging && "transition-[flex]"
          )}
        >
          <Sidebar />
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="hidden lg:flex border-ps-border"
          onPointerDown={handlePointerDown}
        />
        <ResizablePanel className="flex min-w-0 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </SidebarContext.Provider>
  );
}
