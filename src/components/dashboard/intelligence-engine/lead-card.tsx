"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Plus,
  Play,
  MoreHorizontal,
  ChevronDown,
  CheckCircle,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LeadBadge =
  | "High Intent"
  | "Investor"
  | "Cash Buyer"
  | "Motivated Seller"
  | "Portfolio Owner"
  | "Recently Active";

export type Lead = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  estimatedValue: number;
  equityEstimate: number;
  equityPercent: number;
  mortgageBalance: number;
  yearsOwned: number;
  intentScore: number;
  automationScore: number;
  opportunitySummary: string;
  badges: LeadBadge[];
  propertyType: string;
  ownerType: string;
  lastActivity: string;
  signals: string[];
  source: string;
};

const BADGE_STYLES: Record<LeadBadge, string> = {
  "High Intent":
    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Investor: "bg-brand-500/15 text-brand-400 border-brand-500/20",
  "Cash Buyer": "bg-purple-500/15 text-purple-400 border-purple-500/20",
  "Motivated Seller": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  "Portfolio Owner": "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  "Recently Active": "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const SCORE_FACTORS = [
  { label: "Market Activity", weight: 30, color: "#1277b2" },
  { label: "Behavioral Signals", weight: 25, color: "#10b981" },
  { label: "Equity Weight", weight: 20, color: "#f59e0b" },
  { label: "Ownership Duration", weight: 15, color: "#a855f7" },
  { label: "Financial Indicators", weight: 10, color: "#ef4444" },
];

// Deterministic contribution from intentScore + factor index
function getContribution(score: number, index: number, weight: number): number {
  const seed = (score * 7 + index * 13) % 20;
  return Math.round((weight / 100) * score * (0.75 + seed * 0.015));
}

function IntentBar({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  const gradients: Record<string, string> = {
    green: "linear-gradient(90deg, #10b981, #34d399)",
    amber: "linear-gradient(90deg, #f59e0b, #fbbf24)",
    red: "linear-gradient(90deg, #ef4444, #f87171)",
    brand: "linear-gradient(90deg, #1277b2, #1a8fd1)",
  };
  const glows: Record<string, string> = {
    green: "rgba(16,185,129,0.5)",
    amber: "rgba(245,158,11,0.5)",
    red: "rgba(239,68,68,0.5)",
    brand: "rgba(18,119,178,0.5)",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-neutral-500">{label}</span>
        <span
          className="text-[11px] font-semibold"
          style={{ color: color === "green" ? "#10b981" : color === "amber" ? "#f59e0b" : color === "red" ? "#ef4444" : "#1a8fd1" }}
        >
          {score}/100
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            background: gradients[color],
            boxShadow: `0 0 8px ${glows[color]}`,
          }}
        />
      </div>
    </div>
  );
}

