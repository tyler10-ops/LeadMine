"use client";

import Link from "next/link";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";

const PLANS = [
  {
    id: "miner",
    name: "Miner",
    price: "$97",
    period: "/mo",
    color: GEM.yellow,
    glow: GLOW.yellow,
    description: "Solo operators ready to automate their first follow-up pipeline.",
    features: [
      "15 county scans / month",
      "500 graded leads / month",
      "1 AI calling agent",
      "Lead Machine access",
      "CSV export",
      "1 team seat",
    ],
    cta: "Start Mining",
    highlight: false,
  },
  {
    id: "operator",
    name: "Operator",
    price: "$247",
    period: "/mo",
    color: GEM.green,
    glow: GLOW.green,
    description: "Growing teams running multiple pipelines and needing deep intelligence.",
    features: [
      "50 county scans / month",
      "2,000 graded leads / month",
      "3 AI calling agents",
      "Lead Machine access",
      "Intelligence Agent",
      "Priority support",
      "3 team seats",
      "CSV export",
    ],
    cta: "Become an Operator",
    highlight: true,
  },
  {
    id: "brokerage",
    name: "Brokerage",
    price: "$697",
    period: "/mo",
    color: "#A78BFA",
    glow: {
      soft:   "0 0 8px rgba(167,139,250,0.35)",
      medium: "0 0 16px rgba(167,139,250,0.55)",
      strong: "0 0 28px rgba(167,139,250,0.75), 0 0 56px rgba(167,139,250,0.2)",
      border: "rgba(167,139,250,0.22)",
      bg:     "rgba(167,139,250,0.06)",
    },
    description: "Full-scale brokerages that need unlimited throughput and white-label output.",
    features: [
      "Unlimited county scans",
      "Unlimited graded leads",
      "10 AI calling agents",
      "All panel access",
      "White-label output",
      "Priority support",
      "10 team seats",
      "CSV export",
    ],
    cta: "Go Brokerage",
    highlight: false,
  },
] as const;

export default function UpgradePage() {
  return (
    <div
      className="min-h-full w-full flex flex-col items-center py-16 px-6"
      style={{ background: CAVE.deep }}
    >
      {/* Header */}
      <div className="text-center mb-14 max-w-xl">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase mb-5"
          style={{
            color: GEM.green,
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.2)",
          }}
        >
          ◆ Unlock the Mine
        </div>
        <h1 className="text-[28px] font-bold text-neutral-100 tracking-tight leading-snug mb-3">
          Choose your plan
        </h1>
        <p className="text-[14px] text-neutral-500 leading-relaxed">
          Every tier gives you AI-driven lead follow-up that runs 24/7.
          Upgrade anytime — your data stays intact.
        </p>
      </div>

      {/* Plan cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-2xl p-6 gap-6"
            style={{
              background: plan.highlight
                ? `linear-gradient(160deg, rgba(0,255,136,0.06) 0%, ${CAVE.surface1} 60%)`
                : CAVE.surface1,
              border: `1px solid ${plan.color}${plan.highlight ? "55" : "28"}`,
              boxShadow: plan.highlight ? plan.glow.medium : "none",
            }}
          >
            {/* Most popular badge */}
            {plan.highlight && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase"
                style={{
                  color: GEM.green,
                  background: CAVE.deep,
                  border: `1px solid ${GEM.green}44`,
                  boxShadow: GLOW.green.soft,
                }}
              >
                Most Popular
              </div>
            )}

            {/* Plan name + price */}
            <div>
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: plan.color }}
              >
                {plan.name}
              </span>
              <div className="flex items-end gap-1 mt-1.5">
                <span className="text-[30px] font-bold text-neutral-100 leading-none">
                  {plan.price}
                </span>
                <span className="text-[13px] text-neutral-600 mb-0.5">{plan.period}</span>
              </div>
              <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">
                {plan.description}
              </p>
            </div>

            {/* Divider */}
            <div
              className="h-px w-full"
              style={{
                background: `linear-gradient(to right, transparent, ${plan.color}33, transparent)`,
              }}
            />

            {/* Features */}
            <ul className="flex flex-col gap-2.5 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[12.5px] text-neutral-400">
                  <span style={{ color: plan.color, marginTop: 1, flexShrink: 0 }}>◆</span>
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              href={`/checkout?plan=${plan.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-150"
              style={{
                background: plan.highlight
                  ? `linear-gradient(135deg, ${plan.color}30 0%, ${plan.color}18 100%)`
                  : `${plan.color}12`,
                border: `1px solid ${plan.color}55`,
                color: plan.color,
                boxShadow: plan.highlight ? plan.glow.soft : "none",
              }}
            >
              {plan.cta} →
            </Link>
          </div>
        ))}
      </div>

      {/* Free tier note */}
      <div className="mt-10 text-center">
        <p className="text-[12px] text-neutral-600">
          Currently on the Free plan &middot;{" "}
          <Link
            href="/dashboard"
            className="text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
          >
            go back to dashboard
          </Link>
        </p>
      </div>

      {/* Guarantee strip */}
      <div
        className="mt-12 flex items-center gap-3 px-5 py-3 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span style={{ color: GEM.green }} className="text-lg">◆</span>
        <p className="text-[12px] text-neutral-500">
          14-day money-back guarantee &middot; Cancel anytime &middot; No contracts
        </p>
      </div>
    </div>
  );
}
