"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GEM, CAVE } from "@/lib/cave-theme";

type BillingInterval = "month" | "year";

const PLAN_DISPLAY: Record<string, { name: string; monthlyPrice: string; annualPrice: string }> = {
  miner:     { name: "Miner",     monthlyPrice: "$97",  annualPrice: "$970"  },
  operator:  { name: "Operator",  monthlyPrice: "$247", annualPrice: "$2,470" },
  brokerage: { name: "Brokerage", monthlyPrice: "$697", annualPrice: "$6,970" },
};

function CheckoutContent() {
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const plan            = searchParams.get("plan") ?? "miner";
  const planInfo        = PLAN_DISPLAY[plan] ?? PLAN_DISPLAY.miner;

  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // Auto-redirect if plan is invalid
  useEffect(() => {
    if (!PLAN_DISPLAY[plan]) router.replace("/dashboard/upgrade");
  }, [plan, router]);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billingInterval: interval }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to start checkout. Please try again.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const price    = interval === "month" ? planInfo.monthlyPrice : planInfo.annualPrice;
  const savings  = interval === "year" ? "Save 17%" : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: CAVE.deep }}
    >
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase mb-4"
            style={{ color: GEM.green, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}
          >
            ◆ {planInfo.name} Plan
          </div>
          <h1 className="text-2xl font-black text-neutral-100 tracking-tight">
            Start your 14-day trial
          </h1>
          <p className="text-sm text-neutral-500 mt-2">
            No charge today. Cancel anytime.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 space-y-6"
          style={{ background: CAVE.surface1, border: `1px solid ${GEM.green}28` }}
        >
          {/* Billing toggle */}
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest mb-3">
              Billing period
            </p>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ border: `1px solid rgba(255,255,255,0.08)`, background: CAVE.surface2 }}
            >
              {(["month", "year"] as BillingInterval[]).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setInterval(opt)}
                  className="flex-1 py-2.5 text-[12px] font-semibold transition-all flex items-center justify-center gap-2"
                  style={{
                    background: interval === opt ? `${GEM.green}18` : "transparent",
                    color: interval === opt ? GEM.green : "#666",
                    borderRight: opt === "month" ? `1px solid rgba(255,255,255,0.08)` : "none",
                  }}
                >
                  {opt === "month" ? "Monthly" : "Annual"}
                  {opt === "year" && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${GEM.green}20`, color: GEM.green }}
                    >
                      Save 17%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price display */}
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: CAVE.surface2, border: `1px solid rgba(255,255,255,0.06)` }}
          >
            <div className="flex items-end justify-center gap-1">
              <span className="text-[36px] font-black text-neutral-100 leading-none">{price}</span>
              <span className="text-[13px] text-neutral-600 mb-1">/{interval === "month" ? "mo" : "yr"}</span>
            </div>
            {savings && (
              <p className="text-[11px] mt-1" style={{ color: GEM.green }}>{savings} vs monthly</p>
            )}
            <p className="text-[11px] text-neutral-600 mt-2">
              14-day free trial — then {price}/{interval === "month" ? "month" : "year"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-[12px]"
              style={{ background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.2)", color: "#FF4040" }}
            >
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-[13px] font-bold text-black transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background: GEM.green,
              boxShadow: loading ? "none" : "0 0 24px rgba(0,255,136,0.25)",
            }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Redirecting to Stripe...
              </>
            ) : (
              <>Start Free Trial →</>
            )}
          </button>

          <p className="text-[11px] text-neutral-600 text-center">
            Secured by Stripe · Cancel anytime · No contracts
          </p>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <button
            onClick={() => router.back()}
            className="text-[12px] text-neutral-600 hover:text-neutral-400 transition-colors underline underline-offset-2"
          >
            ← Back to plans
          </button>
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
