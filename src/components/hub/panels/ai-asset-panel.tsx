"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  Mail,
  CalendarCheck,
  Building,
  Share2,
  Brain,
  Zap,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Clock,
  Activity,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Target,
  Workflow,
  Loader2,
} from "lucide-react";
import {
  GEM,
  GLOW,
  CAVE,
  PERF_COLOR,
  scoreToGem,
} from "@/lib/cave-theme";
import { GemIndicator } from "@/components/ui/gem-indicator";
import { MiningPanel, GlowBorder } from "@/components/ui/mining-panel";
import { GemShard } from "@/components/ui/embedded-gem";
import { Gem } from "@/components/ui/gem";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { canAccess } from "@/lib/plan-limits";
import type { Plan } from "@/lib/plan-limits";

// ── Static config ─────────────────────────────────────────────────────────────

const templates = [
  { name: "Buyer Lead Qualification", type: "voice", uses: 14 },
  { name: "Cold Outreach Sequence",   type: "sms",   uses: 9  },
  { name: "Follow-up Drip — 7 Day",  type: "email", uses: 21 },
  { name: "Expired Listing Script",   type: "voice", uses: 6  },
];

// ── API data types ─────────────────────────────────────────────────────────────

interface ApiAsset {
  id: string;
  name: string;
  type: string;
  status: string;
  performance_score: number;
  key_metric_value: number;
  response_success_rate: number;
  last_active_at: string | null;
}

interface ApiAutomation {
  id: string;
  name: string;
  trigger_type: string;
  status: string;
  total_runs: number;
  success_rate: number;
}

interface AnalyticsTotals {
  aiHandledLeads: number;
  appointmentsBooked: number;
  estimatedCommission: number;
  avgResponseTime: number;
  totalRuns: number;
  successRate: number;
}

function formatLastActive(ts: string | null): string {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtCommission(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v}`;
}

function fmtMs(ms: number): string {
  if (ms <= 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${(s / 60).toFixed(1)} min`;
}

// ── Type → gem color mapping (3-color system only) ───────────────────────────

const typeGem: Record<string, "green" | "yellow"> = {
  voice:   "green",
  sms:     "green",
  email:   "yellow",
  booking: "green",
  social:  "yellow",
  listing: "yellow",
};

const typeIcons: Record<string, React.ElementType> = {
  voice:   Phone,
  sms:     MessageSquare,
  email:   Mail,
  booking: CalendarCheck,
  social:  Share2,
  listing: Building,
};

