"use client";

import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import type { Plan } from "@/lib/plan-limits";
import Link from "next/link";

interface SubscriptionGateProps {
  /** The tab/feature name shown in the lock screen */
  featureName: string;
  /** Short description of what this section does */
  description: string;
  /** Minimum plan required to access */
  requiredPlan: Plan;
  /** Current user plan */
  currentPlan: Plan;
  /** Bullet points of what the user unlocks */
  unlocks?: string[];
  /** If true, renders children normally (admin/unlocked) */
  isUnlocked: boolean;
  children: React.ReactNode;
}

const PLAN_ORDER: Plan[] = ["free", "miner", "operator", "brokerage"];

const PLAN_DISPLAY: Record<Plan, { label: string; color: string; glow: string }> = {
  free:      { label: "Free",      color: "#555",          glow: "transparent" },
  miner:     { label: "Miner",     color: GEM.yellow,      glow: GLOW.yellow.medium },
  operator:  { label: "Operator",  color: GEM.green,       glow: GLOW.green.medium },
  brokerage: { label: "Brokerage", color: "#A78BFA",       glow: "0 0 16px rgba(167,139,250,0.55)" },
};

export function SubscriptionGate({
  featureName,
  description,
  requiredPlan,
  currentPlan,
  unlocks = [],
  isUnlocked,
  children,
}: SubscriptionGateProps) {
  if (isUnlocked) return <>{children}</>;

  const req  = PLAN_DISPLAY[requiredPlan];
  const curr = PLAN_DISPLAY[currentPlan];
  const upgradeSteps = PLAN_ORDER.slice(
    PLAN_ORDER.indexOf(currentPlan) + 1,
    PLAN_ORDER.indexOf(requiredPlan) + 1
  );

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col">
      {/* Blurred ghost of the content behind */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-20 blur-sm scale-[1.02]">
        {children}
      </div>

      {/* Dark overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `radial-gradient(ellipse at center, rgba(8,8,15,0.82) 0%, rgba(8,8,15,0.97) 100%)`,
        }}
      />

      {/* Lock card */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 py-12">
        <div
          className="w-full max-w-sm rounded-2xl p-8 flex flex-col items-center gap-6 text-center"
          style={{
            background: CAVE.surface1,
            border: `1px solid ${req.color}33`,
            boxShadow: `${req.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
          }}
        >
          {/* Lock icon with gem glow */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute w-16 h-16 rounded-full"
              style={{ background: `${req.color}12`, filter: "blur(12px)" }}
            />
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${req.color}18`,
                border: `1px solid ${req.color}44`,
              }}
            >
              {/* Gem facet lock icon */}
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M7 10V7a4 4 0 0 1 8 0v3" stroke={req.color} strokeWidth="1.5" strokeLinecap="round" />
                <rect x="4" y="10" width="14" height="10" rx="2.5" fill={`${req.color}22`} stroke={req.color} strokeWidth="1.5" />
                <circle cx="11" cy="15" r="1.5" fill={req.color} />
              </svg>
            </div>
          </div>

          {/* Feature name + plan badge */}
          <div className="flex flex-col items-center gap-2">
            <span
              className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-0.5 rounded-full"
              style={{
                color: req.color,
                background: `${req.color}18`,
                border: `1px solid ${req.color}33`,
              }}
            >
              {req.label} Plan
            </span>
            <h2 className="text-[17px] font-semibold text-neutral-200 tracking-tight">
              {featureName}
            </h2>
            <p className="text-[12px] text-neutral-500 leading-relaxed max-w-[240px]">
              {description}
            </p>
          </div>

          {/* Unlocks list */}
          {unlocks.length > 0 && (
            <ul className="w-full flex flex-col gap-2 text-left">
              {unlocks.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[12px] text-neutral-400">
                  <span style={{ color: req.color, marginTop: 1 }}>◆</span>
                  {item}
                </li>
              ))}
            </ul>
          )}

          {/* Divider */}
          <div
            className="w-full h-px"
            style={{ background: `linear-gradient(to right, transparent, ${req.color}33, transparent)` }}
          />

          {/* Current plan indicator */}
          <p className="text-[11px] text-neutral-600">
            You&apos;re on the{" "}
            <span style={{ color: curr.color }} className="font-semibold">
              {curr.label}
            </span>{" "}
            plan
            {upgradeSteps.length > 1 && (
              <> — upgrade through {upgradeSteps.map(p => PLAN_DISPLAY[p].label).join(" → ")}</>
            )}
          </p>

          {/* CTA button */}
          <Link
            href="/dashboard/upgrade"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold tracking-tight transition-all duration-150"
            style={{
              background: `linear-gradient(135deg, ${req.color}22 0%, ${req.color}10 100%)`,
              border: `1px solid ${req.color}55`,
              color: req.color,
              boxShadow: req.glow,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                `linear-gradient(135deg, ${req.color}35 0%, ${req.color}20 100%)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                `linear-gradient(135deg, ${req.color}22 0%, ${req.color}10 100%)`;
            }}
          >
            <span>Unlock {featureName}</span>
            <span style={{ opacity: 0.7 }}>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
