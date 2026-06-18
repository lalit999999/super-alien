"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res.json() as { error?: string };
        alert(body.error ?? "Cancellation failed");
      }
    } finally {
      setLoading(false);
      setConfirmed(false);
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
    >
      {loading ? "Cancelling…" : confirmed ? "Confirm cancel?" : "Cancel subscription"}
    </button>
  );
}
