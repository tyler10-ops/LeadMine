"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GEM, CAVE } from "@/lib/cave-theme";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  ChevronDown,
  MapPin,
  Building2,
  MessageSquare,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────
interface Interpretation {
  ai_summary?: string;
  ai_realtor_impact?: string;
  asset_recommendations?: { asset_type?: string; action?: string; reason?: string; priority?: string }[];
}
interface MarketSignal {
  id: string;
  headline: string;
  summary?: string | null;
  category: string;
  signal_direction: "bullish" | "bearish" | "neutral";
  impact_score: number;
  confidence_score: number;
  is_high_impact: boolean;
  region: string;
  geography: string;
  published_at: string;
  tags?: string[];
  interpretation?: Interpretation | null;
}
interface LocalSignal {
  id: string;
  signal_source: "property" | "reddit" | "craigslist";
  owner_name: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  seller_probability: number;
  signal_flags: string[];
  heat_tier: string;
  intent: string | null;
  post_title: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  rates: "Rates", inventory: "Inventory", demand: "Demand",
  policy: "Policy", local_market: "Local", macro: "Macro",
};
const FLAG_LABEL: Record<string, string> = {
  pre_foreclosure: "Pre-foreclosure", tax_delinquent: "Tax delinquent",
  divorce: "Life event", life_event: "Life event", price_reduction: "Price cut",
  absentee: "Absentee", high_equity: "High equity", probate: "Probate",
};

