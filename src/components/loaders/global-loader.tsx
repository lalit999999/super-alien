"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export function GlobalLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading) {
      setShowTimeout(false);
      return;
    }
    const timeout = setTimeout(() => setShowTimeout(true), 3000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ps-bg/50 backdrop-blur-sm transition-opacity">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-ps-accent" />
        {showTimeout && (
          <p className="text-xs text-ps-muted">Taking longer than expected...</p>
        )}
      </div>
    </div>
  );
}
