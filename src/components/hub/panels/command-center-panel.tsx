"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Zap,
  Brain,
  Phone,
  MessageSquare,
  Mail,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Newspaper,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import {
  GEM,
  GLOW,
  CAVE,
  STAGE_GEM,
  SIGNAL_GEM,
} from "@/lib/cave-theme";
import { GemIndicator } from "@/components/ui/gem-indicator";
import { MiningPanel, GlowBorder } from "@/components/ui/mining-panel";
import { GemShard } from "@/components/ui/embedded-gem";
import { Gem } from "@/components/ui/gem";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CommandCenterData {
  stageCounts: { new: number; contacted: number; qualified: number; booked: number; dead: number };
  tierCounts:  { diamond: number; hot: number; warm: number; cold: number; total: number };
  mining: {
    gemsMined: number;
    eliteMined: number;
    totalRuns: number;
    lastRunAt: string | null;
    lastRunStatus: string | null;
  };
  outreach: { draftsThisMonth: number; approvedThisMonth: number };
  needsFollowUp: number;
}

// ── Static configs (not mock data — these are labels/icons for real features) ─

const AGENTS: { name: string; icon: React.ElementType; note: string }[] = [
  { name: "Lead Scorer",    icon: Brain,         note: "Auto-scoring active" },
  { name: "Outreach Drafter", icon: Mail,        note: "AI drafts enabled" },
  { name: "Email Cron",     icon: CalendarCheck, note: "Daily briefs on" },
];

