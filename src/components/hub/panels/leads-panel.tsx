"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, RefreshCw, Gem, Zap, Pickaxe,
  Mail, Phone, Globe, ExternalLink, Loader2, X, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GEM, CAVE } from "@/lib/cave-theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type GemGrade = "elite" | "refined" | "rock" | "ungraded";
type Intent   = "hot" | "warm" | "cold" | "unknown";
type SortKey  = "created_at" | "score" | "company_name" | "gem_grade";

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
  enrichment_data: {
    emails?: string[];
    phones?: string[];
    description?: string;
  };
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

// ── Grade config ──────────────────────────────────────────────────────────────

const GRADE_CFG: Record<GemGrade, { label: string; color: string; icon: React.ReactNode }> = {
  elite:    { label: "Elite",    color: GEM.green,  icon: <Gem     className="w-3 h-3" /> },
  refined:  { label: "Refined",  color: GEM.yellow, icon: <Zap     className="w-3 h-3" /> },
  rock:     { label: "Rock",     color: "#6b7280",  icon: <Pickaxe className="w-3 h-3" /> },
  ungraded: { label: "—",        color: "#374151",  icon: <Pickaxe className="w-3 h-3" /> },
};

const INTENT_COLOR: Record<Intent, string> = {
  hot:     "#ef4444",
  warm:    GEM.yellow,
  cold:    "#60a5fa",
  unknown: "#374151",
};

// ── Grade badge ───────────────────────────────────────────────────────────────

