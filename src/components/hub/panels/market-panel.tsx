"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GEM, CAVE } from "@/lib/cave-theme";
import {
  Home,
  MapPin,
  Phone,
  Mail,
  Sparkles,
  Building2,
  Radio,
  RefreshCw,
} from "lucide-react";

// ── Types (matches /api/leads/property) ───────────────────────────────────────
interface Lead {
  id: string;
  owner_name?: string | null;
  property_address?: string | null;
  property_city?: string | null;
  property_county?: string | null;
  property_state?: string | null;
  property_type?: string | null;
  years_owned?: number | null;
  equity_percent?: number | null;
  is_absentee_owner?: boolean | null;
  opportunity_score?: number | null;
  gem_grade?: "elite" | "refined" | "rock" | null;
  signal_flags?: string[] | null;
  stage?: string | null;
  phone?: string | null;
  email?: string | null;
}

const GRADES = [
  { key: "elite",   label: "Elite",   color: GEM.green,  blurb: "Hottest opportunities" },
  { key: "refined", label: "Refined", color: GEM.yellow, blurb: "Strong potential"      },
  { key: "rock",    label: "Rock",    color: "#6b7280",  blurb: "Emerging"              },
] as const;

const FLAG_LABEL: Record<string, string> = {
  pre_foreclosure: "Pre-foreclosure", tax_delinquent: "Tax delinquent",
  divorce: "Life event", life_event: "Life event", price_reduction: "Price cut",
  absentee: "Absentee", high_equity: "High equity", probate: "Probate",
  long_ownership: "Long owned", vacant: "Vacant",
};

const TYPE_LABEL: Record<string, string> = {
  single_family: "Single Family", condo: "Condo", multi_family: "Multi-Family",
  townhouse: "Townhouse", land: "Land",
};

function gradeOf(g?: string | null) {
  return GRADES.find((x) => x.key === g) ?? GRADES[2];
}

// ── Street View photo with graceful fallback ───────────────────────────────────
function HouseImage({ address, color }: { address: string; color: string }) {
  const [errored, setErrored] = useState(false);
  if (!address || errored) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: CAVE.stoneDeep }}>
        <Home className="w-6 h-6" style={{ color: `${color}66` }} />
        <span className="text-[9px] text-neutral-700">No street view</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/api/property/streetview?address=${encodeURIComponent(address)}&size=480x240&fov=80&heading=0`}
      alt={address}
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => setErrored(true)}
    />
  );
}

// ── House card ─────────────────────────────────────────────────────────────────
function HouseCard({ lead }: { lead: Lead }) {
  const g     = gradeOf(lead.gem_grade);
  const score = Math.round(lead.opportunity_score ?? 0);
  const addr  = lead.property_address || lead.owner_name || "Property";
  const area  = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "Location pending";
  const flags = (lead.signal_flags ?? []).filter(Boolean);
  const eq    = lead.equity_percent != null ? Math.round(lead.equity_percent) : null;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${g.color}26` }}
    >
      {/* Photo */}
      <div className="relative w-full" style={{ aspectRatio: "2/1" }}>
        <HouseImage address={lead.property_address ?? ""} color={g.color} />
        {/* grade badge */}
        <span
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: "rgba(0,0,0,0.55)", color: g.color, border: `1px solid ${g.color}55` }}
        >
          {g.key === "elite" && <Sparkles className="w-2.5 h-2.5" />}
          {g.label}
        </span>
        {/* score */}
        <span
          className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[12px] font-black tabular-nums"
          style={{ background: "rgba(0,0,0,0.6)", color: g.color }}
        >
          {score}
        </span>
        <div className="absolute bottom-0 inset-x-0 px-3 py-1.5" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
          <p className="text-[13px] font-bold text-white truncate leading-tight">{addr}</p>
          <p className="text-[10px] text-neutral-300 flex items-center gap-1 truncate"><MapPin className="w-2.5 h-2.5 shrink-0" />{area}</p>
        </div>
      </div>

      {/* Facts */}
      <div className="p-3 space-y-2.5">
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          {eq != null && <span><b className="text-neutral-200 tabular-nums">{eq}%</b> equity</span>}
          {lead.years_owned != null && <span><b className="text-neutral-200 tabular-nums">{lead.years_owned}yr</b> owned</span>}
          <span className="text-neutral-500">{TYPE_LABEL[lead.property_type ?? ""] ?? "Property"}</span>
          {lead.is_absentee_owner && <span style={{ color: GEM.yellow }}>Absentee</span>}
        </div>

        {/* Signal flags */}
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flags.slice(0, 4).map((f) => (
              <span key={f} className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#a3a3a3", background: "rgba(255,255,255,0.05)" }}>
                {FLAG_LABEL[f] ?? f.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Contact readiness */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-[10px]" style={{ color: lead.phone ? GEM.green : "#525252" }}>
              <Phone className="w-3 h-3" />{lead.phone ? "Phone" : "No phone"}
            </span>
            <span className="flex items-center gap-1 text-[10px]" style={{ color: lead.email && !lead.email.endsWith("@leadmine.local") ? GEM.green : "#525252" }}>
              <Mail className="w-3 h-3" />{lead.email && !lead.email.endsWith("@leadmine.local") ? "Email" : "No email"}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: "#a3a3a3", background: "rgba(255,255,255,0.05)" }}>
            {lead.stage ?? "new"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[26px] font-black tabular-nums leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-neutral-600 mt-1 tracking-wide">{label}</span>
    </div>
  );
}