const typeLabels: Record<string, string> = {
  voice:   "Voice AI",
  sms:     "SMS AI",
  email:   "Email AI",
  booking: "Booking AI",
  social:  "Social AI",
  listing: "Listing AI",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  children,
  gemVariant,
}: {
  children: React.ReactNode;
  gemVariant?: "green" | "yellow" | "red";
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {gemVariant && <GemShard variant={gemVariant} size="xs" />}
      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface AIAssetPanelProps {
  isActive: boolean;
  realtorSlug?: string;
  plan?: Plan;
  isUnlocked?: boolean;
}

export function AIAssetPanel({ isActive, plan = "free", isUnlocked }: AIAssetPanelProps) {
  if (!(isUnlocked ?? canAccess(plan, "aiAgents"))) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: "#000000" }}>
        <UpgradePrompt
          feature="AI Assets"
          requiredPlan="Miner"
          description="Upgrade to Miner to deploy AI voice agents, SMS bots, and booking agents that work around the clock."
        />
      </div>
    );
  }

  const [assets, setAssets]             = useState<ApiAsset[]>([]);
  const [automationList, setAutomations] = useState<ApiAutomation[]>([]);
  const [totals, setTotals]             = useState<AnalyticsTotals | null>(null);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    fetch("/api/analytics?days=30")
      .then((r) => r.json())
      .then((d) => {
        if (d.assets)      setAssets(d.assets);
        if (d.automations) setAutomations(d.automations);
        if (d.totals)      setTotals(d.totals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isActive]);

  // Derived counts for sidebar filter
  const assetFilters = [
    { type: "all",     label: "All Assets",     count: assets.length, icon: null          },
    { type: "voice",   label: "Voice Agents",   count: assets.filter(a => a.type === "voice").length,   icon: Phone         },
    { type: "sms",     label: "SMS Agents",     count: assets.filter(a => a.type === "sms").length,     icon: MessageSquare },
    { type: "email",   label: "Email Agents",   count: assets.filter(a => a.type === "email").length,   icon: Mail          },
    { type: "booking", label: "Booking Agents", count: assets.filter(a => a.type === "booking").length, icon: CalendarCheck },
  ];

  const deploymentStatus = [
    { name: "Production", env: "Live",  agents: assets.filter(a => a.status === "active").length, health: "healthy" },
    { name: "Staging",    env: "Test",  agents: assets.filter(a => a.status === "paused").length, health: assets.filter(a => a.status === "error").length > 0 ? "degraded" : "healthy" },
  ];

  // Compute system intelligence insights from real data
  const insights: { text: string; type: "insight" | "win" | "warning" | "action" }[] = [];
  if (assets.length > 0) {
    const best = assets.reduce((a, b) => a.response_success_rate > b.response_success_rate ? a : b);
    const worst = assets.reduce((a, b) => a.response_success_rate < b.response_success_rate ? a : b);
    if (best.id !== worst.id) {
      insights.push({ text: `${best.name} leads your stack at ${Math.round(best.response_success_rate)}% conversion.`, type: "win" });
      if (worst.response_success_rate < 20) {
        insights.push({ text: `${worst.name} is underperforming at ${Math.round(worst.response_success_rate)}% — review its configuration.`, type: "warning" });
      }
    }
    const stale = assets.filter(a => {
      if (!a.last_active_at) return true;
      return Date.now() - new Date(a.last_active_at).getTime() > 30 * 86400000;
    });
    if (stale.length > 0) {
      insights.push({ text: `${stale.length} asset${stale.length > 1 ? "s" : ""} haven't been active in 30+ days — review configurations.`, type: "action" });
    }
  }
  if (insights.length === 0) {
    insights.push({ text: "Deploy your first AI asset to start seeing intelligence insights.", type: "insight" });
  }

  return (
    <div
      className={cn(
        "h-full w-full flex transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── LEFT COLUMN — Asset Library ──────────────────────────────── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Asset Types */}
        <div>
          <SectionHeader gemVariant="green">Asset Types</SectionHeader>
          <div className="space-y-1">
            {assetFilters.map((f) => {
              const Icon = f.icon;
              const isAll = f.type === "all";
              return (
                <div
                  key={f.type}
                  className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: isAll ? "rgba(255,255,255,0.07)" : CAVE.surface2,
                    border: isAll
                      ? "1px solid rgba(255,255,255,0.1)"
                      : `1px solid ${CAVE.stoneMid}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3 h-3 text-neutral-500" />}
                    <span
                      className={cn(
                        "text-[12px]",
                        isAll ? "text-neutral-200 font-medium" : "text-neutral-400"
                      )}
                    >
                      {f.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-neutral-500 tabular-nums">
                    {f.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Template Library */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader>Templates</SectionHeader>
            <button
              className="text-[10px] text-neutral-600 transition-colors"
              style={{ ["&:hover" as string]: {} }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = GEM.green)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "")}
            >
              Browse
            </button>
          </div>
          <div className="space-y-1.5">
            {templates.map((t) => {
              const gemKey = typeGem[t.type] ?? "yellow";
              return (
                <div
                  key={t.name}
                  className="rounded-xl px-3 py-2.5 cursor-pointer transition-colors group"
                  style={{
                    background: CAVE.surface2,
                    border: `1px solid ${CAVE.stoneEdge}`,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = CAVE.surface2)
                  }
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium text-neutral-300 leading-snug">
                      {t.name}
                    </p>
                    <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 transition-colors flex-shrink-0 mt-0.5" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                      style={{
                        color: GEM[gemKey],
                        background: GLOW[gemKey].bg,
                      }}
                    >
                      {t.type}
                    </span>
                    <span className="text-[10px] text-neutral-600">{t.uses} uses</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deployment */}
        <div>
          <SectionHeader>Deployment</SectionHeader>
          <div className="space-y-2">
            {deploymentStatus.map((d) => (
              <MiningPanel
                key={d.name}
                padding="sm"
                status={d.health === "healthy" ? "green" : "red"}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-neutral-300">{d.name}</p>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-md"
                    style={{
                      color: d.health === "healthy" ? GEM.green : GEM.red,
                      background: d.health === "healthy" ? GLOW.green.bg : GLOW.red.bg,
                    }}
                  >
                    {d.health}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-600 mt-1">
                  {d.env} &middot; {d.agents} agent{d.agents !== 1 ? "s" : ""}
                </p>
              </MiningPanel>
            ))}
            <button
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px dashed ${CAVE.stone}`,
              }}
            >
              <Plus className="w-3 h-3" />
              New Deployment
            </button>
          </div>
        </div>
      </div>

      {/* ── CENTER COLUMN — Asset Manager ─────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem variant="green" size="xs" animated />
            <div>
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                AI Assets
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Manage, deploy &amp; monitor your mining fleet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/assets/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-black transition-colors"
              style={{
                background: GEM.green,
                boxShadow: GLOW.green.soft,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#33FFAA")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = GEM.green)}
            >
              <Plus className="w-3 h-3" />
              New Asset
            </a>
            <a
              href="/dashboard/assets"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 transition-colors"
              style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
            >
              All Assets <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Asset Cards Grid */}
        {loading && assets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-700" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => {
            const Icon = typeIcons[asset.type] || Phone;
            const gemKey = (typeGem[asset.type] ?? "yellow") as "green" | "yellow";
            const scoreGem = scoreToGem(asset.performance_score);
            const convRate = Math.round(asset.response_success_rate);
            return (
              <a key={asset.id} href={`/dashboard/assets/${asset.id}`}>
                <GlowBorder variant={scoreGem} intensity="soft">
                  <div
                    className="relative rounded-xl p-4 transition-all duration-200 group cursor-pointer overflow-hidden"
                    style={{ background: CAVE.surface2 }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = CAVE.surface2)
                    }
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GLOW[gemKey].bg }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: GEM[gemKey] }} />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-neutral-200 group-hover:text-white transition-colors">{asset.name}</p>
                          <p className="text-[10px] font-medium uppercase tracking-wide mt-0.5" style={{ color: GEM[gemKey] }}>{typeLabels[asset.type]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GemIndicator status={asset.status === "active" ? "active" : "paused"} size="xs" />
                        <button className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors" onClick={(e) => e.preventDefault()}>
                          {asset.status === "active" ? <Pause className="w-3 h-3 text-neutral-500" /> : <Play className="w-3 h-3 text-neutral-500" />}
                        </button>
                      </div>
                    </div>

                    {/* Performance score bar */}
                    <div className="mb-3 relative z-10">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] text-neutral-600">Performance</span>
                        <span className="text-[11px] font-semibold tabular-nums text-neutral-300">
                          {asset.performance_score}<span className="text-neutral-600 font-normal">/100</span>
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${asset.performance_score}%`, background: PERF_COLOR(asset.performance_score), boxShadow: `0 0 6px ${PERF_COLOR(asset.performance_score)}60` }} />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between pt-3 relative z-10" style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}>
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-neutral-200 tabular-nums">{asset.key_metric_value.toLocaleString()}</p>
                        <p className="text-[9px] text-neutral-600">Interactions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-semibold tabular-nums" style={{ color: GEM.green }}>{convRate}%</p>
                        <p className="text-[9px] text-neutral-600">Conv. Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[11px] text-neutral-500">{formatLastActive(asset.last_active_at)}</p>
                        <p className="text-[9px] text-neutral-600">Last Active</p>
                      </div>
                    </div>
                  </div>
                </GlowBorder>
              </a>
            );
          })}

          {/* New asset slot */}
          <a href="/dashboard/assets/new">
            <div
              className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              style={{
                background: "rgba(255,255,255,0.01)",
                border: `1px dashed ${CAVE.stone}`,
                minHeight: "160px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = `${GEM.green}40`;
                (e.currentTarget as HTMLElement).style.background = GLOW.green.bg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = CAVE.stone;
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.01)";
              }}
            >
              <Plus className="w-5 h-5 text-neutral-700" />
              <span className="text-[12px] text-neutral-600">Deploy New Agent</span>
            </div>
          </a>
        </div>

        {/* Active Automations Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Workflow className="w-3.5 h-3.5 text-neutral-500" />
              <p className="text-[13px] font-semibold text-neutral-300">Active Automations</p>
            </div>
            <a
              href="/dashboard/automations"
              className="text-[11px] text-neutral-600 transition-colors"
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = GEM.green)}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "")}
            >
              View all →
            </a>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
          >
            <div
              className="grid text-[10px] font-semibold text-neutral-600 uppercase tracking-widest px-4 py-2.5"
              style={{
                gridTemplateColumns: "1fr 160px 60px 80px",
                borderBottom: `1px solid ${CAVE.stoneMid}`,
              }}
            >
              <span>Automation</span>
              <span>Trigger</span>
              <span>Runs</span>
              <span>Success</span>
            </div>
            <div className="divide-y" style={{ borderColor: CAVE.stoneMid }}>
              {automationList.length === 0 ? (
                <p className="text-[11px] text-neutral-600 text-center py-6">No automations yet — create one to get started.</p>
              ) : automationList.map((auto) => (
                <div
                  key={auto.id}
                  className="grid items-center gap-3 px-4 py-3 transition-colors"
                  style={{ gridTemplateColumns: "1fr 160px 60px 80px" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) =>  ((e.currentTarget as HTMLElement).style.background = "")}
                >
                  <div className="flex items-center gap-2">
                    <GemIndicator status={auto.status === "active" ? "active" : "idle"} size="xs" />
                    <span className="text-[12px] text-neutral-300">{auto.name}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 truncate">{auto.trigger_type}</span>
                  <span className="text-[12px] font-medium text-neutral-400 tabular-nums">{auto.total_runs.toLocaleString()}</span>
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: PERF_COLOR(auto.success_rate) }}>
                    {Math.round(auto.success_rate)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN — Intelligence / Monetization ───────────────── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Performance Metrics */}
        <div>
          <SectionHeader gemVariant="green">Performance Metrics</SectionHeader>
          <div className="grid grid-cols-2 gap-2">
            {([
              { label: "Est. Commission",    value: totals ? fmtCommission(totals.estimatedCommission) : "—", icon: DollarSign, gem: "green"  as const },
              { label: "AI Conv. Rate",      value: totals ? `${totals.successRate}%`                        : "—", icon: Target,     gem: "green"  as const },
              { label: "Avg Response",       value: totals ? fmtMs(totals.avgResponseTime)                   : "—", icon: Clock,      gem: "yellow" as const },
              { label: "Automation Runs",    value: totals ? totals.totalRuns.toLocaleString()               : "—", icon: Activity,   gem: "yellow" as const },
            ] as const).map((m) => {
              const Icon = m.icon;
              return (
                <MiningPanel key={m.label} padding="sm" status={m.gem} carved>
                  <Icon className="w-3.5 h-3.5 mb-2" style={{ color: GEM[m.gem] }} />
                  <p className="text-[15px] font-semibold tabular-nums" style={{ color: GEM[m.gem] }}>{m.value}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{m.label}</p>
                </MiningPanel>
              );
            })}
          </div>
        </div>

        {/* ROI Tracker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-3.5 h-3.5" style={{ color: GEM.green }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">ROI Tracker</p>
          </div>
          <MiningPanel carved>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-500">Est. Commission (30d)</span>
                <span className="text-[18px] font-semibold tabular-nums" style={{ color: GEM.green, textShadow: GLOW.green.soft }}>
                  {totals ? fmtCommission(totals.estimatedCommission) : "—"}
                </span>
              </div>
              <div className="h-px w-full" style={{ background: CAVE.stoneMid }} />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">Appts Booked</span>
                <span className="text-[11px] font-semibold text-neutral-300 tabular-nums">{totals?.appointmentsBooked ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">AI-Handled Leads</span>
                <span className="text-[11px] font-semibold text-neutral-300 tabular-nums">{totals?.aiHandledLeads ?? "—"}</span>
              </div>
              {!totals && (
                <p className="text-[10px] text-neutral-700 text-center pt-1">Analytics populate after automations run.</p>
              )}
            </div>
          </MiningPanel>
        </div>

        {/* System Intelligence */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5" style={{ color: GEM.yellow }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">System Intelligence</p>
          </div>
          <div className="space-y-2">
            {insights.map((item, i) => {
              const gemKey = item.type === "win" || item.type === "insight" ? "green" : item.type === "warning" ? "yellow" : "red";
              return (
                <MiningPanel key={i} padding="sm" status={gemKey}>
                  <div className="flex items-start gap-2 px-0.5">
                    <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: GEM[gemKey] }} />
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{item.text}</p>
                  </div>
                </MiningPanel>
              );
            })}
          </div>
        </div>

        {/* Asset Health */}
        <div>
          <SectionHeader gemVariant="yellow">Asset Health</SectionHeader>
          <MiningPanel carved>
            {assets.length === 0 ? (
              <p className="text-[11px] text-neutral-600 text-center py-3">No assets deployed yet.</p>
            ) : (
              <div className="space-y-2.5">
                {assets.map((asset) => {
                  const scoreGem = scoreToGem(asset.performance_score);
                  return (
                    <div key={asset.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GemIndicator status={asset.status === "active" ? "active" : "paused"} size="xs" />
                        <span className="text-[11px] text-neutral-400 truncate max-w-[110px]">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-neutral-800 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${asset.performance_score}%`, background: PERF_COLOR(asset.performance_score), boxShadow: `0 0 4px ${PERF_COLOR(asset.performance_score)}55` }} />
                        </div>
                        <span className="text-[11px] font-medium tabular-nums w-6 text-right" style={{ color: GEM[scoreGem] }}>{asset.performance_score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MiningPanel>
        </div>

        {/* Extraction Stats */}
        <div>
          <SectionHeader>Extraction Stats</SectionHeader>
          <MiningPanel carved>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Total Runs",   value: totals ? totals.totalRuns.toLocaleString()  : "—",  icon: Activity,     gem: "green"  as const },
                { label: "Success Rate", value: totals ? `${totals.successRate}%`           : "—",  icon: CheckCircle2, gem: "green"  as const },
                { label: "Avg Response", value: totals ? fmtMs(totals.avgResponseTime)      : "—",  icon: Clock,        gem: "yellow" as const },
                { label: "Assets",       value: String(assets.length),                              icon: AlertCircle,  gem: "yellow" as const },
              ] as const).map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="rounded-xl p-3" style={{ background: GLOW[stat.gem].bg, border: `1px solid ${GLOW[stat.gem].border}` }}>
                    <Icon className="w-3 h-3 mb-1.5" style={{ color: GEM[stat.gem] }} />
                    <p className="text-[15px] font-semibold tabular-nums" style={{ color: GEM[stat.gem] }}>{stat.value}</p>
                    <p className="text-[10px] text-neutral-600">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </MiningPanel>
        </div>
      </div>
    </div>
  );
}
