"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search, Download, RefreshCw, Gem, Zap, Pickaxe,
  Mail, Phone, Globe, ExternalLink, Loader2, X, ChevronUp, ChevronDown,
  Building2, Home, ChevronRight, MapPin, User, Calendar, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GEM, CAVE } from "@/lib/cave-theme";
import { GemGrade as GemGradeBadge } from "@/components/ui/gem-grade";

// ── Types ─────────────────────────────────────────────────────────────────────

type GemGrade   = "elite" | "refined" | "rock" | "ungraded";
type LeadType   = "business" | "property";
type SortKey    = "created_at" | "score" | "name" | "gem_grade";

interface BusinessLead {
  id: string;
  company_name: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  gem_grade: GemGrade;
  score: number;
  intent: string;
  source: string;
  source_url: string | null;
  enrichment_data: { emails?: string[]; phones?: string[]; description?: string };
  created_at: string;
}

interface PropertyLead {
  id: string;
  owner_name: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_county: string | null;
  property_type: string | null;
  years_owned: number | null;
  equity_percent: number | null;
  is_absentee_owner: boolean | null;
  opportunity_score: number;
  gem_grade: GemGrade;
  signal_flags: string[] | null;
  stage: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface Stats { total: number; elite: number; refined: number; rock: number; today: number }

// ── Grade config ──────────────────────────────────────────────────────────────

const GRADE_CFG: Record<GemGrade, { label: string; color: string; icon: React.ReactNode }> = {
  elite:    { label: "Elite",   color: GEM.green,  icon: <Gem     className="w-3 h-3" /> },
  refined:  { label: "Refined", color: GEM.yellow, icon: <Zap     className="w-3 h-3" /> },
  rock:     { label: "Rock",    color: "#6b7280",  icon: <Pickaxe className="w-3 h-3" /> },
  ungraded: { label: "—",       color: "#374151",  icon: <Pickaxe className="w-3 h-3" /> },
};


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

function SortTh({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th className="px-3 py-2.5 text-left cursor-pointer select-none whitespace-nowrap group" onClick={() => onSort(sortKey)}>
      <div className="flex items-center gap-1">
        <span className={cn("text-[10px] font-semibold uppercase tracking-wider transition-colors", active ? "text-[#00FF88]" : "text-neutral-600 group-hover:text-neutral-400")}>
          {label}
        </span>
        {active
          ? dir === "desc" ? <ChevronDown className="w-3 h-3 text-[#00FF88]" /> : <ChevronUp className="w-3 h-3 text-[#00FF88]" />
          : <ChevronDown className="w-3 h-3 text-neutral-800 group-hover:text-neutral-600" />}
      </div>
    </th>
  );
}

function Th({ label }: { label: string }) {
  return <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 whitespace-nowrap">{label}</th>;
}

const GRADE_FILTERS = [
  { value: "",        label: "All"     },
  { value: "elite",  label: "Elite"   },
  { value: "refined",label: "Refined" },
  { value: "rock",   label: "Rock"    },
];

const SIGNAL_POINTS = [
  { label: "Absentee owner",          points: "+25", color: GEM.green  },
  { label: "Owned 20+ years",         points: "+20", color: GEM.green  },
  { label: "Equity > 70%",            points: "+20", color: GEM.green  },
  { label: "Equity > 40%",            points: "+15", color: GEM.yellow },
  { label: "Owned 10+ years",         points: "+15", color: GEM.yellow },
  { label: "Stale 5+ years",          points: "+10", color: GEM.yellow },
  { label: "Recently sold (<2 yr)",   points: "−35", color: "#FF3B30"  },
  { label: "Incomplete record",       points: "−10", color: "#FF3B30"  },
] as const;

function GradeThHeader({ sortKey, current, dir, onSort }: {
  sortKey: SortKey; current: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void;
}) {
  const [tip, setTip] = useState(false);
  const active = current === sortKey;
  return (
    <th className="px-3 py-2.5 text-left whitespace-nowrap">
      <div className="flex items-center gap-1.5">
        <button className="flex items-center gap-1 cursor-pointer select-none group" onClick={() => onSort(sortKey)}>
          <span className={cn("text-[10px] font-semibold uppercase tracking-wider transition-colors", active ? "text-[#00FF88]" : "text-neutral-600 group-hover:text-neutral-400")}>
            Grade
          </span>
          {active
            ? dir === "desc" ? <ChevronDown className="w-3 h-3 text-[#00FF88]" /> : <ChevronUp className="w-3 h-3 text-[#00FF88]" />
            : <ChevronDown className="w-3 h-3 text-neutral-800 group-hover:text-neutral-600" />}
        </button>
        <div className="relative">
          <button
            onClick={() => setTip(v => !v)}
            className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors"
            style={{ background: tip ? `${GEM.green}20` : "rgba(255,255,255,0.06)", color: tip ? GEM.green : "#525252", border: `1px solid ${tip ? GEM.green + "40" : "transparent"}` }}
          >
            ?
          </button>
          {tip && (
            <div
              className="absolute left-0 top-full mt-1.5 z-50 rounded-xl border p-3 w-64"
              style={{ background: "#0d0d18", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
            >
              <p className="text-[10px] font-bold text-neutral-300 mb-1">How Gems Are Graded</p>
              <p className="text-[9px] text-neutral-600 mb-2.5">Score 0–100 based on seller motivation signals from county assessor data.</p>
              <div className="flex gap-3 mb-3 text-[9px] font-bold">
                <span style={{ color: GEM.green }}>Elite ≥65 pts</span>
                <span style={{ color: GEM.yellow }}>Refined ≥35 pts</span>
                <span style={{ color: "#FF3B30" }}>Rock &lt;35 pts</span>
              </div>
              <div className="space-y-1.5">
                {SIGNAL_POINTS.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-[9px] text-neutral-500">{s.label}</span>
                    <span className="text-[9px] font-bold tabular-nums" style={{ color: s.color }}>{s.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </th>
  );
}

// ── Street View Carousel (drawer) ─────────────────────────────────────────────

const SV_ANGLES = [
  { heading: "0",   fov: "90", label: "Front" },
  { heading: "330", fov: "90", label: "Left"  },
  { heading: "30",  fov: "90", label: "Right" },
];

function DrawerStreetView({ address }: { address: string }) {
  const [idx, setIdx]     = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>([false, false, false]);
  const [errors, setErrors] = useState<boolean[]>([false, false, false]);
  const encoded = encodeURIComponent(address);
  const current = SV_ANGLES[idx];

  const markLoaded = (i: number) => setLoaded(p => { const n = [...p]; n[i] = true; return n; });
  const markError  = (i: number) => setErrors(p => { const n = [...p]; n[i] = true; return n; });

  if (errors.every(Boolean)) return (
    <div className="flex items-center justify-center h-36 rounded-xl text-[11px] text-neutral-600" style={{ background: CAVE.stoneDeep }}>
      No street view available
    </div>
  );

  return (
    <div className="rounded-xl overflow-hidden relative" style={{ border: `1px solid ${CAVE.stoneMid}` }}>
      <div className="relative w-full" style={{ aspectRatio: "16/7", background: CAVE.stoneDeep }}>
        {!loaded[idx] && !errors[idx] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
          </div>
        )}
        {!errors[idx] && (
          <img
            key={`${address}-${idx}`}
            src={`/api/property/streetview?address=${encoded}&heading=${current.heading}&fov=${current.fov}&size=640x280`}
            alt={`${current.label} view`}
            className="w-full h-full object-cover"
            style={{ opacity: loaded[idx] ? 1 : 0, transition: "opacity 0.3s ease" }}
            onLoad={() => markLoaded(idx)}
            onError={() => markError(idx)}
          />
        )}
        <button
          onClick={() => setIdx(i => (i - 1 + SV_ANGLES.length) % SV_ANGLES.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white rotate-180" />
        </button>
        <button
          onClick={() => setIdx(i => (i + 1) % SV_ANGLES.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <ChevronRight className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: CAVE.stoneDeep, borderTop: `1px solid ${CAVE.stoneMid}` }}>
        <div className="flex gap-1.5">
          {SV_ANGLES.map((a, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 16 : 5, height: 5, borderRadius: 3, background: i === idx ? GEM.green : "rgba(255,255,255,0.12)", transition: "all 0.25s ease" }} />
          ))}
        </div>
        <span className="text-[10px] text-neutral-600">{current.label}</span>
      </div>
    </div>
  );
}

// ── Lead Drawer ───────────────────────────────────────────────────────────────

function LeadDrawer({ lead, onClose }: { lead: PropertyLead; onClose: () => void }) {
  const cfg      = GRADE_CFG[lead.gem_grade] ?? GRADE_CFG.ungraded;
  const equity   = lead.equity_percent != null ? Math.round(lead.equity_percent) : null;
  const yrs      = lead.years_owned    != null ? Math.round(lead.years_owned)    : null;
  const typeLabel = (lead.property_type ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const address  = [lead.property_address, lead.property_city, lead.property_state].filter(Boolean).join(", ");
  const minedAt  = new Date(lead.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-[380px] flex flex-col overflow-hidden shadow-2xl"
        style={{ background: CAVE.deep, borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: cfg.color, background: `${cfg.color}14`, border: `1px solid ${cfg.color}28` }}>
                {cfg.icon}{cfg.label}
              </span>
              {lead.is_absentee_owner && (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ color: GEM.yellow, background: `${GEM.yellow}14`, border: `1px solid ${GEM.yellow}28` }}>
                  Absentee
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-bold text-neutral-100 leading-tight truncate">{lead.owner_name ?? "Unknown Owner"}</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{address || "—"}</p>
          </div>
          <button onClick={onClose} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Street View */}
          {address && <DrawerStreetView address={address} />}

          {/* Contact info */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
              <User className="w-3 h-3" />Contact Info
            </p>
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-[12px] transition-colors hover:opacity-80" style={{ color: GEM.green }}>
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{lead.phone}</span>
              </a>
            ) : (
              <p className="text-[11px] text-neutral-600 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />No phone on file</p>
            )}
            {lead.email ? (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-[12px] transition-colors hover:opacity-80" style={{ color: GEM.green }}>
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </a>
            ) : (
              <p className="text-[11px] text-neutral-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5" />No email on file</p>
            )}
          </div>

          {/* Property details */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />Property Details
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Type",       value: typeLabel || "—"                    },
                { label: "County",     value: lead.property_county ?? "—"         },
                { label: "Equity",     value: equity != null ? `${equity}%` : "—" },
                { label: "Yrs Owned",  value: yrs    != null ? `${yrs}y`    : "—" },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg px-3 py-2" style={{ background: CAVE.surface2 ?? "#111" }}>
                  <p className="text-[10px] text-neutral-600">{label}</p>
                  <p className="text-[12px] font-semibold text-neutral-200 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Score */}
          <div className="rounded-xl p-4" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />Opportunity Score
              </p>
              <span className="text-[18px] font-bold tabular-nums" style={{ color: cfg.color }}>{lead.opportunity_score}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: CAVE.stoneEdge }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${lead.opportunity_score}%`, background: cfg.color }} />
            </div>
          </div>

          {/* Signal flags */}
          {lead.signal_flags && lead.signal_flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.signal_flags.map(flag => (
                <span key={flag} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${GEM.green}10`, border: `1px solid ${GEM.green}20`, color: `${GEM.green}99` }}>
                  {flag.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Mined at */}
          <p className="text-[10px] text-neutral-700 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />Mined {minedAt}
          </p>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LeadsPanel({ isActive }: { isActive: boolean }) {
  const [leadType,     setLeadType]    = useState<LeadType>("property");
  const [bizLeads,     setBizLeads]    = useState<BusinessLead[]>([]);
  const [propLeads,    setPropLeads]   = useState<PropertyLead[]>([]);
  const [stats,        setStats]       = useState<Stats>({ total: 0, elite: 0, refined: 0, rock: 0, today: 0 });
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefresh]     = useState(false);
  const [error,        setError]       = useState<string | null>(null);
  const [query,        setQuery]       = useState("");
  const [grade,        setGrade]       = useState("");
  const [sortKey,      setSortKey]     = useState<SortKey>("created_at");
  const [sortDir,      setSortDir]     = useState<"asc" | "desc">("desc");
  const [fetched,      setFetched]     = useState(false);
  const [selectedLead, setSelectedLead] = useState<PropertyLead | null>(null);

  const fetchLeads = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    setError(null);
    try {
      if (leadType === "business") {
        const params = new URLSearchParams({ limit: "500" });
        if (grade) params.set("grade", grade);
        if (query) params.set("q", query);
        const res = await fetch(`/api/intelligence/leads?${params}`);
        if (!res.ok) throw new Error("Failed to load leads");
        const data = await res.json();
        setBizLeads(data.leads ?? []);
        const s = data.stats ?? {};
        setStats({ total: s.total ?? 0, elite: s.elite ?? 0, refined: s.refined ?? 0, rock: s.rock ?? 0, today: s.today ?? 0 });
      } else {
        const params = new URLSearchParams({ limit: "500", source: "county_assessor" });
        if (grade) params.set("grade", grade);
        const res = await fetch(`/api/leads/property?${params}`);
        if (!res.ok) throw new Error("Failed to load property leads");
        const data: PropertyLead[] = await res.json();
        setPropLeads(data);
        const today = new Date().toDateString();
        setStats({
          total:   data.length,
          elite:   data.filter(l => l.gem_grade === "elite").length,
          refined: data.filter(l => l.gem_grade === "refined").length,
          rock:    data.filter(l => l.gem_grade === "rock").length,
          today:   data.filter(l => new Date(l.created_at).toDateString() === today).length,
        });
      }
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, [leadType, grade, query]);

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => fetchLeads(), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [isActive, fetchLeads]);

  // Reset fetch state when switching lead type
  useEffect(() => { setFetched(false); setError(null); }, [leadType]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const sortedBiz = [...bizLeads].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (sortKey === "score")      { av = a.score;     bv = b.score; }
    else if (sortKey === "name")  { av = (a.company_name ?? a.name ?? "").toLowerCase(); bv = (b.company_name ?? b.name ?? "").toLowerCase(); }
    else if (sortKey === "gem_grade") { av = a.gem_grade; bv = b.gem_grade; }
    else                          { av = a.created_at; bv = b.created_at; }
    return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  const filteredProp = propLeads.filter(l => {
    if (grade && l.gem_grade !== grade) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        l.owner_name?.toLowerCase().includes(q) ||
        l.property_address?.toLowerCase().includes(q) ||
        l.property_city?.toLowerCase().includes(q) ||
        l.property_county?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedProp = [...filteredProp].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (sortKey === "score")          { av = a.opportunity_score; bv = b.opportunity_score; }
    else if (sortKey === "name")      { av = (a.owner_name ?? a.property_address ?? "").toLowerCase(); bv = (b.owner_name ?? b.property_address ?? "").toLowerCase(); }
    else if (sortKey === "gem_grade") { av = a.gem_grade; bv = b.gem_grade; }
    else                              { av = a.created_at; bv = b.created_at; }
    return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
  });

  const handleExport = () => {
    if (leadType === "property") {
      if (!sortedProp.length) return;
      const headers = ["Owner", "Address", "City", "State", "County", "Type", "Grade", "Score", "Equity %", "Years Owned", "Absentee", "Mined At"];
      const rows = sortedProp.map(l => [
        l.owner_name ?? "", l.property_address ?? "", l.property_city ?? "", l.property_state ?? "",
        l.property_county ?? "", l.property_type ?? "", l.gem_grade, l.opportunity_score,
        l.equity_percent != null ? Math.round(l.equity_percent) : "",
        l.years_owned != null ? Math.round(l.years_owned) : "",
        l.is_absentee_owner ? "Yes" : "No",
        new Date(l.created_at).toISOString(),
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: "property-leads.csv" });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } else {
      if (!sortedBiz.length) return;
      const headers = ["Company", "Industry", "Grade", "Score", "Intent", "Email", "Phone", "Website", "Mined At"];
      const rows = sortedBiz.map(l => [
        l.company_name ?? l.name ?? "", l.industry ?? "", l.gem_grade, l.score, l.intent,
        l.email ?? (l.enrichment_data?.emails?.[0] ?? ""),
        l.phone ?? (l.enrichment_data?.phones?.[0] ?? ""),
        l.source_url ?? "", new Date(l.created_at).toISOString(),
      ]);
      const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement("a"), { href: url, download: "business-leads.csv" });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
  };

  const displayCount = leadType === "property" ? sortedProp.length : sortedBiz.length;

  return (
    <div
      className={cn("h-full flex flex-col transition-all duration-500", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none")}
      style={{ background: CAVE.deep }}
    >
      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-3.5 space-y-3" style={{ borderBottom: `1px solid ${CAVE.stoneMid}` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="w-4 h-4" style={{ color: GEM.green }} />
              <h2 className="text-[13px] font-bold text-neutral-200">Mined Leads</h2>
            </div>
            <p className="text-[10px] text-neutral-600 mt-0.5">All leads collected by your miners</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Lead type toggle */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${CAVE.stoneEdge}` }}>
              <button
                onClick={() => setLeadType("property")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all"
                style={leadType === "property"
                  ? { background: `${GEM.green}18`, color: GEM.green }
                  : { background: "transparent", color: "#525252" }}
              >
                <Home className="w-3 h-3" />Property
              </button>
              <button
                onClick={() => setLeadType("business")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all"
                style={leadType === "business"
                  ? { background: `${GEM.green}18`, color: GEM.green }
                  : { background: "transparent", color: "#525252" }}
              >
                <Building2 className="w-3 h-3" />Business
              </button>
            </div>
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
              disabled={displayCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneEdge}`, color: "#525252" }}
            >
              <Download className="w-3 h-3" />Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <Chip label="Total"   value={stats.total}   color={GEM.green}  />
          <Chip label="Elite"   value={stats.elite}   color={GEM.green}  />
          <Chip label="Refined" value={stats.refined} color={GEM.yellow} />
          <Chip label="Rock"    value={stats.rock}    color="#6b7280"    />
          <Chip label="Today"   value={stats.today}   color="#60a5fa"    />
        </div>

        {/* Search + grade filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-700" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={leadType === "property" ? "Search owner, address, city, county..." : "Search company, email..."}
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[12px] outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneEdge}`, color: "#d4d4d4" }}
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {GRADE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setGrade(f.value)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border"
                style={grade === f.value
                  ? { color: GEM.green, background: `${GEM.green}12`, borderColor: `${GEM.green}30` }
                  : { color: "#525252", background: "transparent", borderColor: CAVE.stoneEdge }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: `${GEM.green}60` }} />
            <p className="text-[12px] text-neutral-600">Loading leads...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-[12px] text-neutral-500">{error}</p>
            <button onClick={() => fetchLeads()} className="text-[11px] hover:underline" style={{ color: GEM.green }}>Retry</button>
          </div>
        )}

        {!loading && !error && fetched && displayCount === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Pickaxe className="w-7 h-7 text-neutral-700" />
            <p className="text-[12px] text-neutral-500">No leads yet — start a mining run in Lead Machine.</p>
          </div>
        )}

        {/* Property leads table */}
        {!loading && !error && leadType === "property" && sortedProp.length > 0 && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "#0d0d0d" }}>
              <tr style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
                <SortTh label="Owner / Address" sortKey="name"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="City" />
                <Th label="County" />
                <Th label="Type" />
                <GradeThHeader sortKey="gem_grade" current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Score"          sortKey="score"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Equity %" />
                <Th label="Yrs Owned" />
                <Th label="Absentee" />
                <SortTh label="Mined"          sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedProp.map((lead, idx) => {
                const minedAt = new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
                const equity  = lead.equity_percent != null ? Math.round(lead.equity_percent) : null;
                const yrs     = lead.years_owned    != null ? Math.round(lead.years_owned)    : null;
                const typeLabel = (lead.property_type ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

                return (
                  <tr
                    key={lead.id}
                    className="group transition-colors cursor-pointer"
                    style={{ borderBottom: `1px solid ${CAVE.stoneEdge}`, background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,255,136,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)")}
                    onClick={() => setSelectedLead(lead)}
                  >
                    {/* Owner / Address */}
                    <td className="px-3 py-2.5 max-w-[220px]">
                      <p className="text-[12px] font-medium text-neutral-200 truncate">
                        {lead.owner_name ?? "Unknown Owner"}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate mt-0.5">
                        {lead.property_address ?? "—"}
                      </p>
                    </td>

                    {/* City */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-[11px] text-neutral-400">{lead.property_city ?? "—"}</p>
                    </td>

                    {/* County */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-[11px] text-neutral-500">{lead.property_county ?? "—"}</p>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <p className="text-[11px] text-neutral-500">{typeLabel || "—"}</p>
                    </td>

                    {/* Grade */}
                    <td className="px-3 py-2.5">
                      <GemGradeBadge grade={lead.gem_grade} size="sm" />
                    </td>

                    {/* Score */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold tabular-nums w-7 text-right" style={{ color: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280" }}>
                          {lead.opportunity_score}
                        </span>
                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneEdge }}>
                          <div className="h-full rounded-full" style={{ width: `${lead.opportunity_score}%`, background: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280" }} />
                        </div>
                      </div>
                    </td>

                    {/* Equity % */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {equity != null ? (
                        <span className="text-[11px] font-medium" style={{ color: equity >= 50 ? GEM.green : equity >= 20 ? GEM.yellow : "#6b7280" }}>
                          {equity}%
                        </span>
                      ) : <span className="text-[11px] text-neutral-700">—</span>}
                    </td>

                    {/* Years owned */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-[11px] text-neutral-400">{yrs != null ? `${yrs}y` : "—"}</span>
                    </td>

                    {/* Absentee */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {lead.is_absentee_owner
                        ? <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ color: GEM.yellow, background: `${GEM.yellow}14` }}>Absentee</span>
                        : <span className="text-[11px] text-neutral-700">—</span>}
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

        {/* Business leads table */}
        {!loading && !error && leadType === "business" && sortedBiz.length > 0 && (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10" style={{ background: "#0d0d0d" }}>
              <tr style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
                <SortTh label="Company"  sortKey="name"       current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Industry" />
                <SortTh label="Grade"    sortKey="gem_grade"  current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="Score"    sortKey="score"      current={sortKey} dir={sortDir} onSort={handleSort} />
                <Th label="Intent" />
                <Th label="Email" />
                <Th label="Phone" />
                <Th label="Website" />
                <SortTh label="Mined"    sortKey="created_at" current={sortKey} dir={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedBiz.map((lead, idx) => {
                const email   = lead.email ?? lead.enrichment_data?.emails?.[0] ?? null;
                const phone   = lead.phone ?? lead.enrichment_data?.phones?.[0] ?? null;
                const minedAt = new Date(lead.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
                return (
                  <tr
                    key={lead.id}
                    className="group transition-colors"
                    style={{ borderBottom: `1px solid ${CAVE.stoneEdge}`, background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,255,136,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.008)")}
                  >
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-[12px] font-medium text-neutral-200 truncate">{lead.company_name ?? lead.name ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5 max-w-[140px]">
                      <p className="text-[11px] text-neutral-500 truncate">{lead.industry ?? "—"}</p>
                    </td>
                    <td className="px-3 py-2.5"><GemGradeBadge grade={lead.gem_grade} size="sm" /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold tabular-nums w-7 text-right" style={{ color: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280" }}>{lead.score}</span>
                        <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneEdge }}>
                          <div className="h-full rounded-full" style={{ width: `${lead.score}%`, background: GRADE_CFG[lead.gem_grade]?.color ?? "#6b7280" }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[11px] text-neutral-500 capitalize">{lead.intent !== "unknown" ? lead.intent : "—"}</span>
                    </td>
                    <td className="px-3 py-2.5 max-w-[180px]">
                      {email ? (
                        <a href={`mailto:${email}`} className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{email}</span>
                        </a>
                      ) : <span className="text-[11px] text-neutral-700">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {phone ? (
                        <a href={`tel:${phone}`} className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors">
                          <Phone className="w-3 h-3 flex-shrink-0" />{phone}
                        </a>
                      ) : <span className="text-[11px] text-neutral-700">—</span>}
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      {lead.source_url ? (
                        <a href={lead.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-[#00FF88] transition-colors">
                          <Globe className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">{lead.source_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-40" />
                        </a>
                      ) : <span className="text-[11px] text-neutral-700">—</span>}
                    </td>
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
      <div className="flex-shrink-0 px-6 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] text-neutral-700">
          {displayCount.toLocaleString()} lead{displayCount !== 1 ? "s" : ""}
          {grade || query ? " (filtered)" : ""}
          {" · "}{leadType === "property" ? "Property Owners" : "Business Leads"}
        </span>
      </div>

      {/* Lead detail drawer */}
      {selectedLead && (
        <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}