// ── Market Panel — tiered local house board ────────────────────────────────────
export function MarketPanel({ isActive }: { isActive?: boolean }) {
  const [leads, setLeads]     = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/leads/property?limit=300");
      if (res.ok) {
        const data: Lead[] = await res.json();
        setLeads(Array.isArray(data) ? data.filter((l) => l.property_address) : []);
      }
    } catch {
      /* keep prior */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Poll while active + refetch on focus, so newly mined houses surface live.
  useEffect(() => {
    if (!isActive) return;
    load();
    const t = setInterval(load, 30_000);
    const onFocus = () => { if (document.visibilityState === "visible") load(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [isActive, load]);

  // ── Derived territory stats (real, from the data) ─────────────────────────
  const byGrade = (k: string) => leads.filter((l) => (l.gem_grade ?? "rock") === k);
  const cities  = Array.from(new Set(leads.map((l) => l.property_city).filter(Boolean))) as string[];
  const avgEquity = leads.length
    ? Math.round(leads.reduce((s, l) => s + (l.equity_percent ?? 0), 0) / leads.length)
    : 0;

  return (
    <div className="h-full w-full overflow-y-auto" style={{ background: CAVE.deep }}>
      <div className="max-w-6xl mx-auto px-5 md:px-6 py-6">

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GEM.green}12`, border: `1px solid ${GEM.green}28` }}>
              <Radio className="w-4 h-4" style={{ color: GEM.green }} />
            </div>
            <div>
              <h1 className="text-[18px] font-black text-white tracking-tight leading-none">Local Market</h1>
              <p className="text-[10px] text-neutral-600 mt-1">
                {cities.length > 0 ? cities.slice(0, 5).join(" · ") : "Your mined territory"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Stat value={leads.length} label="Opportunities" color="#fff" />
            <Stat value={byGrade("elite").length} label="Elite" color={GEM.green} />
            <Stat value={byGrade("refined").length} label="Refined" color={GEM.yellow} />
            <Stat value={`${avgEquity}%`} label="Avg equity" color={GEM.green} />
            <button onClick={load} className="p-2 rounded-lg transition-colors hover:bg-white/[0.05]" title="Refresh" style={{ color: "#737373" }}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && leads.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-24">
            <div className="w-4 h-4 rounded-full border-2 border-neutral-800 animate-spin" style={{ borderTopColor: GEM.green }} />
            <span className="text-[12px] text-neutral-600">Loading your territory…</span>
          </div>
        )}

        {/* Empty */}
        {!loading && leads.length === 0 && (
          <div className="rounded-2xl p-8 text-center mt-8" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CAVE.stoneEdge}` }}>
            <Building2 className="w-8 h-8 mx-auto mb-3" style={{ color: "#3f3f46" }} />
            <p className="text-[13px] font-semibold text-neutral-300">No local opportunities yet</p>
            <p className="text-[11px] text-neutral-600 mt-1">Mine your ZIP codes in Lead Machine — graded houses in your area will appear here.</p>
          </div>
        )}

        {/* Tiered sections */}
        {!loading && leads.length > 0 && (
          <div className="mt-6 space-y-7">
            {GRADES.map((g) => {
              const group = byGrade(g.key);
              if (group.length === 0) return null;
              return (
                <div key={g.key}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-sm rotate-45" style={{ background: g.color }} />
                    <span className="text-[12px] font-bold tracking-wide" style={{ color: g.color }}>{g.label}</span>
                    <span className="text-[11px] text-neutral-600">· {group.length}</span>
                    <span className="text-[10px] text-neutral-700">{g.blurb}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.slice(0, 60).map((l) => <HouseCard key={l.id} lead={l} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
