"use client";

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

// ── Mock data (placeholder — replace with API calls) ──────────────────────────

const assetFilters = [
  { type: "all",     label: "All Assets",     count: 5, icon: null          },
  { type: "voice",   label: "Voice Agents",   count: 2, icon: Phone         },
  { type: "sms",     label: "SMS Agents",     count: 1, icon: MessageSquare },
  { type: "email",   label: "Email Agents",   count: 1, icon: Mail          },
  { type: "booking", label: "Booking Agents", count: 1, icon: CalendarCheck },
];

const templates = [
  { name: "Buyer Lead Qualification",  type: "voice", uses: 14 },
  { name: "Cold Outreach Sequence",    type: "sms",   uses: 9  },
  { name: "Follow-up Drip — 7 Day",   type: "email", uses: 21 },
  { name: "Expired Listing Script",    type: "voice", uses: 6  },
];

const assets = [
  { id: "a1", name: "Inbound Voice Agent",   type: "voice",   status: "active", score: 88, calls: 124, conversions: 31, convRate: 25, delta: 8,  revenue: "$93K",  lastActive: "2 min ago"  },
  { id: "a2", name: "Cold Outreach Caller",  type: "voice",   status: "active", score: 74, calls: 89,  conversions: 14, convRate: 16, delta: -2, revenue: "$42K",  lastActive: "18 min ago" },
  { id: "a3", name: "SMS Follow-up Bot",     type: "sms",     status: "active", score: 91, calls: 312, conversions: 48, convRate: 15, delta: 12, revenue: "$144K", lastActive: "Just now"   },
  { id: "a4", name: "Email Nurture Agent",   type: "email",   status: "active", score: 67, calls: 540, conversions: 22, convRate: 4,  delta: 1,  revenue: "$66K",  lastActive: "1h ago"     },
  { id: "a5", name: "Auto-Booking Agent",    type: "booking", status: "paused", score: 82, calls: 43,  conversions: 38, convRate: 88, delta: 0,  revenue: "$114K", lastActive: "3h ago"     },
];

const automationList = [
  { id: "auto1", name: "New Lead → Voice Call",      trigger: "Lead created",          status: "active", runs: 248, successRate: 91  },
  { id: "auto2", name: "No Response → SMS Day 2",   trigger: "No answer after 24h",   status: "active", runs: 189, successRate: 78  },
  { id: "auto3", name: "Score Drop → Re-engage",    trigger: "Score drops 15+ pts",   status: "active", runs: 44,  successRate: 64  },
  { id: "auto4", name: "Booked → Confirmation SMS", trigger: "Appointment booked",    status: "active", runs: 31,  successRate: 100 },
];

const deploymentStatus = [
  { name: "Production", env: "Live", agents: 4, health: "healthy"  },
  { name: "Staging",    env: "Test", agents: 1, health: "healthy"  },
];

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

