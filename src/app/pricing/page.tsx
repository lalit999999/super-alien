import { Pricing } from "@/components/Pricing";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Pricing — SuperAlien",
  description: "Simple, transparent pricing for AI-powered email and calendar productivity.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-ps-bg">
      <div className="mx-auto max-w-6xl px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ps-secondary hover:text-ps-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
      <Pricing />
    </div>
  );
}
