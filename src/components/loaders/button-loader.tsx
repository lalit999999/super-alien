"use client";

import { Loader2 } from "lucide-react";

interface ButtonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ButtonWithLoader({
  isLoading,
  children,
  disabled = false,
  className = "",
}: ButtonLoaderProps) {
  return (
    <button
      disabled={isLoading || disabled}
      className={`flex items-center gap-2 disabled:opacity-50 ${className}`}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