function Avatar({ name, intentScore }: { name: string; intentScore: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("");
  const ringColor =
    intentScore >= 75 ? "#10b981" : intentScore >= 50 ? "#f59e0b" : "#ef4444";
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (intentScore / 100) * circumference;

  return (
    <div className="relative flex-shrink-0 w-12 h-12">
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        className="absolute inset-0 -rotate-90"
      >
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 4px ${ringColor}88)` }}
        />
      </svg>
      <div className="absolute inset-[5px] rounded-full bg-brand-500/20 flex items-center justify-center">
        <span className="text-[11px] font-bold text-brand-300">{initials}</span>
      </div>
    </div>
  );
}

function ScoreBreakdown({ intentScore }: { intentScore: number }) {
  return (
    <div className="mt-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Info className="w-3 h-3 text-neutral-600" />
        <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Score Breakdown
        </p>
      </div>
      {SCORE_FACTORS.map((f, i) => {
        const contribution = getContribution(intentScore, i, f.weight);
        const pct = Math.round((contribution / intentScore) * 100);
        return (
          <div key={f.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-400">{f.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600">
                  {f.weight}% weight
                </span>
                <span
                  className="text-[10px] font-bold tabular-nums"
                  style={{ color: f.color }}
                >
                  +{contribution} pts
                </span>
              </div>
            </div>
            <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: f.color,
                  boxShadow: `0 0 5px ${f.color}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LeadCard({
  lead,
  selected,
  onSelect,
  onAddToWorkflow,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: () => void;
  onAddToWorkflow: (id: string) => void;
}) {
  const [showScoring, setShowScoring] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleAddToWorkflow = () => {
    onAddToWorkflow(lead.id);
    setActivated(true);
    setTimeout(() => setActivated(false), 3500);
  };

  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : `$${(n / 1000).toFixed(0)}K`;

  const intentColor =
    lead.intentScore >= 75
      ? "green"
      : lead.intentScore >= 50
      ? "amber"
      : "red";

  return (
    <div
      className={cn(
        "relative rounded-2xl border transition-all duration-200 p-5",
        "bg-[#0d1421]/80 backdrop-blur-sm",
        selected
          ? "border-brand-500/40 shadow-[0_0_30px_rgba(18,119,178,0.10)]"
          : "border-white/[0.06] hover:border-white/[0.12] hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      )}
    >
      {/* Activation banner */}
      {activated && (
        <div className="absolute inset-x-0 top-0 rounded-t-2xl bg-emerald-500 px-4 py-2 flex items-center gap-2 z-10">
          <CheckCircle className="w-3.5 h-3.5 text-white flex-shrink-0" />
          <span className="text-[11px] font-semibold text-white">
            {lead.name} activated in Seller Nurture Sequence
          </span>
        </div>
      )}

      {/* Select + Header row */}
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={cn(
            "mt-0.5 w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 transition-all",
            selected
              ? "bg-brand-500 border-brand-500"
              : "border-neutral-700 hover:border-neutral-500"
          )}
          onClick={onSelect}
        >
          {selected && (
            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5L4 7.5L8.5 2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <Avatar name={lead.name} intentScore={lead.intentScore} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-[13px] font-semibold text-neutral-100 leading-tight">
                {lead.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-neutral-600 flex-shrink-0" />
                <span className="text-[11px] text-neutral-500 truncate">
                  {lead.address}, {lead.city}, {lead.state} {lead.zip}
                </span>
              </div>
            </div>
            <button className="text-neutral-700 hover:text-neutral-400 transition-colors flex-shrink-0">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-neutral-600" />
              <span className="text-[11px] text-neutral-500">{lead.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-neutral-600" />
              <span className="text-[11px] text-neutral-500 truncate">{lead.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {lead.badges.map((badge) => (
          <span
            key={badge}
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
              BADGE_STYLES[badge]
            )}
          >
            {badge}
          </span>
        ))}
        <span className="text-[10px] text-neutral-600 px-1 self-center">
          {lead.propertyType} · {lead.ownerType}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/[0.04]">
        {[
          { label: "Est. Value", value: fmt(lead.estimatedValue) },
          { label: "Equity", value: fmt(lead.equityEstimate) },
          { label: "Equity %", value: `${lead.equityPercent}%` },
          { label: "Years Owned", value: `${lead.yearsOwned} yrs` },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] text-neutral-600 mb-0.5">{stat.label}</p>
            <p className="text-[13px] font-semibold text-neutral-200">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Score bars */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-neutral-500">Intent Score</span>
            <button
              onClick={() => setShowScoring(!showScoring)}
              className="flex items-center gap-0.5 text-[10px] text-brand-400 hover:text-brand-300 transition-colors"
            >
              {lead.intentScore}/100
              <ChevronDown
                className={cn(
                  "w-3 h-3 transition-transform duration-200",
                  showScoring && "rotate-180"
                )}
              />
            </button>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${lead.intentScore}%`,
                background:
                  intentColor === "green"
                    ? "linear-gradient(90deg,#10b981,#34d399)"
                    : intentColor === "amber"
                    ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                    : "linear-gradient(90deg,#ef4444,#f87171)",
                boxShadow:
                  intentColor === "green"
                    ? "0 0 8px rgba(16,185,129,0.5)"
                    : intentColor === "amber"
                    ? "0 0 8px rgba(245,158,11,0.5)"
                    : "0 0 8px rgba(239,68,68,0.5)",
              }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-neutral-500">Auto Success</span>
            <span className="text-[10px] font-semibold text-brand-400">
              {lead.automationScore}/100
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${lead.automationScore}%`,
                background: "linear-gradient(90deg,#1277b2,#1a8fd1)",
                boxShadow: "0 0 8px rgba(18,119,178,0.5)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      {showScoring && <ScoreBreakdown intentScore={lead.intentScore} />}

      {/* AI Summary */}
      <div className="mt-3 p-3 rounded-xl bg-brand-500/[0.05] border border-brand-500/[0.12]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3 h-3 text-brand-400" />
          <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
            AI Opportunity Summary
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed">
          {lead.opportunitySummary}
        </p>
      </div>

      {/* Signals */}
      {lead.signals.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {lead.signals.map((s) => (
            <span
              key={s}
              className="text-[10px] text-neutral-500 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-full"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center gap-2">
        <button
          onClick={handleAddToWorkflow}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-500 hover:bg-brand-400 text-white text-[11px] font-semibold py-2 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add to Workflow
        </button>
        <button className="flex items-center gap-1.5 border border-white/[0.10] hover:border-white/[0.18] text-neutral-300 text-[11px] font-medium py-2 px-3 rounded-lg transition-colors">
          <Play className="w-3 h-3" />
          Start Sequence
        </button>
        <button className="border border-white/[0.08] hover:border-white/[0.15] text-neutral-600 hover:text-neutral-300 p-2 rounded-lg transition-colors">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Footer meta */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-neutral-700">
          Source: {lead.source}
        </span>
        <span className="text-[10px] text-neutral-700">
          Active: {lead.lastActivity}
        </span>
      </div>
    </div>
  );
}