import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { canAccess } from "@/lib/plan-limits";
import type { Plan } from "@/lib/plan-limits";

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

  return (
    <div
      className={cn(
        "h-full flex transition-all duration-500",
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
        <div className="grid grid-cols-2 gap-3">
          {assets.map((asset) => {
            const Icon = typeIcons[asset.type] || Phone;
            const gemKey = typeGem[asset.type] ?? "yellow";
            const scoreGem = scoreToGem(asset.score);
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
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: GLOW[gemKey].bg }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color: GEM[gemKey] }}
                          />
                        </div>
                        <div>
                          <p className="text-[12px] font-medium text-neutral-200 group-hover:text-white transition-colors">
                            {asset.name}
                          </p>
                          <p
                            className="text-[10px] font-medium uppercase tracking-wide mt-0.5"
                            style={{ color: GEM[gemKey] }}
                          >
                            {typeLabels[asset.type]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <GemIndicator
                          status={asset.status === "active" ? "active" : "paused"}
                          size="xs"
                        />
                        <button
                          className="w-5 h-5 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                          onClick={(e) => e.preventDefault()}
                        >
                          {asset.status === "active" ? (
                            <Pause className="w-3 h-3 text-neutral-500" />
                          ) : (
                            <Play className="w-3 h-3 text-neutral-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Performance score bar */}
                    <div className="mb-3 relative z-10">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[10px] text-neutral-600">Performance</span>
                        <span className="text-[11px] font-semibold tabular-nums text-neutral-300">
                          {asset.score}
                          <span className="text-neutral-600 font-normal">/100</span>
                        </span>
                      </div>
                      <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${asset.score}%`,
                            background: PERF_COLOR(asset.score),
                            boxShadow: `0 0 6px ${PERF_COLOR(asset.score)}60`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div
                      className="flex items-center justify-between pt-3 relative z-10"
                      style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-neutral-200 tabular-nums">
                          {asset.calls.toLocaleString()}
                        </p>
                        <p className="text-[9px] text-neutral-600">Interactions</p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-[14px] font-semibold tabular-nums"
                          style={{ color: GEM.green }}
                        >
                          {asset.convRate}%
                        </p>
                        <p className="text-[9px] text-neutral-600">Conv. Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-neutral-200 tabular-nums">
                          {asset.revenue}
                        </p>
                        <p className="text-[9px] text-neutral-600">Est. Revenue</p>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {asset.delta > 0 ? (
                          <TrendingUp className="w-3 h-3" style={{ color: GEM.green }} />
                        ) : asset.delta < 0 ? (
                          <TrendingDown className="w-3 h-3" style={{ color: GEM.red }} />
                        ) : null}
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{
                            color:
                              asset.delta > 0
                                ? GEM.green
                                : asset.delta < 0
                                ? GEM.red
                                : "#525252",
                          }}
                        >
                          {asset.delta > 0 ? "+" : ""}
                          {asset.delta !== 0 ? `${asset.delta}%` : "—"}
                        </span>
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
              {automationList.map((auto) => (
                <div
                  key={auto.id}
                  className="grid items-center gap-3 px-4 py-3 transition-colors"
                  style={{ gridTemplateColumns: "1fr 160px 60px 80px" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
                >
                  <div className="flex items-center gap-2">
                    <GemIndicator
                      status={auto.status === "active" ? "active" : "idle"}
                      size="xs"
                    />
                    <span className="text-[12px] text-neutral-300">{auto.name}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 truncate">{auto.trigger}</span>
                  <span className="text-[12px] font-medium text-neutral-400 tabular-nums">
                    {auto.runs}
                  </span>
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color: PERF_COLOR(auto.successRate) }}
                  >
                    {auto.successRate}%
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
            {[
              { label: "Total Pipeline Value",  value: "$459K",   icon: DollarSign, gem: "green"  as const },
              { label: "AI Conversion Rate",    value: "22.4%",   icon: Target,     gem: "green"  as const },
              { label: "Avg Response Time",     value: "4.2 min", icon: Clock,      gem: "yellow" as const },
              { label: "Automation Runs",       value: "1,284",   icon: Activity,   gem: "yellow" as const },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <MiningPanel key={m.label} padding="sm" status={m.gem} carved>
                  <Icon className="w-3.5 h-3.5 mb-2" style={{ color: GEM[m.gem] }} />
                  <p
                    className="text-[15px] font-semibold tabular-nums"
                    style={{ color: GEM[m.gem] }}
                  >
                    {m.value}
                  </p>
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
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              ROI Tracker
            </p>
          </div>
          <MiningPanel carved>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[11px] text-neutral-500">Pipeline Value</span>
                <span
                  className="text-[18px] font-semibold tabular-nums"
                  style={{ color: GEM.green, textShadow: GLOW.green.soft }}
                >
                  $459K
                </span>
              </div>
              <div className="h-px w-full" style={{ background: CAVE.stoneMid }} />
              {[
                { label: "Projected Closed",     value: "$138K", pct: 30 },
                { label: "Active Negotiations",  value: "$186K", pct: 41 },
                { label: "Warm Pipeline",         value: "$135K", pct: 29 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-neutral-500">{item.label}</span>
                    <span className="text-[11px] font-semibold text-neutral-300 tabular-nums">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.pct}%`,
                        background: `${GEM.green}99`,
                        boxShadow: `0 0 6px ${GEM.green}40`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MiningPanel>
        </div>

        {/* System Intelligence */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5" style={{ color: GEM.yellow }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              System Intelligence
            </p>
          </div>
          <div className="space-y-2">
            {[
              { text: "SMS Agent outperforms Voice by 2.1× on buyer leads — consider rebalancing", type: "insight"  },
              { text: "Auto-Booking Agent has 88% conversion — highest in your stack",             type: "win"      },
              { text: "Email Nurture shows low engagement — review subject line strategy",         type: "warning"  },
              { text: "3 assets haven't been updated in 30+ days — review configurations",        type: "action"   },
            ].map((item, i) => {
              const gemKey =
                item.type === "win" || item.type === "insight"
                  ? "green"
                  : item.type === "warning"
                  ? "yellow"
                  : "red";
              return (
                <MiningPanel key={i} padding="sm" status={gemKey}>
                  <div className="flex items-start gap-2 px-0.5">
                    <Zap
                      className="w-3 h-3 mt-0.5 flex-shrink-0"
                      style={{ color: GEM[gemKey] }}
                    />
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
            <div className="space-y-2.5">
              {assets.map((asset) => {
                const scoreGem = scoreToGem(asset.score);
                return (
                  <div key={asset.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GemIndicator
                        status={asset.status === "active" ? "active" : "paused"}
                        size="xs"
                      />
                      <span className="text-[11px] text-neutral-400 truncate max-w-[110px]">
                        {asset.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${asset.score}%`,
                            background: PERF_COLOR(asset.score),
                            boxShadow: `0 0 4px ${PERF_COLOR(asset.score)}55`,
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-medium tabular-nums w-6 text-right"
                        style={{ color: GEM[scoreGem] }}
                      >
                        {asset.score}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </MiningPanel>
        </div>

        {/* Extraction Stats */}
        <div>
          <SectionHeader>Extraction Stats</SectionHeader>
          <MiningPanel carved>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Runs",   value: "1,284", icon: Activity,     gem: "green"  as const },
                { label: "Success Rate", value: "91%",   icon: CheckCircle2, gem: "green"  as const },
                { label: "Avg Response", value: "4.2m",  icon: Clock,        gem: "yellow" as const },
                { label: "Errors",       value: "3",     icon: AlertCircle,  gem: "red"    as const },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3"
                    style={{
                      background: GLOW[stat.gem].bg,
                      border: `1px solid ${GLOW[stat.gem].border}`,
                    }}
                  >
                    <Icon className="w-3 h-3 mb-1.5" style={{ color: GEM[stat.gem] }} />
                    <p
                      className="text-[15px] font-semibold tabular-nums"
                      style={{ color: GEM[stat.gem] }}
                    >
                      {stat.value}
                    </p>
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
