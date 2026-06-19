"use client";

import { useState } from "react";
import { Zap, Check } from "lucide-react";

const FEATURES = [
  "5,000 AI chat messages per day",
  "Unlimited email summaries",
  "50 AI draft replies per day",
  "Priority support",
  "All future features",
];

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      order_id: string;
      amount: number;
      currency: string;
      name?: string;
      description?: string;
      theme?: { color?: string };
      handler: (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => void;
    }) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/subscribe", { method: "POST" });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        throw new Error(body.error ?? "Subscription creation failed");
      }

      const { data } = await res.json() as {
        data: { orderId: string; amount: number; currency: string; keyId: string };
      };

      const loaded = await loadRazorpayScript();

      if (!loaded || typeof window.Razorpay === "undefined") {
        throw new Error("Could not load Razorpay checkout");
      }

      const rzp = new window.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "SuperAlien",
        description: "Pro Plan — Monthly",
        theme: { color: "#BE5103" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/billing/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            window.location.href = "/billing";
          } else {
            setError("Payment succeeded but verification failed. Contact support.");
          }
        },
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-ps-bg px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-ps-border bg-ps-card p-8 shadow-sm">
        {/* Icon */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-ps-accent-light">
          <Zap className="h-6 w-6 text-ps-accent" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-ps-text">Upgrade to Pro</h1>
        <p className="mb-6 text-sm text-ps-secondary">
          Unlock the full SuperAlien experience with AI-powered productivity tools.
        </p>

        {/* Features */}
        <ul className="mb-8 space-y-2.5">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-ps-text">
              <Check className="h-4 w-4 shrink-0 text-ps-accent" />
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full rounded-xl bg-ps-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ps-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Setting up…" : "Subscribe — ₹1999 / month"}
        </button>

        <p className="mt-3 text-center text-[11px] text-ps-muted">
          Secured by Razorpay · Cancel anytime
        </p>
      </div>
    </div>
  );
}