function timeAgo(iso?: string, nowMs: number = Date.now()): string {
  if (!iso) return "";
  const s = Math.max(0, (nowMs - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}
function dirConfig(dir: string) {
  if (dir === "bullish") return { color: GEM.green, Icon: TrendingUp };
  if (dir === "bearish") return { color: GEM.red, Icon: TrendingDown };
  return { color: GEM.yellow, Icon: Minus };
}

// ── Market signal row (expandable) ────────────────────────────────────────────
function SignalRow({ s, isNew, now }: { s: MarketSignal; isNew: boolean; now: number }) {
  const [open, setOpen] = useState(false);
  const d = dirConfig(s.signal_direction);
  const summary = s.interpretation?.ai_summary || s.summary;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: isNew ? `${d.color}0c` : "rgba(255,255,255,0.02)",
        border: `1px solid ${s.is_high_impact ? d.color + "33" : CAVE.stoneEdge}`,
        animation: isNew ? "mk-rise 0.5s ease-out both" : undefined,
      }}
    >
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-3.5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${d.color}14` }}>
          <d.Icon className="w-4 h-4" style={{ color: d.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: "#a3a3a3", background: "rgba(255,255,255,0.05)" }}>
              {CATEGORY_LABEL[s.category] ?? s.category}
            </span>
            {s.is_high_impact && <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: GEM.yellow }}>High impact</span>}
            {isNew && <span className="text-[8px] font-black uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "#000", background: d.color }}>New</span>}
          </div>
          <p className="text-[13px] font-semibold text-neutral-100 truncate mt-1">{s.headline}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">
            {s.region && s.region !== "US" ? `${s.region} · ` : ""}{timeAgo(s.published_at, now)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[20px] font-black tabular-nums leading-none" style={{ color: d.color }}>{s.impact_score}</div>
          <p className="text-[8px] uppercase tracking-widest text-neutral-600 mt-0.5">Impact</p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-600 shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (summary || s.interpretation?.ai_realtor_impact) && (
        <div className="px-3.5 pb-3.5 space-y-2">
          {summary && <p className="text-[12px] text-neutral-400 leading-relaxed">{summary}</p>}
          {s.interpretation?.ai_realtor_impact && (
            <div className="rounded-lg p-2.5" style={{ background: `${GEM.green}08`, border: `1px solid ${GEM.green}1f` }}>
              <p className="text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: GEM.green }}>What it means for you</p>
              <p className="text-[12px] text-neutral-300 leading-relaxed">{s.interpretation.ai_realtor_impact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Local intelligence card ───────────────────────────────────────────────────
function LocalCard({ l, isNew }: { l: LocalSignal; isNew: boolean }) {
  const prob  = Math.round(l.seller_probability);
  const color = prob >= 70 ? GEM.green : prob >= 50 ? GEM.yellow : GEM.red;
  const title = l.property_address || l.post_title || l.owner_name || "Signal";
  const loc   = [l.property_city, l.property_state].filter(Boolean).join(", ");
  const Src   = l.signal_source === "property" ? Building2 : MessageSquare;
  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        background: isNew ? `${color}0c` : "rgba(255,255,255,0.02)",
        border: `1px solid ${color}22`,
        animation: isNew ? "mk-rise 0.5s ease-out both" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-neutral-100 truncate">{title}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5 flex items-center gap-1 truncate">
            <Src className="w-2.5 h-2.5 shrink-0" />
            {loc || "Location pending"}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[22px] font-black tabular-nums leading-none" style={{ color }}>{prob}%</div>
          <p className="text-[8px] uppercase tracking-widest text-neutral-600 mt-0.5">Seller prob</p>
        </div>
      </div>
      {l.signal_flags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2.5">
          {l.signal_flags.slice(0, 4).map((f) => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 rounded" style={{ color: "#a3a3a3", background: "rgba(255,255,255,0.05)" }}>
              {FLAG_LABEL[f] ?? f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Big stat ──────────────────────────────────────────────────────────────────
function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[28px] font-black tabular-nums leading-none" style={{ color }}>{value}</span>
      <span className="text-[10px] text-neutral-600 mt-1 tracking-wide">{label}</span>
    </div>
  );
}

// ── Market Panel ────────────────────────────────────────────────────────────
export function MarketPanel({ isActive }: { isActive?: boolean }) {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [local, setLocal]     = useState<LocalSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [now, setNow]         = useState(() => Date.now());
  const [newIds, setNewIds]   = useState<Set<string>>(new Set());
  const [tickerIdx, setTickerIdx] = useState(0);
  const seenRef     = useRef<Set<string>>(new Set());
  const firstLoad   = useRef(true);

  const load = useCallback(async () => {
    try {
      const [sigRes, locRes] = await Promise.all([
        fetch("/api/signals?limit=40").then((r) => (r.ok ? r.json() : { signals: [] })).catch(() => ({ signals: [] })),
        fetch("/api/seller-radar").then((r) => (r.ok ? r.json() : { leads: [] })).catch(() => ({ leads: [] })),
      ]);
      const sigs: MarketSignal[] = sigRes.signals ?? [];
      const locs: LocalSignal[]  = locRes.leads ?? [];

      // Flag items we haven't seen before (skip flashing the entire first load)
      if (!firstLoad.current) {
        const fresh = new Set<string>();
        sigs.forEach((s) => { if (!seenRef.current.has(s.id)) fresh.add(s.id); });
        locs.forEach((l) => { if (!seenRef.current.has(l.id)) fresh.add(l.id); });
        if (fresh.size > 0) {
          setNewIds(fresh);
          setTimeout(() => setNewIds(new Set()), 4500);
        }
      }
      sigs.forEach((s) => seenRef.current.add(s.id));
      locs.forEach((l) => seenRef.current.add(l.id));
      firstLoad.current = false;

      setSignals(sigs);
      setLocal(locs);
      setLastUpdated(Date.now());
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 20s while the panel is visible.
  useEffect(() => {
    if (!isActive) return;
    load();
    const t = setInterval(load, 20_000);
    return () => clearInterval(t);
  }, [isActive, load]);

  // Tick relative timestamps + rotate the ticker.
  useEffect(() => {
    if (!isActive) return;
    const clock  = setInterval(() => setNow(Date.now()), 30_000);
    const ticker = setInterval(() => setTickerIdx((i) => i + 1), 4000);
    return () => { clearInterval(clock); clearInterval(ticker); };
  }, [isActive]);

  const bullish    = signals.filter((s) => s.signal_direction === "bullish").length;
  const bearish    = signals.filter((s) => s.signal_direction === "bearish").length;
  const highImpact = signals.filter((s) => s.is_high_impact);
  const ticker     = highImpact.length > 0 ? highImpact : signals;
  const tickerItem = ticker.length > 0 ? ticker[tickerIdx % ticker.length] : null;

  return (
    <div className="h-full w-full overflow-y-auto" style={{ background: CAVE.deep }}>
      <style>{`
        @keyframes mk-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mk-dot  { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
      `}</style>

      <div className="max-w-5xl mx-auto px-5 md:px-6 py-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${GEM.green}12`, border: `1px solid ${GEM.green}28` }}>
              <Radio className="w-4 h-4" style={{ color: GEM.green }} />
            </div>
            <div>
              <h1 className="text-[18px] font-black text-white tracking-tight leading-none">Market Intelligence</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="inline-flex h-full w-full rounded-full" style={{ background: GEM.green, animation: "mk-dot 1.4s ease-in-out infinite" }} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: GEM.green }}>Live</span>
                <span className="text-[10px] text-neutral-600">· updated {lastUpdated ? timeAgo(new Date(lastUpdated).toISOString(), now) : "—"}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <Stat value={signals.length} label="Signals" color="#fff" />
            <Stat value={bullish} label="Bullish" color={GEM.green} />
            <Stat value={bearish} label="Bearish" color={GEM.red} />
            <Stat value={highImpact.length} label="High impact" color={GEM.yellow} />
          </div>
        </div>

        {/* Ticker */}
        {tickerItem && (
          <div className="mt-5 rounded-xl px-3.5 py-2.5 flex items-center gap-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CAVE.stoneEdge}` }}>
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shrink-0" style={{ color: "#000", background: GEM.yellow }}>Tape</span>
            {(() => { const d = dirConfig(tickerItem.signal_direction); return <d.Icon className="w-3.5 h-3.5 shrink-0" style={{ color: d.color }} />; })()}
            <p className="text-[12px] text-neutral-300 truncate flex-1">{tickerItem.headline}</p>
            <span className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: dirConfig(tickerItem.signal_direction).color }}>{tickerItem.impact_score}</span>
          </div>
        )}

        {/* Two columns: market feed + local intelligence */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Market feed */}
          <div className="lg:col-span-3 space-y-2.5">
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1">Market Feed</p>
            {loading && signals.length === 0 && (
              <div className="flex items-center gap-2 px-1 py-8 justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-neutral-800 animate-spin" style={{ borderTopColor: GEM.green }} />
                <span className="text-[11px] text-neutral-600">Scanning the market…</span>
              </div>
            )}
            {!loading && signals.length === 0 && (
              <p className="text-[12px] text-neutral-600 px-1 py-6 text-center">No market signals yet.</p>
            )}
            {signals.map((s) => (
              <SignalRow key={s.id} s={s} isNew={newIds.has(s.id)} now={now} />
            ))}
          </div>

          {/* Local intelligence */}
          <div className="lg:col-span-2 space-y-2.5">
            <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Local Intelligence
            </p>
            {loading && local.length === 0 && (
              <div className="flex items-center justify-center px-1 py-8">
                <div className="w-4 h-4 rounded-full border-2 border-neutral-800 animate-spin" style={{ borderTopColor: GEM.green }} />
              </div>
            )}
            {!loading && local.length === 0 && (
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CAVE.stoneEdge}` }}>
                <p className="text-[12px] text-neutral-400 font-medium">No local signals yet</p>
                <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">Mine your ZIP codes in Lead Machine to surface motivated sellers in your territory here.</p>
              </div>
            )}
            {local.slice(0, 24).map((l) => (
              <LocalCard key={l.id} l={l} isNew={newIds.has(l.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