function GradeBadge({ grade }: { grade: GemGrade }) {
  const cfg = GRADE_CFG[grade] ?? GRADE_CFG.ungraded;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
      style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}28` }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-shrink-0"
      style={{ background: `${color}08`, borderColor: `${color}20` }}
    >
      <p className="text-[10px] text-neutral-600 whitespace-nowrap">{label}</p>
      <p className="text-[13px] font-bold tabular-nums" style={{ color }}>{value.toLocaleString()}</p>
    </div>
  );
}

// ── Sort header ───────────────────────────────────────────────────────────────

function SortTh({
  label, sortKey, current, dir, onSort,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-3 py-2.5 text-left cursor-pointer select-none whitespace-nowrap group"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wider transition-colors",
            active ? "text-[#00FF88]" : "text-neutral-600 group-hover:text-neutral-400"
          )}
        >
          {label}
        </span>
        {active ? (
          dir === "desc"
            ? <ChevronDown className="w-3 h-3 text-[#00FF88]" />
            : <ChevronUp   className="w-3 h-3 text-[#00FF88]" />
        ) : (
          <ChevronDown className="w-3 h-3 text-neutral-800 group-hover:text-neutral-600" />
        )}
      </div>
    </th>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const GRADE_FILTERS = [
  { value: "",         label: "All" },
  { value: "elite",   label: "Elite" },
  { value: "refined", label: "Refined" },
  { value: "rock",    label: "Rock" },
];

export function LeadsPanel({ isActive }: { isActive: boolean }) {
  const [leads, setLeads]         = useState<MinedLead[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, elite: 0, refined: 0, rock: 0, hot: 0, today: 0 });
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [query, setQuery]         = useState("");
  const [grade, setGrade]         = useState("");
  const [sortKey, setSortKey]     = useState<SortKey>("created_at");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");
  const [fetched, setFetched]     = useState(false);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ limit: "500" });
      if (grade) params.set("grade", grade);
      if (query) params.set("q", query);

      const res = await fetch(`/api/intelligence/leads?${params}`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setLeads(data.leads ?? []);
      setStats(data.stats ?? { total: 0, elite: 0, refined: 0, rock: 0, hot: 0, today: 0 });
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, [grade, query]);

  // Load on first activation, reload when filters change
  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => fetchLeads(), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [isActive, fetchLeads]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sorted = [...leads].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (sortKey === "score")        { av = a.score;       bv = b.score; }
    else if (sortKey === "company_name") { av = (a.company_name ?? "").toLowerCase(); bv = (b.company_name ?? "").toLowerCase(); }
    else if (sortKey === "gem_grade")    { av = a.gem_grade; bv = b.gem_grade; }
    else                                 { av = a.created_at; bv = b.created_at; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleExport = () => {
    if (!leads.length) return;
    const headers = ["Company", "Industry", "Grade", "Score", "Intent", "Email", "Phone", "Website", "Mined At"];
    const rows = leads.map((l) => [
      l.company_name ?? l.name ?? "",
      l.industry ?? "",
      l.gem_grade,
      l.score,
      l.intent,
      l.email ?? (l.enrichment_data?.emails?.[0] ?? ""),
      l.phone ?? (l.enrichment_data?.phones?.[0] ?? ""),
      l.source_url ?? "",
      new Date(l.created_at).toISOString(),
    ]);
    const csv  = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "leadmine-leads.csv" });
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 px-6 py-3.5 space-y-3"
        style={{ borderBottom: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4" style={{ color: GEM.green }} />
              <h2 className="text-[13px] font-bold text-neutral-200">Mined Leads</h2>
            </div>
            <p className="text-[10px] text-neutral-600 mt-0.5">All leads collected by your miners</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLeads(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneEdge}`, color: "#525252" }}
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!leads.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneEdge}`, color: "#525252" }}
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Chip label="Total"   value={stats.total}   color={GEM.green} />
          <Chip label="Elite"   value={stats.elite}   color={GEM.green} />
          <Chip label="Refined" value={stats.refined} color={GEM.yellow} />
          <Chip label="Rock"    value={stats.rock}    color="#6b7280" />
          <Chip label="Today"   value={stats.today}   color="#60a5fa" />
        </div>

        {/* Search + grade filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-700" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company, email, phone..."
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[12px] outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${CAVE.stoneEdge}`,
                color: "#d4d4d4",
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setGrade(f.value)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border"
                style={
                  grade === f.value
                    ? { color: GEM.green, background: `${GEM.green}12`, borderColor: `${GEM.green}30` }
                    : { color: "#525252", background: "transparent", borderColor: CAVE.stoneEdge }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: `${GEM.green}60` }} />
            <p className="text-[12px] text-neutral-600">Loading leads...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-[12px] text-neutral-500">{error}</p>
            <button onClick={() => fetchLeads()} className="text-[11px] hover:underline" style={{ color: GEM.green }}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && fetched && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Pickaxe className="w-7 h-7 text-neutral-700" />
            <p className="text-[12px] text-neutral-500">No leads mined yet — start a mining run to begin.</p>
          </div>
        )}

        {/* Spreadsheet */}
        {!loading && !error && sorted.length > 0 && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "#0d0d0d" }}>
              <tr style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
                <SortTh label="Company"  sortKey="company_name" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Industry</th>
                <SortTh label="Grade"    sortKey="gem_grade"    current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Score"    sortKey="score"        current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Intent</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Email</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Phone</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600">Website</th>
                <SortTh label="Mined"    sortKey="created_at"   current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((lead, idx) => {
                const email   = lead.email ?? lead.enrichment_data?.emails?.[0] ?? null;
                const phone   = lead.phone ?? lead.enrichment_data?.phones?.[0] ?? null;
                const minedAt = new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
                const intentColor = INTENT_COLOR[lead.intent] ?? INTENT_COLOR.unknown;

                return (
                  <tr
                    key={lead.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: `1px solid ${CAVE.stoneEdge}`,
                      background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,255,136,0.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)")}
                  >
                    {/* Company */}
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-[12px] font-medium text-neutral-200 truncate">
                        {lead.company_name ?? lead.name ?? "—"}
                      </p>
                    </td>

                    {/* Industry */}
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <p className="text-[11px] text-neutral-500 truncate">{lead.industry ?? "—"}</p>
                    </td>

                    {/* Grade */}
                    <td className="px-3 py-2.5">
                      <GradeBadge grade={lead.gem_grade} />
                    </td>

                    {/* Score */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-bold tabular-nums w-7 text-right"
                          style={{ color: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280" }}
                        >
                          {lead.score}
                        </span>
                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneEdge }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${lead.score}%`,
                              background: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280",
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Intent */}
                    <td className="px-3 py-2.5">
                      {lead.intent !== "unknown" ? (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ color: intentColor, background: `${intentColor}14` }}
                        >
                          {lead.intent.charAt(0).toUpperCase() + lead.intent.slice(1)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutral-700">—</span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-3 py-2.5 max-w-[180px]">
                      {email ? (
                        <a
                          href={`mailto:${email}`}
                          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors truncate"
                        >
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{email}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-neutral-700">—</span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors"
                        >
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {phone}
                        </a>
                      ) : (
                        <span className="text-[11px] text-neutral-700">—</span>
                      )}
                    </td>

                    {/* Website */}
                    <td className="px-3 py-2.5 max-w-[160px]">
                      {lead.source_url ? (
                        <a
                          href={lead.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors"
                        >
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {lead.source_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-40" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-neutral-700">—</span>
                      )}
                    </td>

                    {/* Mined at */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11px] text-neutral-600">{minedAt}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex-shrink-0 px-6 py-2.5 flex items-center gap-2"
        style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] text-neutral-700">
          {sorted.length.toLocaleString()} lead{sorted.length !== 1 ? "s" : ""}
          {grade || query ? " (filtered)" : ""}
        </span>
      </div>
    </div>
  );
}
