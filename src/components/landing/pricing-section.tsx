"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Zap, ArrowRight, Loader2 } from "lucide-react";

const GEM = { green: "#00FF88", yellow: "#FFD60A", red: "#FF3B30" };

type TierId = "prospector" | "miner" | "operator" | "brokerage";

interface Feature {
  text: string;
  included: boolean;
}

interface Tier {
  id: TierId;
  name: string;
  badge?: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  highlight: boolean;
  color: string;
  checkColor: string;
  cta: string;
  features: Feature[];
}

const TIERS: Tier[] = [
  {
    id: "prospector",
    name: "Prospector",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Dip your pick in. No credit card needed.",
    highlight: false,
    color: "rgba(255,255,255,0.5)",
    checkColor: "rgba(255,255,255,0.2)",
    cta: "Start Free",
    features: [
      { text: "3 county scans / month", included: true },
      { text: "10 graded leads / month", included: true },
      { text: "Gem grading (Elite / Refined / Rock)", included: true },
      { text: "Command Center (read-only)", included: true },
      { text: "Lead Machine", included: false },
      { text: "CSV export", included: false },
      { text: "AI Agents", included: false },
      { text: "Team seats", included: false },
    ],
  },
  {
    id: "miner",
    name: "Miner",
    badge: "Most Popular",
    monthlyPrice: 149,
    annualPrice: 119,
    description: "The full operation. Built for solo realtors closing more deals.",
    highlight: true,
    color: GEM.green,
    checkColor: GEM.green,
    cta: "Start Mining",
    features: [
      { text: "15 county scans / month", included: true },
      { text: "500 graded leads / month", included: true },
      { text: "Full Lead Machine + filters", included: true },
      { text: "Call, SMS & email from lead card", included: true },
      { text: "CSV export", included: true },
      { text: "1 AI Agent (voice or SMS)", included: true },
      { text: "Team seats", included: false },
      { text: "Priority support", included: false },
    ],
  },
  {
    id: "operator",
    name: "Operator",
    monthlyPrice: 349,
    annualPrice: 279,
    description: "Built for small teams who mine as a unit.",
    highlight: false,
    color: GEM.yellow,
    checkColor: GEM.yellow,
    cta: "Start Free Trial",
    features: [
      { text: "50 county scans / month", included: true },
      { text: "2,000 graded leads / month", included: true },
      { text: "Full Lead Machine + filters", included: true },
      { text: "Call, SMS & email from lead card", included: true },
      { text: "CSV export", included: true },
      { text: "3 AI Agents", included: true },
      { text: "3 team seats", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    id: "brokerage",
    name: "Brokerage",
    monthlyPrice: 799,
    annualPrice: 639,
    description: "Full fleet. For brokerages running at scale.",
    highlight: false,
    color: "rgba(200,180,255,0.8)",
    checkColor: "rgba(200,180,255,0.5)",
    cta: "Start Free Trial",
    features: [
      { text: "Unlimited county scans", included: true },
      { text: "Unlimited graded leads", included: true },
      { text: "Full Lead Machine + filters", included: true },
      { text: "Call, SMS & email from lead card", included: true },
      { text: "CSV export", included: true },
      { text: "10 AI Agents", included: true },
      { text: "10 team seats", included: true },
      { text: "White label + dedicated support", included: true },
    ],
  },
];

// ── Tier Card ─────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  annual,
  onCheckout,
  isLoading,
}: {
  tier: Tier;
  annual: boolean;
  onCheckout: (tierId: TierId) => void;
  isLoading: boolean;
}) {
  const price = annual ? tier.annualPrice : tier.monthlyPrice;
  const isFree = tier.monthlyPrice === 0;
  const annualSavings = (tier.monthlyPrice - tier.annualPrice) * 12;

  return (
    <div
      className="rounded-2xl border relative overflow-hidden flex flex-col"
      style={{
        background:   tier.highlight ? "#091410" : "#0d0d14",
        borderColor:  tier.highlight ? `${GEM.green}45` : "rgba(255,255,255,0.07)",
        boxShadow:    tier.highlight ? `0 0 0 1px ${GEM.green}18, 0 0 60px ${GEM.green}08` : "none",
      }}
    >
      {/* Top accent bar */}
      <div
        className="h-[2px] w-full"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${tier.color} 35%, ${tier.color} 65%, transparent 100%)`,
          opacity: tier.highlight ? 0.85 : 0.2,
        }}
      />

      {/* Popular badge */}
      {tier.badge && (
        <div className="absolute top-4 right-4">
          <span
            className="text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
            style={{ background: `${GEM.green}18`, color: GEM.green, border: `1px solid ${GEM.green}30` }}
          >
            {tier.badge}
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Plan name + description */}
        <div className="mb-5">
          <h3
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: tier.color }}
          >
            {tier.name}
          </h3>
          <p className="text-[11px] text-neutral-600 leading-relaxed">{tier.description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          {isFree ? (
            <span className="text-[40px] font-black leading-none text-neutral-100">Free</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] font-semibold text-neutral-500 self-start mt-2">$</span>
              <span className="text-[40px] font-black leading-none text-neutral-100">{price}</span>
              <span className="text-[12px] text-neutral-600">/mo</span>
            </div>
          )}
          {annual && !isFree && annualSavings > 0 && (
            <p className="text-[10px] mt-1.5" style={{ color: `${GEM.green}70` }}>
              Billed annually · Save ${annualSavings}/yr
            </p>
          )}
          {!annual && !isFree && (
            <p className="text-[10px] text-neutral-700 mt-1.5">Billed monthly</p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onCheckout(tier.id)}
          disabled={isLoading}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold mb-6 transition-all w-full disabled:opacity-60 hover:opacity-90 active:scale-[0.98] cursor-pointer"
          style={
            tier.highlight
              ? { background: GEM.green, color: "#000", boxShadow: `0 0 24px ${GEM.green}30` }
              : { background: "rgba(255,255,255,0.05)", color: tier.color, border: `1px solid ${tier.color}22` }
          }
        >
          {isLoading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
          ) : (
            <>{tier.cta}{tier.highlight && <ArrowRight className="w-3.5 h-3.5" />}</>
          )}
        </button>

        {/* Divider */}
        <div className="border-t mb-5" style={{ borderColor: "rgba(255,255,255,0.05)" }} />

        {/* Features */}
        <ul className="space-y-2.5 flex-1">
          {tier.features.map((f) => (
            <li key={f.text} className="flex items-start gap-2.5">
              {f.included ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: tier.checkColor }} />
              ) : (
                <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-800" />
              )}
              <span className={`text-[11px] leading-relaxed ${f.included ? "text-neutral-400" : "text-neutral-700"}`}>
                {f.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

interface PricingSectionProps {
  isAuthenticated: boolean;
}

export function PricingSection({ isAuthenticated }: PricingSectionProps) {
  const [annual, setAnnual]           = useState(false);
  const [loadingTier, setLoadingTier] = useState<TierId | null>(null);

  const handleCheckout = async (tierId: TierId) => {
    if (tierId === "prospector") {
      window.location.href = "/auth/signup";
      return;
    }

    const billingInterval = annual ? "year" : "month";

    if (!isAuthenticated) {
      // Preserve plan intent through signup
      window.location.href = `/auth/signup?plan=${tierId}&billing=${billingInterval}`;
      return;
    }

    setLoadingTier(tierId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: tierId, billingInterval }),
      });

      if (res.status === 401) {
        // Session expired — send to login
        window.location.href = `/auth/login?next=/#pricing`;
        return;
      }

      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("[checkout] Error:", data.error);
      }
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <section id="pricing" className="py-32 relative" style={{ background: "#08080e" }}>
      {/* Background glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            `radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,255,136,0.04) 0%, transparent 60%),` +
            `radial-gradient(ellipse 40% 40% at 80% 100%, rgba(255,214,10,0.03) 0%, transparent 60%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <p
            className="text-[11px] font-medium uppercase tracking-[0.3em] mb-3"
            style={{ color: GEM.green }}
          >
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100 mb-4">
            Mine more. Pay less.
          </h2>
          <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed mb-8">
            No contracts. Cancel anytime. One closed deal pays for your entire year.
          </p>

          {/* Annual / Monthly toggle */}
          <div
            className="inline-flex items-center gap-1 p-1 rounded-xl"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer"
              style={
                !annual
                  ? { background: "rgba(255,255,255,0.09)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
                  : { color: "rgba(255,255,255,0.3)", border: "1px solid transparent" }
              }
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-2 cursor-pointer"
              style={
                annual
                  ? { background: "rgba(255,255,255,0.09)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
                  : { color: "rgba(255,255,255,0.3)", border: "1px solid transparent" }
              }
            >
              Annual
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: `${GEM.green}22`, color: GEM.green }}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* "No brainer" callout */}
        <div
          className="mb-10 rounded-xl p-4 flex items-center gap-4 max-w-3xl mx-auto"
          style={{ background: "rgba(0,255,136,0.035)", border: "1px solid rgba(0,255,136,0.1)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${GEM.green}15` }}
          >
            <Zap className="w-4 h-4" style={{ color: GEM.green }} />
          </div>
          <p className="text-[12px] text-neutral-400 leading-relaxed">
            Traditional real estate leads cost{" "}
            <span className="text-neutral-200 font-semibold">$200–$500 per lead</span>. Miner
            delivers{" "}
            <span style={{ color: GEM.green }} className="font-semibold">
              500 graded leads/month
            </span>{" "}
            for $149 — that&apos;s{" "}
            <span className="text-neutral-200 font-semibold">$0.30 per lead</span>. One
            commission pays for 5+ years of Miner.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {TIERS.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              annual={annual}
              onCheckout={handleCheckout}
              isLoading={loadingTier === tier.id}
            />
          ))}
        </div>

        {/* Footer notes */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-center">
          <p className="text-[11px] text-neutral-700">
            All paid plans include a{" "}
            <span className="text-neutral-500 font-medium">14-day free trial</span> — no credit card required.
          </p>
          <div className="hidden sm:block w-px h-3 bg-neutral-800" />
          <p className="text-[11px] text-neutral-700">
            Need a custom contract?{" "}
            <Link
              href="mailto:sales@leadmine.app"
              className="underline underline-offset-2 hover:text-neutral-400 transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Talk to sales
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
