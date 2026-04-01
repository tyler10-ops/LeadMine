"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Zap,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  Pickaxe,
  ChevronRight,
  MapPin,
  Building2,
  ExternalLink,
  MessageSquare,
  Gem,
  Layers,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SignalLead } from "@/app/api/seller-radar/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(pct: number): string {
  if (pct >= 72) return "#00FF88";
  if (pct >= 52) return "#f59e0b";
  return "#6b7280";
}

function formatValue(v: number | null): string {
  if (!v) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(v / 1000)}K`;
}

function propertyTypeLabel(t: string | null): string {
  const map: Record<string, string> = {
    single_family: "Single Family",
    multi_family: "Multi-Family",
    condo: "Condo",
    townhouse: "Townhouse",
    land: "Land",
    commercial: "Commercial",
  };
  return t ? (map[t] ?? t) : "Property";
}

function getPropertyChips(lead: SignalLead): { label: string; color: string }[] {
  const out: { label: string; color: string }[] = [];
  const eq = lead.equity_percent ?? 0;
  const yrs = lead.years_owned ?? 0;

  if (eq >= 70) out.push({ label: `${eq.toFixed(0)}% Equity`, color: "#00FF88" });
  else if (eq >= 40) out.push({ label: `${eq.toFixed(0)}% Equity`, color: "#f59e0b" });
  else if (eq > 0) out.push({ label: `${eq.toFixed(0)}% Equity`, color: "#6b7280" });

  if (yrs >= 10) out.push({ label: `${yrs}yr Hold`, color: "#00FF88" });
  else if (yrs >= 6) out.push({ label: `${yrs}yr Hold`, color: "#f59e0b" });
  else if (yrs >= 3) out.push({ label: `${yrs}yr Hold`, color: "#6b7280" });

  if (lead.is_absentee_owner) out.push({ label: "Absentee", color: "#a855f7" });

  const flags = lead.signal_flags ?? [];
  if (flags.includes("pre_foreclosure")) out.push({ label: "Pre-Foreclosure", color: "#ef4444" });
  if (flags.includes("tax_delinquent")) out.push({ label: "Tax Delinquent", color: "#f97316" });
  if (flags.includes("divorce") || flags.includes("life_event"))
    out.push({ label: "Life Event", color: "#ec4899" });
  if (flags.includes("price_reduction")) out.push({ label: "Price Drop", color: "#3b82f6" });

  if (lead.heat_tier === "diamond") out.push({ label: "Diamond", color: "#818cf8" });
  else if (lead.heat_tier === "hot") out.push({ label: "Hot", color: "#f97316" });

  return out.slice(0, 4);
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl flex-shrink-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] text-neutral-600 whitespace-nowrap">{label}</p>
        <p className="text-[15px] font-bold text-neutral-100">{value}</p>
      </div>
    </div>
  );
}

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: SignalLead["signal_source"] }) {
  if (source === "reddit") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/25">
        <MessageSquare className="w-2.5 h-2.5" />
        Reddit
      </span>
    );
  }
  if (source === "craigslist") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/25">
        <MapPin className="w-2.5 h-2.5" />
        Craigslist
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
      <Building2 className="w-2.5 h-2.5" />
      County
    </span>
  );
}

// ── Signal card ───────────────────────────────────────────────────────────────

function SignalCard({
  lead,
  onOutreach,
}: {
  lead: SignalLead;
  onOutreach: (lead: SignalLead) => void;
}) {
  const score = lead.seller_probability;
  const color = scoreColor(score);
  const isSocial = lead.signal_source === "reddit" || lead.signal_source === "craigslist";

  return (
    <div className="group relative bg-[#0a0a0a] border border-white/[0.06] rounded-xl p-5 hover:border-white/[0.12] transition-all hover:shadow-[0_0_24px_rgba(0,0,0,0.6)] flex gap-5">
      {/* Score gauge */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-16">
        <div
          className="text-[28px] font-black tabular-nums leading-none"
          style={{ color }}
        >
          {score}
        </div>
        <div className="text-[9px] text-neutral-700 uppercase tracking-widest mt-0.5 text-center">
          {isSocial ? "Intent" : "Sell %"}
        </div>
        <div className="w-12 h-1 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="w-px bg-white/[0.05] flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <SourceBadge source={lead.signal_source} />
              {lead.intent && (
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                    lead.intent === "seller"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}
                >
                  {lead.intent === "seller" ? "Seller" : "Buyer"}
                </span>
              )}
              {lead.stage === "contacted" && (
                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Contacted
                </span>
              )}
            </div>

            {isSocial ? (
              <p className="text-[13px] font-semibold text-neutral-100 line-clamp-1">
                {lead.post_title ?? "Untitled post"}
              </p>
            ) : (
              <p className="text-[13px] font-semibold text-neutral-100 truncate">
                {lead.owner_name ?? "Unknown Owner"}
              </p>
            )}

            <p className="text-[11px] text-neutral-600 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              {isSocial
                ? `${lead.property_city ?? ""}${lead.property_state ? `, ${lead.property_state}` : ""}`
                : lead.property_address
                ? `${lead.property_address}, ${lead.property_city ?? ""}`
                : lead.property_city ?? "Unknown Location"}
            </p>
          </div>

          {!isSocial && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[12px] font-semibold text-neutral-300">
                {formatValue(lead.estimated_value)}
              </p>
              <p className="text-[10px] text-neutral-700">
                {formatValue(lead.estimated_equity)} equity
              </p>
            </div>
          )}

          {isSocial && lead.post_author && (
            <div className="flex-shrink-0 text-right">
              <p className="text-[10px] text-neutral-600">u/{lead.post_author}</p>
            </div>
          )}
        </div>

        {/* Body snippet for social, property details for county */}
        {isSocial && lead.post_body ? (
          <p className="text-[11px] text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
            {lead.post_body}
          </p>
        ) : !isSocial ? (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] text-neutral-600 flex items-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              {propertyTypeLabel(lead.property_type)}
            </span>
            {lead.property_zip && (
              <span className="text-[10px] text-neutral-700">· {lead.property_zip}</span>
            )}
          </div>
        ) : null}

        {/* Signal chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {isSocial
            ? (lead.signal_flags ?? []).slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-white/[0.07] text-neutral-500 bg-white/[0.03]"
                >
                  {kw}
                </span>
              ))
            : getPropertyChips(lead).map((s) => (
                <span
                  key={s.label}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                  style={{
                    color: s.color,
                    backgroundColor: `${s.color}10`,
                    borderColor: `${s.color}25`,
                  }}
                >
                  {s.label}
                </span>
              ))}
          {((isSocial && (lead.signal_flags ?? []).length === 0) ||
            (!isSocial && getPropertyChips(lead).length === 0)) && (
            <span className="text-[10px] text-neutral-700">No signals detected</span>
          )}
        </div>

        {/* Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOutreach(lead)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400 hover:text-[#00FF88] transition-colors group/btn"
          >
            <Zap className="w-3 h-3 group-hover/btn:text-[#00FF88]" />
            Draft Outreach
            <ChevronRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </button>
          {isSocial && lead.post_url && (
            <a
              href={lead.post_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-neutral-700 hover:text-neutral-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View post
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-center mb-5">
        <Gem className="w-6 h-6 text-neutral-700" />
      </div>
      <h3 className="text-[14px] font-semibold text-neutral-400 mb-2">
        No signals detected yet
      </h3>
      <p className="text-[12px] text-neutral-700 max-w-xs leading-relaxed mb-6">
        Run a mining job to start pulling buyer and seller signals from county
        data, Reddit, and Craigslist.
      </p>
      <a
        href="/dashboard/mining"
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-black transition-all"
        style={{ background: "#00FF88", boxShadow: "0 0 16px rgba(0,255,136,0.3)" }}
      >
        <Pickaxe className="w-3.5 h-3.5" />
        Go to Mining
      </a>
    </div>
  );
}

// ── Filter types ──────────────────────────────────────────────────────────────

type Filter = "all" | "high" | "social" | "absentee" | "uncontacted";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const [leads, setLeads] = useState<SignalLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller-radar");
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load signals");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError("Network error — could not load signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOutreach = (lead: SignalLead) => {
    const name = lead.owner_name ?? lead.post_title ?? lead.property_city ?? "this lead";
    setToastMsg(`Outreach drafted for ${name.slice(0, 40)}`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Stats
  const highCount    = leads.filter((l) => l.seller_probability >= 72).length;
  const socialCount  = leads.filter((l) => l.signal_source === "reddit" || l.signal_source === "craigslist").length;
  const uncontacted  = leads.filter((l) => !l.last_contact_at).length;
  const avgScore     = leads.length
    ? Math.round(leads.reduce((s, l) => s + l.seller_probability, 0) / leads.length)
    : 0;

  // Filtered list
  const visible = leads.filter((l) => {
    if (filter === "high")       return l.seller_probability >= 72;
    if (filter === "social")     return l.signal_source === "reddit" || l.signal_source === "craigslist";
    if (filter === "absentee")   return l.is_absentee_owner;
    if (filter === "uncontacted") return !l.last_contact_at;
    return true;
  });

  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: "all",        label: "All" },
    { key: "high",       label: "High Intent",  count: highCount },
    { key: "social",     label: "Social",       count: socialCount },
    { key: "absentee",   label: "Absentee" },
    { key: "uncontacted", label: "Not Contacted" },
  ];

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl shadow-xl shadow-emerald-900/40">
          <Zap className="w-3.5 h-3.5" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-white/[0.05] bg-black/90 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Pickaxe className="w-4 h-4 text-[#00FF88]" />
              <h1 className="text-[18px] font-bold text-neutral-100 tracking-tight">
                Signals
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00FF88] border border-[#00FF88]/30 bg-[#00FF88]/10 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <p className="text-[12px] text-neutral-600">
              Buyer & seller intent from county records, Reddit, and Craigslist · Sorted by score
            </p>
          </div>
          <button
            onClick={() => load(false)}
            className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors border border-white/[0.06] hover:border-white/[0.12] px-3 py-2 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
          <StatCard icon={Layers}     label="Tracked"       value={leads.length}      color="#1277b2" />
          <StatCard icon={Gem}        label="High Intent"   value={highCount}          color="#00FF88" />
          <StatCard icon={HardHat}    label="Social"        value={socialCount}        color="#f97316" />
          <StatCard icon={Clock}      label="Not Contacted" value={uncontacted}        color="#f59e0b" />
          <StatCard icon={TrendingUp} label="Avg Score"     value={`${avgScore}`}      color="#3b82f6" />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-8 py-3 border-b border-white/[0.04] flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all",
              filter === f.key
                ? "bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/25"
                : "text-neutral-600 hover:text-neutral-300 border border-transparent hover:border-white/[0.08]"
            )}
          >
            {f.label}
            {f.count != null && f.count > 0 && (
              <span className="ml-1.5 text-[9px] bg-[#00FF88]/15 text-[#00FF88] px-1.5 py-0.5 rounded-full">
                {f.count}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-neutral-700 tabular-nums">
          {visible.length} signals
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
            <p className="text-[12px] text-neutral-600">Scanning for signals…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <p className="text-[12px] text-neutral-500">{error}</p>
            <button
              onClick={() => load()}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {visible.map((lead) => (
              <SignalCard key={lead.id} lead={lead} onOutreach={handleOutreach} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