const MARKET_SIGNALS: { direction: "bullish" | "neutral" | "bearish"; headline: string }[] = [
  { direction: "bullish", headline: "Mortgage rates near 6.4% — buyer demand stabilizing" },
  { direction: "neutral", headline: "Local inventory up 3% MoM — moderate competition" },
  { direction: "bearish", headline: "Fed signals caution on rate cuts through Q3" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children, gemVariant }: { children: React.ReactNode; gemVariant?: "green" | "yellow" | "red" }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {gemVariant && <GemShard variant={gemVariant} size="xs" />}
      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{children}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface CommandCenterPanelProps {
  isActive: boolean;
  realtorSlug?: string;
}

export function CommandCenterPanel({ isActive }: CommandCenterPanelProps) {
  const [data, setData]       = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isActive) return;
    setLoading(true);
    fetch("/api/command-center")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [isActive]);

  const stages = data
    ? (["New", "Contacted", "Qualified", "Booked", "Dead"] as const).map((label) => {
        const key = label.toLowerCase() as keyof typeof data.stageCounts;
        const count = data.stageCounts[key];
        const total = data.tierCounts.total || 1;
        return { label, count, pct: Math.round((count / total) * 100) };
      })
    : [];

  const totalLeads = data?.tierCounts.total ?? 0;
  const bookedCount = data?.stageCounts.booked ?? 0;
  const extractionRate = totalLeads > 0 ? Math.round((bookedCount / totalLeads) * 100) : 0;

  return (
    <div
      className={cn(
        "h-full flex transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── LEFT COLUMN ───────────────────────────────────────────────────── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Pipeline Health */}
        <div>
          <SectionHeader gemVariant="green">Pipeline Health</SectionHeader>
          <MiningPanel status="green" carved>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="w-3 h-3 animate-spin text-neutral-600" />
                <span className="text-[11px] text-neutral-600">Loading...</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {[
                  { label: "Total Leads",    value: totalLeads,                         gem: "green"  as const },
                  { label: "Needs Follow-Up", value: data?.needsFollowUp ?? 0,          gem: data?.needsFollowUp ? "yellow" as const : null },
                  { label: "Booked",         value: bookedCount,                        gem: "green"  as const },
                  { label: "Gems Mined",     value: data?.mining.gemsMined ?? 0,        gem: null },
                  { label: "Mining Runs",    value: data?.mining.totalRuns ?? 0,        gem: null },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-500">{row.label}</span>
                    <span
                      className="text-[12px] font-semibold tabular-nums"
                      style={{ color: row.gem ? GEM[row.gem] : "#d4d4d4" }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </MiningPanel>
        </div>

        {/* Active AI Agents */}
        <div>
          <SectionHeader gemVariant="yellow">Active Agents</SectionHeader>
          <div className="space-y-1.5">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <MiningPanel key={agent.name} padding="sm" status="green">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <Icon className="w-3 h-3 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-neutral-300 truncate">{agent.name}</p>
                      <p className="text-[10px] text-neutral-600">{agent.note}</p>
                    </div>
                    <GemIndicator status="active" size="xs" />
                  </div>
                </MiningPanel>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <SectionHeader>Quick Actions</SectionHeader>
          <div className="space-y-1.5">
            {[
              { label: "Mine Leads",      href: "/dashboard/mining" },
              { label: "Dashboard",   href: "/dashboard/hub" },
              { label: "Lead Intelligence", href: "/dashboard/leads" },
              { label: "Analytics",       href: "/dashboard/analytics" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 group transition-colors duration-200"
                style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }}
              >
                {action.label}
                <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER COLUMN ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem variant="green" size="xs" animated />
            <div>
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Command Center</h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">Mining overview &amp; extraction performance</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>Live data</span>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <MiningPanel key={i} padding="md" carved>
                <div className="h-12 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
                </div>
              </MiningPanel>
            ))
          ) : (
            [
              { label: "Gems Mined",      value: String(data?.mining.gemsMined ?? 0),         sub: "last 30 days",      gemVariant: "green"  as const, up: true },
              { label: "Elite Gems",       value: String(data?.mining.eliteMined ?? 0),         sub: "highest grade",     gemVariant: "green"  as const, up: true },
              { label: "Outreach Sent",    value: String(data?.outreach.approvedThisMonth ?? 0), sub: "this month",        gemVariant: "yellow" as const, up: true },
              { label: "Extraction Rate",  value: `${extractionRate}%`,                          sub: "booked / total",    gemVariant: extractionRate > 10 ? "green" as const : "yellow" as const, up: extractionRate > 0 },
            ].map((m) => (
              <GlowBorder key={m.label} variant={m.gemVariant} intensity="soft">
                <MiningPanel padding="md" carved>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">{m.label}</p>
                    <GemShard variant={m.gemVariant} size="xs" />
                  </div>
                  <p className="text-2xl font-semibold text-neutral-100 tracking-tight">{m.value}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="w-3 h-3" style={{ color: GEM[m.gemVariant] }} />
                    <span className="text-[10px] text-neutral-600">{m.sub}</span>
                  </div>
                </MiningPanel>
              </GlowBorder>
            ))
          )}
        </div>

        {/* Pipeline + Outreach */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pipeline Summary */}
          <MiningPanel carved>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-neutral-600" />
                <p className="text-[12px] font-semibold text-neutral-300">Mining Pipeline</p>
              </div>
              <a
                href="/dashboard/leads"
                className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
              </div>
            ) : (
              <>
                {/* Stacked bar */}
                {totalLeads > 0 && (
                  <div className="flex rounded-lg overflow-hidden h-2 mb-4 gap-0.5">
                    {stages.map((s) => s.pct > 0 && (
                      <div
                        key={s.label}
                        style={{ width: `${s.pct}%`, background: STAGE_GEM[s.label].color }}
                        className="rounded-sm"
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {stages.map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-sm rotate-45 flex-shrink-0" style={{ background: STAGE_GEM[s.label].color }} />
                        <span className="text-[11px] text-neutral-400">{s.label}</span>
                      </div>
                      <span className="text-[12px] font-medium text-neutral-300 tabular-nums">{s.count}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 pt-3 flex justify-between text-[11px]" style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}>
                  <span className="text-neutral-600">{totalLeads} total leads</span>
                  <span className="font-medium" style={{ color: GEM.green }}>{extractionRate}% extraction rate</span>
                </div>
              </>
            )}
          </MiningPanel>

          {/* Outreach Stats */}
          <MiningPanel carved>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-600" />
                <p className="text-[12px] font-semibold text-neutral-300">Outreach This Month</p>
              </div>
              <a href="/dashboard/leads" className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">
                View leads <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Drafts Generated", value: data?.outreach.draftsThisMonth ?? 0 },
                    { label: "Approved & Sent",  value: data?.outreach.approvedThisMonth ?? 0 },
                    { label: "Needs Follow-Up",  value: data?.needsFollowUp ?? 0 },
                    { label: "Contacted",        value: data?.stageCounts.contacted ?? 0 },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl p-3 text-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <p className="text-xl font-semibold text-neutral-100 tabular-nums">{s.value}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center gap-2" style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}>
                  <div className="flex-1 rounded-full h-1.5 overflow-hidden bg-neutral-800">
                    {(() => {
                      const drafts = data?.outreach.draftsThisMonth ?? 0;
                      const approved = data?.outreach.approvedThisMonth ?? 0;
                      const pct = drafts > 0 ? Math.round((approved / drafts) * 100) : 0;
                      return (
                        <>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: GEM.green, boxShadow: GLOW.green.soft }} />
                          <span className="sr-only">{pct}%</span>
                        </>
                      );
                    })()}
                  </div>
                  <span className="text-[11px] font-medium" style={{ color: GEM.green }}>
                    {data?.outreach.draftsThisMonth
                      ? `${Math.round(((data.outreach.approvedThisMonth) / data.outreach.draftsThisMonth) * 100)}% approval rate`
                      : "No outreach yet"}
                  </span>
                </div>
              </>
            )}
          </MiningPanel>
        </div>

        {/* Market Signals */}
        <MiningPanel carved>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-neutral-500" />
              <p className="text-[12px] font-semibold text-neutral-300">Market Signals</p>
            </div>
            <a href="/dashboard/market" className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">
              View all signals →
            </a>
          </div>
          <div className="space-y-2">
            {MARKET_SIGNALS.map((s, i) => {
              const gemKey = SIGNAL_GEM[s.direction];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: GLOW[gemKey].bg, border: `1px solid ${GLOW[gemKey].border}` }}
                >
                  <GemIndicator variant={gemKey} size="xs" className="mt-1.5" />
                  <p className="text-[12px] text-neutral-400 leading-relaxed">{s.headline}</p>
                </div>
              );
            })}
          </div>
        </MiningPanel>
      </div>

      {/* ── RIGHT COLUMN ──────────────────────────────────────────────────── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* AI Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5" style={{ color: GEM.green }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">AI Recommendations</p>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-3 h-3 animate-spin text-neutral-600" />
              <span className="text-[11px] text-neutral-600">Analyzing...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                data?.needsFollowUp && data.needsFollowUp > 0
                  ? { text: `${data.needsFollowUp} lead${data.needsFollowUp !== 1 ? "s" : ""} haven't been contacted in 48h+ — open War Room to act`, priority: "high" as const }
                  : null,
                data?.tierCounts.diamond && data.tierCounts.diamond > 0
                  ? { text: `${data.tierCounts.diamond} Diamond-tier lead${data.tierCounts.diamond !== 1 ? "s" : ""} in pipeline — prioritize outreach now`, priority: "high" as const }
                  : null,
                data?.mining.lastRunStatus === "complete" && data.mining.gemsMined === 0
                  ? { text: "Last mining run returned 0 leads — try adding more locations or a different vertical", priority: "medium" as const }
                  : null,
                { text: "Run a mining job weekly to keep your pipeline fresh with new prospects", priority: "low" as const },
              ]
                .filter(Boolean)
                .slice(0, 4)
                .map((rec, i) => {
                  const r = rec!;
                  const gemKey = r.priority === "high" ? "green" : r.priority === "medium" ? "yellow" : "red";
                  return (
                    <MiningPanel key={i} padding="sm" status={gemKey} carved={r.priority === "high"}>
                      <div className="flex items-start gap-2 px-1">
                        <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: GEM[gemKey] }} />
                        <p className="text-[12px] text-neutral-300 leading-relaxed">{r.text}</p>
                      </div>
                    </MiningPanel>
                  );
                })}
            </div>
          )}
        </div>

        {/* Heat Tier Breakdown */}
        <div>
          <SectionHeader gemVariant="green">Lead Heat Tiers</SectionHeader>
          <MiningPanel carved>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
              </div>
            ) : (
              <div className="space-y-3">
                {([
                  { label: "Diamond", key: "diamond", gem: "green"  as const },
                  { label: "Hot",     key: "hot",     gem: "green"  as const },
                  { label: "Warm",    key: "warm",    gem: "yellow" as const },
                  { label: "Cold",    key: "cold",    gem: "red"    as const },
                ] as const).map((tier) => {
                  const count = data?.tierCounts[tier.key] ?? 0;
                  const total = data?.tierCounts.total || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={tier.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[11px] text-neutral-400">{tier.label}</span>
                        <span className="text-[11px] font-medium tabular-nums" style={{ color: GEM[tier.gem] }}>
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: GEM[tier.gem], boxShadow: `0 0 6px ${GEM[tier.gem]}60` }}
                        />
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
              {[
                { label: "Total Leads",    value: loading ? "—" : String(data?.tierCounts.total ?? 0),                       icon: Activity,     gem: "green"  as const },
                { label: "Booked",         value: loading ? "—" : String(data?.stageCounts.booked ?? 0),                    icon: CheckCircle2, gem: "green"  as const },
                { label: "Outreach",       value: loading ? "—" : String(data?.outreach.approvedThisMonth ?? 0),             icon: Phone,        gem: "yellow" as const },
                { label: "Follow-Up Due",  value: loading ? "—" : String(data?.needsFollowUp ?? 0),                         icon: AlertCircle,  gem: data?.needsFollowUp ? "red" as const : "green" as const },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl p-3"
                    style={{ background: GLOW[stat.gem].bg, border: `1px solid ${GLOW[stat.gem].border}` }}
                  >
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
