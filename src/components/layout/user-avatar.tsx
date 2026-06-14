"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ size = "md", className }: UserAvatarProps) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-full bg-ps-surface-2",
          size === "sm" && "h-6 w-6",
          size === "md" && "h-8 w-8",
          size === "lg" && "h-10 w-10",
          className
        )}
      />
    );
  }

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join("") ||
    user?.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <Avatar
      size={size === "lg" ? "lg" : size === "sm" ? "sm" : "default"}
      className={cn(
        "ring-2 ring-ps-accent ring-offset-1 ring-offset-ps-bg",
        className
      )}
    >
      <AvatarImage src={user?.imageUrl} alt={initials} />
      <AvatarFallback className="bg-ps-accent text-white font-semibold text-xs">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
