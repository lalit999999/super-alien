import Link from "next/link";
import { Check } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

const tiers = [
  {
    name: "Free",
    price: "₹0",
    period: "/mo",
    description: "Try the core workflow — AI summaries and calendar sync — before you commit to anything.",
    features: [
      "Up to 100 emails synced",
      "Basic AI summaries",
      "Google Calendar sync",
      "1 active chat session",
    ],
    popular: false,
  },
  {
    name: "Pro",
    price: "₹1999",
    period: "/mo",
    description: "Full AI control of your inbox: unlimited sync, agent-driven actions, and the classification that actually saves you time.",
    features: [
      "Unlimited email sync",
      "Advanced AI classification",
      "Agent-driven actions",
      "Priority support",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Custom plans for teams with advanced security and scale needs.",
    features: [
      "Everything in Pro",
      "SSO & custom domains",
      "Dedicated onboarding",
      "SLA & compliance support",
    ],
    popular: false,
  },
];

export async function Pricing() {
  const { userId } = await auth();
  const isLoggedIn = !!userId;

  function getHref(tierName: string) {
    if (tierName === "Enterprise") {
      return "mailto:support@superalien.app?subject=Enterprise%20plan%20inquiry";
    }
    if (tierName === "Free") {
      return isLoggedIn ? "/dashboard" : "/sign-up";
    }
    // Pro
    return isLoggedIn ? "/billing/upgrade" : "/sign-up?redirect_url=/billing/upgrade";
  }

  function getLabel(tierName: string) {
    if (tierName === "Enterprise") return "Contact sales";
    if (tierName === "Free") return isLoggedIn ? "Go to dashboard" : "Get started free";
    // Pro
    return isLoggedIn ? "Upgrade now" : "Get started";
  }

  return (
    <section id="pricing" className="py-24 bg-ps-surface">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold text-ps-text sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-ps-secondary">
            Plans for every stage — from solo professionals to large teams.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={[
                "relative flex flex-col rounded-2xl border p-8 transition-shadow hover:shadow-md",
                tier.popular
                  ? "border-ps-accent bg-ps-bg shadow-sm"
                  : "border-ps-border bg-ps-bg",
              ].join(" ")}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-ps-accent bg-ps-accent-light px-3 py-0.5 text-xs font-semibold text-ps-accent">
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-base font-semibold text-ps-text">{tier.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-semibold tracking-tight text-ps-text">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="mb-1 text-sm text-ps-secondary">{tier.period}</span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ps-secondary">
                  {tier.description}
                </p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm text-ps-secondary">
                    <Check className="h-4 w-4 shrink-0 text-ps-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div>
                <Link
                  href={getHref(tier.name)}
                  className={[
                    "block w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-colors",
                    tier.popular
                      ? "border-ps-accent bg-ps-accent text-white hover:bg-ps-accent-dark"
                      : "border-ps-border bg-ps-surface text-ps-text hover:bg-ps-surface-2",
                  ].join(" ")}
                >
                  {getLabel(tier.name)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
