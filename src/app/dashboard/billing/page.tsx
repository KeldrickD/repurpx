"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { BillingPlan } from "@prisma/client";

type UsageResponse = {
  creatorAccountId: string;
  plan: BillingPlan;
  monthlySmsLimit: number;
  smsUsed: number;
  smsRemaining: number;
  smsPeriodStart: string;
  smsPeriodResetAt: string;
  stripeSubscriptionId?: string | null;
};

const PLAN_DETAILS: {
  plan: BillingPlan;
  label: string;
  priceLabel: string;
  description: string;
  features: string[];
}[] = [
  {
    plan: "STARTER",
    label: "Starter",
    priceLabel: "$49/mo",
    description: "For solo creators using Telegram + SMS follow-ups.",
    features: [
      "500 SMS credits / mo",
      "Telegram + template library",
      "Fan + dancer CRM",
      "Email support",
    ],
  },
  {
    plan: "GROWTH",
    label: "Growth",
    priceLabel: "$149/mo",
    description: "For full-time creators/dancers texting every week.",
    features: [
      "2,000 SMS credits / mo",
      "Priority sync + AI templates",
      "Telegram + SMS automations",
      "Priority support",
    ],
  },
  {
    plan: "CLUB",
    label: "Club",
    priceLabel: "$499/mo",
    description: "For clubs running VIP programs and bottle service.",
    features: [
      "10,000 SMS credits / mo",
      "Club CRM + VIP analytics",
      "Multi-location support",
      "Dedicated success manager",
    ],
  },
];

export default function BillingPage() {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<
    Partial<Record<BillingPlan | "PORTAL", boolean>>
  >({});

  useEffect(() => {
    let mounted = true;
    fetch("/api/billing/usage")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Unable to load billing info.");
        return json;
      })
      .then((json: UsageResponse) => {
        if (!mounted) return;
        setUsage(json);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || "Unable to load billing info.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const smsUsagePct = useMemo(() => {
    if (!usage || usage.monthlySmsLimit <= 0) return 0;
    return Math.min(100, Math.round((usage.smsUsed / usage.monthlySmsLimit) * 100));
  }, [usage]);

  const handleCheckout = async (plan: BillingPlan) => {
    if (!usage?.creatorAccountId) return;
    setActionLoading((prev) => ({ ...prev, [plan]: true }));
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorAccountId: usage.creatorAccountId,
          plan,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Unable to start checkout.");
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [plan]: false }));
    }
  };

  const openPortal = async () => {
    setActionLoading((prev) => ({ ...prev, PORTAL: true }));
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Unable to open billing portal.");
      }
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open portal.");
    } finally {
      setActionLoading((prev) => ({ ...prev, PORTAL: false }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wide text-silver/60">Billing</p>
        <h1 className="font-heading text-2xl font-semibold text-white">
          Plans & usage
        </h1>
        <p className="text-sm text-silver/70">
          Upgrade when you need more SMS credits or want club-level automations.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-white/10 bg-midnight-alt/40 p-5">
        {loading || !usage ? (
          <p className="text-sm text-silver/70">Loading usage…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-silver/60">
                  Current plan
                </p>
                <p className="text-xl font-heading font-semibold text-white">
                  {usage.plan}
                </p>
                <p className="text-sm text-silver/70">
                  {usage.monthlySmsLimit > 0
                    ? `${usage.monthlySmsLimit.toLocaleString()} SMS credits / month`
                    : "Telegram + CRM access (no SMS credits)"}
                </p>
              </div>
              {usage.stripeSubscriptionId && (
                <Button
                  variant="secondary"
                  onClick={openPortal}
                  disabled={!!actionLoading.PORTAL}
                >
                  {actionLoading.PORTAL ? "Opening portal…" : "Manage subscription"}
                </Button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between text-xs text-silver/70">
                <span>SMS usage</span>
                <span>
                  {usage.smsUsed.toLocaleString()} /{" "}
                  {usage.monthlySmsLimit > 0
                    ? usage.monthlySmsLimit.toLocaleString()
                    : "0"}{" "}
                  credits
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-magenta to-fuchsia transition-all"
                  style={{ width: `${smsUsagePct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-silver/60">
                Resets {new Date(usage.smsPeriodResetAt).toLocaleDateString()}.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-white">
          Upgrade for SMS automation
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_DETAILS.map((plan) => {
            const selected = usage?.plan === plan.plan;
            return (
              <div
                key={plan.plan}
                className={`rounded-2xl border ${
                  selected ? "border-magenta" : "border-white/10"
                } bg-midnight-alt/40 p-5 space-y-4`}
              >
                <div className="space-y-1">
                  <p className="text-sm uppercase tracking-wide text-silver/60">
                    {plan.label}
                  </p>
                  <p className="text-2xl font-heading font-semibold text-white">
                    {plan.priceLabel}
                  </p>
                  <p className="text-sm text-silver/70">{plan.description}</p>
                </div>
                <ul className="space-y-2 text-sm text-silver/80">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-magenta" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  disabled={selected || !!actionLoading[plan.plan]}
                  onClick={() => handleCheckout(plan.plan)}
                >
                  {selected
                    ? "Current plan"
                    : actionLoading[plan.plan]
                      ? "Starting checkout…"
                      : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

