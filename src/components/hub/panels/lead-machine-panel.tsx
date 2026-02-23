"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  Mail,
  Search,
  Brain,
  Zap,
  Clock,
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Activity,
  Target,
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

const stageBreakdown = [
  { stage: "New",       count: 24, pct: 34 },
  { stage: "Contacted", count: 18, pct: 26 },
  { stage: "Qualified", count: 11, pct: 16 },
  { stage: "Booked",    count: 8,  pct: 11 },
  { stage: "Dead",      count: 9,  pct: 13 },
];

const leadSources = [
  { source: "Zillow",   count: 34 },
  { source: "Website",  count: 18 },
  { source: "Referral", count: 12 },
  { source: "Social",   count: 6  },
];

const leads = [
  { id: "1", name: "Maya Torres",   score: 91, stage: "qualified", source: "Zillow",   intent: "buyer",    lastContact: "2h ago",  phone: "555-0181", aiFlag: true  },
  { id: "2", name: "James Rivera",  score: 84, stage: "booked",    source: "Website",  intent: "buyer",    lastContact: "5h ago",  phone: "555-0234", aiFlag: false },
  { id: "3", name: "Lena Okafor",   score: 77, stage: "contacted", source: "Referral", intent: "seller",   lastContact: "1d ago",  phone: "555-0319", aiFlag: true  },
  { id: "4", name: "Derek Chang",   score: 68, stage: "new",       source: "Zillow",   intent: "buyer",    lastContact: "3d ago",  phone: "555-0402", aiFlag: true  },
  { id: "5", name: "Sofia Mendez",  score: 72, stage: "contacted", source: "Social",   intent: "investor", lastContact: "2d ago",  phone: "555-0551", aiFlag: false },
  { id: "6", name: "Nathan Brooks", score: 55, stage: "new",       source: "Website",  intent: "unknown",  lastContact: "4d ago",  phone: "555-0644", aiFlag: false },
  { id: "7", name: "Aisha Patel",   score: 88, stage: "qualified", source: "Zillow",   intent: "buyer",    lastContact: "6h ago",  phone: "555-0718", aiFlag: true  },
];

const followUpQueue = [
  { name: "Derek Chang",   action: "SMS follow-up",       due: "Overdue",  urgency: "high"   },
  { name: "Nathan Brooks", action: "Initial call",         due: "Today",    urgency: "high"   },
  { name: "Sofia Mendez",  action: "Email drip day 3",     due: "Today",    urgency: "medium" },
  { name: "Lena Okafor",   action: "Qualification call",   due: "Tomorrow", urgency: "low"    },
];

const aiScoreFeed = [
  { name: "Maya Torres",  score: 91, delta: "+8", reason: "Re-engaged — high purchase intent" },
  { name: "Aisha Patel",  score: 88, delta: "+5", reason: "Asked about mortgage rates" },
  { name: "James Rivera", score: 84, delta: "+2", reason: "Confirmed appointment" },
];

const agentStatus = [
  { name: "Voice Agent Alpha", status: "calling", target: "Derek Chang" },
  { name: "SMS Agent Beta",    status: "idle",    target: null },
  { name: "Booking Agent",     status: "active",  target: "Sequence running" },
];

// ── Stage → gem color (lowercase keys from lead objects) ──────────────────────

const stageGem: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",       color: "#3A3A3A",    bg: "rgba(58,58,58,0.15)"  },
  contacted: { label: "Contacted", color: GEM.yellow,   bg: GLOW.yellow.bg         },
  qualified: { label: "Qualified", color: "#00BB60",    bg: "rgba(0,187,96,0.1)"   },
  booked:    { label: "Booked",    color: GEM.green,    bg: GLOW.green.bg          },
  dead:      { label: "Dead",      color: GEM.red,      bg: GLOW.red.bg            },
};

// Stage color for filter bar (stageBreakdown uses capitalized names)
const stageBarColor: Record<string, string> = {
  New:       "#3A3A3A",
  Contacted: GEM.yellow,
  Qualified: "#00BB60",
  Booked:    GEM.green,
  Dead:      GEM.red,
};

