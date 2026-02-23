"use client";

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
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BarChart3,
  Newspaper,
} from "lucide-react";
import {
  GEM,
  GLOW,
  CAVE,
  STAGE_GEM,
  SIGNAL_GEM,
  PERF_COLOR,
  scoreToGem,
  type StatusLevel,
} from "@/lib/cave-theme";
import { GemIndicator } from "@/components/ui/gem-indicator";
import { MiningPanel, GlowBorder } from "@/components/ui/mining-panel";
import { EmbeddedGem, GemShard } from "@/components/ui/embedded-gem";
import { Gem } from "@/components/ui/gem";

// ── Mock data (placeholder — replace with API calls) ──────────────────────────

const systemStatus = {
  agentsActive: 3,
  automationRuns: 124,
  activeCallsNow: 2,
  queueLength: 11,
  uptime: "99.8%",
};

const automations: {
  name: string;
  status: StatusLevel;
  runs: number;
  icon: React.ElementType;
}[] = [
  { name: "Voice Follow-up", status: "active", runs: 42, icon: Phone },
  { name: "SMS Sequence",    status: "active", runs: 38, icon: MessageSquare },
  { name: "Email Drip",      status: "active", runs: 29, icon: Mail },
  { name: "Lead Scorer",     status: "active", runs: 15, icon: Brain },
  { name: "Booking Agent",   status: "paused", runs: 0,  icon: CalendarCheck },
];

const metrics = [
  { label: "Gems Mined",           value: "248", change: 12,  sub: "last 30 days",  gemVariant: "green"  as const },
  { label: "Appointments Booked",  value: "31",  change: 8,   sub: "last 30 days",  gemVariant: "green"  as const },
  { label: "Est. Commission",      value: "$186K", change: 15, sub: "pipeline value", gemVariant: "green" as const },
  { label: "Extraction Rate",      value: "78%", change: 3,   sub: "vs. 75% last mo.", gemVariant: "yellow" as const },
];

const pipelineStages: { label: keyof typeof STAGE_GEM; count: number; pct: number }[] = [
  { label: "New",       count: 24, pct: 34 },
  { label: "Contacted", count: 18, pct: 26 },
  { label: "Qualified", count: 11, pct: 16 },
  { label: "Booked",    count: 8,  pct: 11 },
  { label: "Dead",      count: 9,  pct: 13 },
];

const callingStats = [
  { label: "Calls Today",   value: "14" },
  { label: "Conversations", value: "9"  },
  { label: "Voicemails",    value: "3"  },
  { label: "Appts Set",     value: "2"  },
];

const aiRecommendations = [
  {
    text: "4 leads haven't been followed up in 3+ days — trigger SMS sequence now",
    priority: "high" as const,
  },
  {
    text: "Tuesday morning calls convert 2.3× better — optimize your schedule",
    priority: "medium" as const,
  },
  {
    text: "Lead Maya Torres scored 91 — escalate to direct call immediately",
    priority: "high" as const,
  },
  {
    text: "Zillow leads this week show higher buyer intent than last month",
    priority: "low" as const,
  },
];

const upcomingAppointments = [
  { name: "James Rivera", type: "Consultation",       time: "Today, 2:00 PM",    score: 84 },
  { name: "Priya Nair",   type: "Showing",            time: "Today, 4:30 PM",    score: 91 },
  { name: "Marcus Webb",  type: "Listing Presentation", time: "Tomorrow, 10:00 AM", score: 77 },
];

const marketSignals: { direction: "bullish" | "neutral" | "bearish"; headline: string }[] = [
  { direction: "bullish", headline: "Mortgage rates dip to 6.42% — buyer demand ticking up" },
  { direction: "neutral", headline: "Local inventory rose 4% MoM — competition moderate" },
  { direction: "bearish", headline: "Inflation report: Fed signals hold on rate cuts" },
];

const performanceBars = [
  { label: "Voice Agent",   pct: 82 },
  { label: "SMS Sequence",  pct: 74 },
  { label: "Email Drip",    pct: 61 },
  { label: "Booking Agent", pct: 91 },
];

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

interface CommandCenterPanelProps {
  isActive: boolean;
  realtorSlug?: string;
}

