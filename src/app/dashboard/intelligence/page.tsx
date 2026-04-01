"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  Download,
  Gem,
  Flame,
  Zap,
  Globe,
  Phone,
  Mail,
  Pickaxe,
  ChevronDown,
  ExternalLink,
  Shield,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

type GemGrade = "elite" | "refined" | "rock" | "ungraded";
type Intent   = "hot" | "warm" | "cold" | "unknown";

interface EnrichmentData {
  emails?: string[];
  phones?: string[];
  socialLinks?: string[];
  hasContactPage?: boolean;
  title?: string;
  description?: string;
  keywords?: string[];
}

interface MinedLead {
  id: string;
  company_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  gem_grade: GemGrade;
  score: number;
  intent: Intent;
  source: string;
  source_url: string | null;
  enrichment_data: EnrichmentData;
  notes: string | null;
  created_at: string;
}

interface Stats {
  total: number;
  elite: number;
  refined: number;
  rock: number;
  hot: number;
  today: number;
}

// ── Grade config ─────────────────────────────────────────────────────────────

const GRADE: Record<GemGrade, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  elite:    { label: "Elite",    color: "#00FF88", bg: "rgba(0,255,136,0.08)",  icon: <Gem   className="w-3 h-3" /> },
  refined:  { label: "Refined",  color: "#f59e0b", bg: "rgba(245,158,11,0.08)", icon: <Zap   className="w-3 h-3" /> },
  rock:     { label: "Rock",     color: "#6b7280", bg: "rgba(107,114,128,0.08)",icon: <Pickaxe className="w-3 h-3" /> },
  ungraded: { label: "Ungraded", color: "#4b5563", bg: "rgba(75,85,99,0.06)",   icon: <Pickaxe className="w-3 h-3" /> },
};

const INTENT_COLOR: Record<Intent, string> = {
  hot:     "#ef4444",
  warm:    "#f59e0b",
  cold:    "#60a5fa",
  unknown: "#4b5563",
};

// ── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: MinedLead }) {
  const grade = GRADE[lead.gem_grade] ?? GRADE.ungraded;
  const intentColor = INTENT_COLOR[lead.intent] ?? "#4b5563";
  const emails = [lead.email, ...(lead.enrichment_data?.emails ?? [])].filter((e): e is string => !!e);
  const phones = [lead.phone, ...(lead.enrichment_data?.phones ?? [])].filter((p): p is string => !!p);
  const primaryEmail = emails[0] ?? null;
  const primaryPhone = phones[0] ?? null;
  const website = lead.source_url ?? null;
  const description = lead.enrichment_data?.description ?? null;
  const minedAt = new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3 transition-all hover:border-white/10 group"
      style={{ background: "#0d0d0d", borderColor: "rgba(255,255,255,0.05)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[13px] font-semibold text-neutral-100 truncate">
              {lead.company_name ?? lead.name ?? "Unknown Business"}
            </h3>
            {/* Grade badge */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
              style={{ color: grade.color, background: grade.bg }}
            >
              {grade.icon}
              {grade.label}
            </span>
            {/* Intent */}
            {lead.intent !== "unknown" && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
                style={{ color: intentColor, background: `${intentColor}14` }}
              >
                {lead.intent.charAt(0).toUpperCase() + lead.intent.slice(1)}
              </span>
            )}
          </div>
          {lead.industry && (
            <p className="text-[11px] text-neutral-600 mt-0.5">{lead.industry}</p>
          )}
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[18px] font-bold tabular-nums" style={{ color: grade.color }}>
            {lead.score}
          </p>
          <p className="text-[9px] text-neutral-700 uppercase tracking-wider">score</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${lead.score}%`, background: grade.color }}
        />
      </div>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-neutral-500 leading-relaxed line-clamp-2">
          {description}
        </p>
      )}

      {/* Contact info */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {primaryEmail && (
          <a
            href={`mailto:${primaryEmail}`}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-[#00FF88] transition-colors min-w-0"
          >
            <Mail className="w-3 h-3 flex-shrink-0 text-neutral-600" />
            <span className="truncate">{primaryEmail}</span>
          </a>
        )}
        {primaryPhone && (
          <a
            href={`tel:${primaryPhone}`}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-[#00FF88] transition-colors"
          >
            <Phone className="w-3 h-3 flex-shrink-0 text-neutral-600" />
            {primaryPhone}
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-[#00FF88] transition-colors"
          >
            <Globe className="w-3 h-3 flex-shrink-0 text-neutral-600" />
            <span className="truncate max-w-[160px]">{website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-50" />
          </a>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-neutral-700 pt-1 border-t border-white/[0.03]">
        <span>Mined {minedAt}</span>
        <span className="uppercase tracking-wider">{lead.source ?? "LeadMine"}</span>
      </div>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl border flex-shrink-0"
      style={{ background: `${color}06`, borderColor: `${color}18` }}
    >
      <div>
        <p className="text-[10px] text-neutral-600 whitespace-nowrap">{label}</p>
        <p className="text-[15px] font-bold tabular-nums" style={{ color }}>{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const GRADE_FILTERS = [
  { value: "",         label: "All Grades" },
  { value: "elite",   label: "Elite" },
  { value: "refined", label: "Refined" },
  { value: "rock",    label: "Rock" },
];

const INTENT_FILTERS = [
  { value: "",      label: "Any Intent" },
  { value: "hot",   label: "Hot" },
  { value: "warm",  label: "Warm" },
  { value: "cold",  label: "Cold" },
];

export default function IntelligencePage() {
  const [leads, setLeads]       = useState<MinedLead[]>([]);
  const [stats, setStats]       = useState<Stats>({ total: 0, elite: 0, refined: 0, rock: 0, hot: 0, today: 0 });
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery]       = useState("");
  const [grade, setGrade]       = useState("");
  const [intent, setIntent]     = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy]     = useState<"newest" | "score">("newest");
  const [error, setError]       = useState<string | null>(null);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "200" });
      if (grade)  params.set("grade", grade);
      if (intent) params.set("intent", intent);
      if (query)  params.set("q", query);

      const res = await fetch(`/api/intelligence/leads?${params}`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads ?? []);
      setStats(data.stats ?? { total: 0, elite: 0, refined: 0, rock: 0, hot: 0, today: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [grade, intent, query]);

  // Initial load and when filters change
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  const sorted = [...leads].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleExport = () => {
    if (!leads.length) return;
    const headers = ["Company", "Industry", "Grade", "Score", "Email", "Phone", "Website", "Mined At"];
    const rows = leads.map((l) => [
      l.company_name ?? l.name ?? "",
      l.industry ?? "",
      l.gem_grade,
      l.score,
      l.email ?? (l.enrichment_data?.emails?.[0] ?? ""),
      l.phone ?? (l.enrichment_data?.phones?.[0] ?? ""),
      l.source_url ?? "",
      new Date(l.created_at).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "leadmine-intelligence.csv" });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-[#080808] text-neutral-100 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b border-white/[0.05] bg-[#080808]/95 backdrop-blur-xl px-6 py-4 space-y-3">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4 text-[#00FF88]" />
              <h1 className="text-[14px] font-bold text-neutral-100 tracking-tight">Intelligence</h1>
            </div>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              AI-mined leads · updating continuously
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-300 border border-white/[0.06] hover:border-white/[0.12] transition-all"
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!leads.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-neutral-500 hover:text-neutral-300 border border-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5">
          <Stat label="Total Mined"   value={stats.total}   color="#00FF88" />
          <Stat label="Elite Gems"    value={stats.elite}   color="#00FF88" />
          <Stat label="Refined"       value={stats.refined} color="#f59e0b" />
          <Stat label="Hot Intent"    value={stats.hot}     color="#ef4444" />
          <Stat label="Mined Today"   value={stats.today}   color="#60a5fa" />
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, email, phone..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg pl-9 pr-4 py-2 text-[12px] text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-[#00FF88]/30 transition-all"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Grade filter */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setGrade(f.value)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  grade === f.value
                    ? "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20"
                    : "text-neutral-600 border-white/[0.05] hover:border-white/[0.1] hover:text-neutral-400"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Intent filter */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {INTENT_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setIntent(f.value)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  intent === f.value
                    ? "bg-white/[0.06] text-neutral-200 border-white/[0.1]"
                    : "text-neutral-600 border-white/[0.05] hover:border-white/[0.1] hover:text-neutral-400"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors px-2 py-1.5"
            >
              Sort: {sortBy === "newest" ? "Newest" : "Score"}
              <ChevronDown className="w-3 h-3" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#111] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-20">
                {(["newest", "score"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setSortOpen(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-[11px] transition-colors",
                      sortBy === opt ? "text-[#00FF88] bg-[#00FF88]/08" : "text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200"
                    )}
                  >
                    {opt === "newest" ? "Newest first" : "Highest score"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#00FF88]/50" />
            <p className="text-[12px] text-neutral-600">Loading intelligence...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <p className="text-[12px] text-neutral-500">{error}</p>
            <button onClick={() => fetchLeads()} className="text-[11px] text-[#00FF88] hover:underline">Retry</button>
          </div>
        )}

        {/* Empty — no leads yet */}
        {!loading && !error && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Pickaxe className="w-8 h-8 text-neutral-700" />
            <div className="text-center">
              <p className="text-[13px] text-neutral-400 font-medium">No leads mined yet</p>
              <p className="text-[11px] text-neutral-600 mt-1">
                Start a mining run to begin collecting leads
              </p>
            </div>
            <a
              href="/dashboard/mining"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={{ background: "rgba(0,255,136,0.1)", color: "#00FF88", border: "1px solid rgba(0,255,136,0.2)" }}
            >
              <Pickaxe className="w-3.5 h-3.5" />
              Go to Mining
            </a>
          </div>
        )}

        {/* Lead grid */}
        {!loading && !error && sorted.length > 0 && (
          <div className="p-6">
            {/* Results count */}
            <p className="text-[11px] text-neutral-700 mb-4 tabular-nums">
              {sorted.length.toLocaleString()} lead{sorted.length !== 1 ? "s" : ""}
              {grade || intent || query ? " (filtered)" : ""}
            </p>

            <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
              {sorted.map((lead) => (
                <LeadCard key={lead.id} lead={lead} />
              ))}
            </div>

            {/* Compliance */}
            <div className="mt-6 p-4 rounded-xl border border-amber-500/12 bg-amber-500/[0.02]">
              <div className="flex items-start gap-3">
                <Shield className="w-3.5 h-3.5 text-amber-500/60 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-neutral-700 leading-relaxed">
                  All data sourced from publicly available business records. Users are responsible for compliance with applicable TCPA, DNC, and state contact regulations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Miner activity indicator */}
      <div className="flex-shrink-0 border-t border-white/[0.04] px-6 py-2.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] text-neutral-700">Miners active · leads update in real time</span>
        <Flame className="w-3 h-3 text-neutral-800 ml-auto" />
      </div>
    </div>
  );
}