// ── Intent → color ────────────────────────────────────────────────────────────

const intentColor: Record<string, string> = {
  buyer:    GEM.green,
  seller:   GEM.yellow,
  investor: GEM.green,
  unknown:  "#525252",
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

interface LeadMachinePanelProps {
  isActive: boolean;
  realtorSlug?: string;
}

export function LeadMachinePanel({ isActive }: LeadMachinePanelProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads.filter((lead) => {
    const stageMatch = !selectedStage || lead.stage === selectedStage;
    const searchMatch =
      !searchQuery || lead.name.toLowerCase().includes(searchQuery.toLowerCase());
    return stageMatch && searchMatch;
  });

  return (
    <div
      className={cn(
        "h-full flex transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── LEFT COLUMN — Pipeline Filters ────────────────────────────── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Pipeline Stages */}
        <div>
          <SectionHeader gemVariant="yellow">Pipeline Stages</SectionHeader>
          <div className="space-y-1">
            {/* All Leads button */}
            <button
              onClick={() => setSelectedStage(null)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-colors",
                !selectedStage ? "text-white" : "text-neutral-500 hover:text-neutral-300"
              )}
              style={
                !selectedStage
                  ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }
                  : { background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }
              }
            >
              <span>All Leads</span>
              <span className="text-[11px] font-semibold tabular-nums text-neutral-400">
                {leads.length}
              </span>
            </button>

            {stageBreakdown.map((s) => {
              const color = stageBarColor[s.stage];
              const isActive = selectedStage === s.stage.toLowerCase();
              return (
                <button
                  key={s.stage}
                  onClick={() =>
                    setSelectedStage(isActive ? null : s.stage.toLowerCase())
                  }
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all",
                    isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                  )}
                  style={
                    isActive
                      ? { background: `${color}18`, border: `1px solid ${color}35` }
                      : { background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-sm rotate-45 flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span>{s.stage}</span>
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums text-neutral-400">
                    {s.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mini stage bar */}
          <div className="flex rounded-lg overflow-hidden h-1.5 gap-0.5 mt-3">
            {stageBreakdown.map((s) => (
              <div
                key={s.stage}
                className="rounded-sm"
                style={{ width: `${s.pct}%`, background: stageBarColor[s.stage] }}
              />
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div>
          <SectionHeader>Lead Sources</SectionHeader>
          <div className="space-y-2">
            {leadSources.map((src) => (
              <MiningPanel key={src.source} padding="sm">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-neutral-400">{src.source}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(src.count / 34) * 100}%`,
                          background: GEM.green,
                          boxShadow: GLOW.green.soft,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-400 tabular-nums w-4 text-right">
                      {src.count}
                    </span>
                  </div>
                </div>
              </MiningPanel>
            ))}
          </div>
        </div>

        {/* Follow-up Queue */}
        <div>
          <SectionHeader gemVariant="red">Follow-up Queue</SectionHeader>
          <div className="space-y-1.5">
            {followUpQueue.map((item) => {
              const urgencyGem =
                item.urgency === "high" ? "red" : item.urgency === "medium" ? "yellow" : null;
              return (
                <MiningPanel
                  key={item.name}
                  padding="sm"
                  status={urgencyGem ?? undefined}
                  carved={item.urgency === "high"}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium text-neutral-300">{item.name}</p>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{item.action}</p>
                    </div>
                    <span
                      className="text-[10px] font-semibold shrink-0 mt-0.5"
                      style={{
                        color:
                          item.urgency === "high"
                            ? GEM.red
                            : item.urgency === "medium"
                            ? GEM.yellow
                            : "#525252",
                      }}
                    >
                      {item.due}
                    </span>
                  </div>
                </MiningPanel>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CENTER COLUMN — Lead Pipeline ────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gem variant="green" size="xs" animated />
            <div>
              <h2 className="text-base font-semibold text-neutral-100 tracking-tight">
                Lead Machine
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                AI-powered mining pipeline &amp; follow-up
              </p>
            </div>
          </div>
          <a
            href="/dashboard/pipeline"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 transition-colors"
            style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
          >
            Full Pipeline <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
          style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
        >
          <Search className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-neutral-300 placeholder-neutral-600 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[10px] text-neutral-600 hover:text-neutral-400"
            >
              Clear
            </button>
          )}
        </div>

        {/* Lead Table */}
        <div
          className="rounded-2xl overflow-hidden flex-1"
          style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
        >
          {/* Table header */}
          <div
            className="grid gap-3 px-4 py-2.5 text-[10px] font-semibold text-neutral-600 uppercase tracking-widest"
            style={{
              gridTemplateColumns: "1fr 70px 90px 80px 100px 110px",
              borderBottom: `1px solid ${CAVE.stoneMid}`,
            }}
          >
            <span>Lead</span>
            <span>Score</span>
            <span>Stage</span>
            <span>Intent</span>
            <span>Last Contact</span>
            <span>Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y" style={{ borderColor: CAVE.stoneMid }}>
            {filteredLeads.map((lead) => {
              const stage = stageGem[lead.stage];
              const scoreGem = scoreToGem(lead.score);
              return (
                <div
                  key={lead.id}
                  className="grid items-center gap-3 px-4 py-3 transition-colors group"
                  style={{
                    gridTemplateColumns: "1fr 70px 90px 80px 100px 110px",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
                >
                  {/* Name + AI flag */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold text-neutral-300 flex-shrink-0"
                      style={{ background: "rgba(255,255,255,0.05)" }}
                    >
                      {lead.name[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[12px] font-medium text-neutral-200 truncate">
                          {lead.name}
                        </p>
                        {lead.aiFlag && (
                          <Zap
                            className="w-2.5 h-2.5 flex-shrink-0"
                            style={{ color: GEM.green }}
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-600">{lead.source}</p>
                    </div>
                  </div>

                  {/* Score */}
                  <div>
                    <span
                      className="text-[12px] font-semibold tabular-nums px-1.5 py-0.5 rounded-lg"
                      style={{
                        color: GEM[scoreGem],
                        background: GLOW[scoreGem].bg,
                      }}
                    >
                      {lead.score}
                    </span>
                  </div>

                  {/* Stage badge */}
                  <div>
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
                      style={{ color: stage.color, background: stage.bg }}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {/* Intent */}
                  <div>
                    <span
                      className="text-[11px] capitalize"
                      style={{ color: intentColor[lead.intent] }}
                    >
                      {lead.intent}
                    </span>
                  </div>

                  {/* Last contact */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-700" />
                    <span className="text-[11px] text-neutral-500">{lead.lastContact}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      style={{ ["&:hover" as string]: {} }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = GLOW.green.bg)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                      title="Call"
                    >
                      <Phone className="w-3 h-3" style={{ color: GEM.green }} />
                    </button>
                    <button
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = GLOW.yellow.bg)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                      title="SMS"
                    >
                      <MessageSquare className="w-3 h-3" style={{ color: GEM.yellow }} />
                    </button>
                    <button
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}
                      title="Email"
                    >
                      <Mail className="w-3 h-3 text-neutral-500" />
                    </button>
                    <a
                      href={`/dashboard/pipeline/${lead.id}`}
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                      <ChevronRight className="w-3 h-3 text-neutral-500" />
                    </a>
                  </div>
                </div>
              );
            })}

            {filteredLeads.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-[12px] text-neutral-600">No leads match your filter</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN — AI Controls ───────────────────────────────── */}
      <div
        className="w-72 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* AI Scoring Engine */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-3.5 h-3.5" style={{ color: GEM.green }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              AI Scoring Engine
            </p>
          </div>
          <div className="space-y-2">
            {aiScoreFeed.map((lead) => {
              const gemKey = scoreToGem(lead.score);
              return (
                <GlowBorder key={lead.name} variant={gemKey} intensity="soft">
                  <MiningPanel padding="sm" carved>
                    <div className="flex items-center justify-between mb-1 px-0.5">
                      <p className="text-[12px] font-medium text-neutral-200">{lead.name}</p>
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[13px] font-semibold tabular-nums"
                          style={{ color: GEM[gemKey] }}
                        >
                          {lead.score}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: `${GEM[gemKey]}99` }}
                        >
                          {lead.delta}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500 px-0.5">{lead.reason}</p>
                  </MiningPanel>
                </GlowBorder>
              );
            })}
          </div>
        </div>

        {/* AI Agent Status */}
        <div>
          <SectionHeader gemVariant="green">AI Miner Status</SectionHeader>
          <div className="space-y-1.5">
            {agentStatus.map((agent) => {
              const gemKey =
                agent.status === "calling" || agent.status === "active" ? "green" : "yellow";
              return (
                <MiningPanel key={agent.name} padding="sm" status={gemKey}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-neutral-300">{agent.name}</p>
                      {agent.target && (
                        <p className="text-[10px] text-neutral-600 mt-0.5">{agent.target}</p>
                      )}
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize"
                      style={{
                        color: GEM[gemKey],
                        background: GLOW[gemKey].bg,
                      }}
                    >
                      {agent.status}
                    </span>
                  </div>
                </MiningPanel>
              );
            })}
          </div>
        </div>

        {/* Next Best Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5" style={{ color: GEM.yellow }} />
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
              Next Best Actions
            </p>
          </div>
          <MiningPanel carved gemAccent="green" gemPosition="bottom-right">
            <div className="space-y-3">
              {[
                { icon: Phone,      text: "Call Maya Torres — scored 91, hasn't spoken with agent", gem: "green"  as const },
                { icon: MessageSquare, text: "Send SMS to 4 stale leads from Zillow",              gem: "yellow" as const },
                { icon: RefreshCw,  text: "Re-run email sequence for unresponsive contacts",       gem: "yellow" as const },
                { icon: Activity,   text: "Review 3 leads that dropped score > 10 pts",            gem: "red"    as const },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <Icon
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      style={{ color: GEM[action.gem] }}
                    />
                    <p className="text-[11px] text-neutral-400 leading-relaxed">{action.text}</p>
                  </div>
                );
              })}
            </div>
          </MiningPanel>
        </div>

        {/* Engagement This Week */}
        <div>
          <SectionHeader gemVariant="yellow">Engagement This Week</SectionHeader>
          <MiningPanel carved>
            <div className="space-y-3">
              {[
                { label: "Calls Made",  value: 47,  max: 60  },
                { label: "SMS Sent",    value: 112, max: 150 },
                { label: "Emails Out",  value: 88,  max: 100 },
                { label: "Responses",   value: 31,  max: 112 },
              ].map((item) => {
                const pct = Math.round((item.value / item.max) * 100);
                const barColor = PERF_COLOR(pct);
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-neutral-400">{item.label}</span>
                      <span className="text-[11px] font-medium text-neutral-300 tabular-nums">
                        {item.value}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: barColor,
                          boxShadow: `0 0 6px ${barColor}55`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </MiningPanel>
        </div>

        {/* Conversion Funnel */}
        <div>
          <SectionHeader>Conversion Funnel</SectionHeader>
          <MiningPanel carved gemAccent="green" gemPosition="top-right">
            <div className="space-y-2">
              {[
                { from: "Leads In",  to: "Contacted", rate: "74%" },
                { from: "Contacted", to: "Qualified",  rate: "61%" },
                { from: "Qualified", to: "Booked",     rate: "73%" },
                { from: "Booked",    to: "Closed",     rate: "88%" },
              ].map((step) => {
                const rateNum = parseInt(step.rate);
                const rateColor = rateNum >= 70 ? GEM.green : GEM.yellow;
                return (
                  <div key={step.from} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-neutral-500">{step.from}</span>
                      <ChevronRight className="w-2.5 h-2.5 text-neutral-700" />
                      <span className="text-[11px] text-neutral-400">{step.to}</span>
                    </div>
                    <span
                      className="text-[11px] font-semibold tabular-nums"
                      style={{ color: rateColor }}
                    >
                      {step.rate}
                    </span>
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