export function CommandCenterPanel({ isActive }: CommandCenterPanelProps) {
  return (
    <div
      className={cn(
        "h-full flex transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── LEFT COLUMN — System Status ───────────────────────────────── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* System Status */}
        <div>
          <SectionHeader gemVariant="green">System Status</SectionHeader>
          <MiningPanel status="green" carved gemAccent="green" gemPosition="top-right">
            <div className="space-y-2.5">
              {[
                { label: "Active Miners", value: systemStatus.agentsActive,    gem: "green"  as const },
                { label: "Runs Today",    value: systemStatus.automationRuns,   gem: null },
                { label: "Live Calls",    value: systemStatus.activeCallsNow,   gem: "yellow" as const },
                { label: "Queue",         value: systemStatus.queueLength,      gem: null },
                { label: "Uptime",        value: systemStatus.uptime,           gem: "green"  as const },
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
          </MiningPanel>
        </div>

        {/* Automation Health */}
        <div>
          <SectionHeader gemVariant="yellow">Mining Rigs</SectionHeader>
          <div className="space-y-1.5">
            {automations.map((auto) => {
              const Icon = auto.icon;
              return (
                <MiningPanel
                  key={auto.name}
                  padding="sm"
                  status={auto.status === "active" ? "green" : "yellow"}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      <Icon className="w-3 h-3 text-neutral-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-neutral-300 truncate">
                        {auto.name}
                      </p>
                      <p className="text-[10px] text-neutral-600">
                        {auto.status === "active" ? `${auto.runs} runs` : "Paused"}
                      </p>
                    </div>
                    <GemIndicator status={auto.status} size="xs" />
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
              { label: "Add Lead",        href: "/dashboard/leads" },
              { label: "Start Campaign",  href: "/dashboard/automations" },
              { label: "View Pipeline",   href: "/dashboard/pipeline" },
              { label: "Analytics",       href: "/dashboard/analytics" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 group transition-colors duration-200"
                style={{
                  background: CAVE.surface2,
                  border: `1px solid ${CAVE.stoneMid}`,
                }}
              >
                {action.label}
                <ChevronRight className="w-3 h-3 text-neutral-700 group-hover:text-neutral-400 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── CENTER COLUMN — Primary Workspace ────────────────────────── */}
      <div className="flex-1 flex flex-col gap-5 p-5 overflow-y-auto min-w-0">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem variant="green" size="xs" animated />
            <div>
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                Command Center
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Mining overview &amp; extraction performance
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Clock className="w-3 h-3" />
            <span>Updated just now</span>
          </div>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <GlowBorder key={m.label} variant={m.gemVariant} intensity="soft">
              <MiningPanel padding="md" carved>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                    {m.label}
                  </p>
                  <GemShard variant={m.gemVariant} size="xs" />
                </div>
                <p className="text-2xl font-semibold text-neutral-100 tracking-tight">
                  {m.value}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  {m.change > 0 ? (
                    <TrendingUp className="w-3 h-3" style={{ color: GEM.green }} />
                  ) : (
                    <TrendingDown className="w-3 h-3" style={{ color: GEM.red }} />
                  )}
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: m.change > 0 ? GEM.green : GEM.red }}
                  >
                    {m.change > 0 ? "+" : ""}{m.change}%
                  </span>
                  <span className="text-[10px] text-neutral-600">{m.sub}</span>
                </div>
              </MiningPanel>
            </GlowBorder>
          ))}
        </div>

        {/* Pipeline + Calling Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pipeline Summary */}
          <MiningPanel carved gemAccent="yellow" gemPosition="bottom-right">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-neutral-600" />
                <p className="text-[12px] font-semibold text-neutral-300">Mining Pipeline</p>
              </div>
              <a
                href="/dashboard/pipeline"
                className="flex items-center gap-1 text-[11px] text-neutral-600 transition-colors"
                style={{ ["--hover-color" as string]: GEM.green }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = GEM.green)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "")}
              >
                View all <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            {/* Stacked bar */}
            <div className="flex rounded-lg overflow-hidden h-2 mb-4 gap-0.5">
              {pipelineStages.map((s) => (
                <div
                  key={s.label}
                  style={{ width: `${s.pct}%`, background: STAGE_GEM[s.label].color }}
                  className="rounded-sm"
                />
              ))}
            </div>

            <div className="space-y-2">
              {pipelineStages.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-sm rotate-45 flex-shrink-0"
                      style={{ background: STAGE_GEM[s.label].color }}
                    />
                    <span className="text-[11px] text-neutral-400">{s.label}</span>
                  </div>
                  <span className="text-[12px] font-medium text-neutral-300 tabular-nums">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-3 pt-3 flex justify-between text-[11px]"
              style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}
            >
              <span className="text-neutral-600">70 total leads</span>
              <span className="font-medium" style={{ color: GEM.green }}>
                11.4% extraction rate
              </span>
            </div>
          </MiningPanel>

          {/* Calling Stats */}
          <MiningPanel carved>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-neutral-600" />
                <p className="text-[12px] font-semibold text-neutral-300">Today&apos;s Calls</p>
              </div>
              <a
                href="/dashboard/calling"
                className="flex items-center gap-1 text-[11px] text-neutral-600"
              >
                View log <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {callingStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-3 text-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${CAVE.stoneMid}`,
                  }}
                >
                  <p className="text-xl font-semibold text-neutral-100 tabular-nums">{s.value}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            <div
              className="pt-3 flex items-center gap-2"
              style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}
            >
              <div className="flex-1 rounded-full h-1.5 overflow-hidden bg-neutral-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: "64%", background: GEM.green, boxShadow: GLOW.green.soft }}
                />
              </div>
              <span
                className="text-[11px] font-medium"
                style={{ color: GEM.green }}
              >
                64% contact rate
              </span>
            </div>
          </MiningPanel>
        </div>

        {/* Market Intelligence Feed */}
        <MiningPanel carved gemAccent="yellow" gemPosition="top-right">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-neutral-500" />
              <p className="text-[12px] font-semibold text-neutral-300">Market Signals</p>
            </div>
            <a
              href="/dashboard/market"
              className="text-[11px] text-neutral-600"
            >
              View all signals →
            </a>
          </div>
          <div className="space-y-2">
            {marketSignals.map((s, i) => {
              const gemKey = SIGNAL_GEM[s.direction];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: GLOW[gemKey].bg,
                    border: `1px solid ${GLOW[gemKey].border}`,
                  }}
                >
                  <GemIndicator variant={gemKey} size="xs" className="mt-1.5" />
                  <p className="text-[12px] text-neutral-400 leading-relaxed">{s.headline}</p>
                </div>
              );
            })}
          </div>
        </MiningPanel>
      </div>

      {/* ── RIGHT COLUMN — AI Insights ────────────────────────────────── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* AI Recommendations */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5" style={{ color: GEM.green }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              AI Recommendations
            </p>
          </div>
          <div className="space-y-2">
            {aiRecommendations.map((rec, i) => {
              const gemKey =
                rec.priority === "high" ? "green" : rec.priority === "medium" ? "yellow" : "red";
              return (
                <MiningPanel
                  key={i}
                  padding="sm"
                  status={gemKey}
                  carved={rec.priority === "high"}
                >
                  <div className="flex items-start gap-2 px-1">
                    <Zap
                      className="w-3 h-3 mt-0.5 flex-shrink-0"
                      style={{ color: GEM[gemKey] }}
                    />
                    <p className="text-[12px] text-neutral-300 leading-relaxed">{rec.text}</p>
                  </div>
                </MiningPanel>
              );
            })}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionHeader gemVariant="green">Upcoming Appointments</SectionHeader>
            <a
              href="/dashboard/appointments"
              className="text-[10px] text-neutral-600"
            >
              View all
            </a>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.map((appt) => {
              const gemKey = scoreToGem(appt.score);
              return (
                <GlowBorder key={appt.name} variant={gemKey} intensity="soft">
                  <MiningPanel padding="sm" carved>
                    <div className="flex items-start justify-between px-0.5">
                      <div>
                        <p className="text-[12px] font-medium text-neutral-200">{appt.name}</p>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{appt.type}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3 text-neutral-600" />
                          <span className="text-[11px] text-neutral-500">{appt.time}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <GemIndicator variant={gemKey} size="sm" />
                        <span
                          className="text-[11px] font-bold tabular-nums"
                          style={{ color: GEM[gemKey] }}
                        >
                          {appt.score}
                        </span>
                        <p className="text-[9px] text-neutral-700">score</p>
                      </div>
                    </div>
                  </MiningPanel>
                </GlowBorder>
              );
            })}
          </div>
        </div>

        {/* 30-Day Performance */}
        <div>
          <SectionHeader gemVariant="yellow">30-Day Performance</SectionHeader>
          <MiningPanel carved>
            <div className="space-y-3">
              {performanceBars.map((item) => {
                const barColor = PERF_COLOR(item.pct);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[11px] text-neutral-400">{item.label}</span>
                      <span
                        className="text-[11px] font-medium tabular-nums"
                        style={{ color: barColor }}
                      >
                        {item.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${item.pct}%`,
                          background: barColor,
                          boxShadow: `0 0 6px ${barColor}60`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </MiningPanel>
        </div>

        {/* Automation Stats */}
        <div>
          <SectionHeader>Extraction Stats</SectionHeader>
          <MiningPanel carved gemAccent="green" gemPosition="bottom-left">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Runs",    value: "1,284", icon: Activity,     gem: "green"  as const },
                { label: "Success Rate",  value: "91%",   icon: CheckCircle2, gem: "green"  as const },
                { label: "Avg Response",  value: "4.2m",  icon: Clock,        gem: "yellow" as const },
                { label: "Errors",        value: "3",     icon: AlertCircle,  gem: "red"    as const },
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
                    <Icon
                      className="w-3 h-3 mb-1.5"
                      style={{ color: GEM[stat.gem] }}
                    />
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
