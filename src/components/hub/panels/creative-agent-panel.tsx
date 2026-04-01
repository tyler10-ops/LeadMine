"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Copy,
  Download,
  RefreshCw,
  ImageIcon,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  SlidersHorizontal,
  Clock,
} from "lucide-react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import type { AdCreative, CreativeLeadType } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CreativeAgentPanelProps {
  isActive: boolean;
  realtorSlug?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const EQUITY_BANDS = [
  "$50K–$150K", "$150K–$300K", "$200K–$400K",
  "$300K–$500K", "$400K+", "$500K+",
];

const PROPERTY_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "condo",         label: "Condo"         },
  { value: "multi_family",  label: "Multi-Family"  },
  { value: "townhouse",     label: "Townhouse"      },
  { value: "land",          label: "Land"           },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

const PLATFORMS = ["Meta", "Instagram", "Google", "TikTok"];

// ── Helpers ────────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: GEM.green + "aa" }}>
      {children}
    </p>
  );
}

function CopyBadge({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className={cn(
        "shrink-0 flex items-center justify-center rounded-lg transition-colors",
        small ? "w-5 h-5" : "w-6 h-6"
      )}
      style={{
        background: copied ? `${GEM.green}18` : "rgba(255,255,255,0.05)",
        border: `1px solid ${copied ? GEM.green + "40" : "rgba(255,255,255,0.08)"}`,
        color: copied ? GEM.green : "#525252",
      }}
    >
      {copied
        ? <CheckCircle2 className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
        : <Copy className={small ? "w-2.5 h-2.5" : "w-3 h-3"} />
      }
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CreativeAgentPanel({ isActive }: CreativeAgentPanelProps) {
  // Form state
  const [county, setCounty]           = useState("");
  const [state, setState]             = useState("TX");
  const [leadType, setLeadType]       = useState<CreativeLeadType>("sellers");
  const [equityBand, setEquityBand]   = useState(EQUITY_BANDS[2]);
  const [propertyType, setPropertyType] = useState("single_family");
  const [leadCount, setLeadCount]     = useState(24);

  // Generation state
  const [loading, setLoading]         = useState(false);
  const [creative, setCreative]       = useState<AdCreative | null>(null);
  const [history, setHistory]         = useState<AdCreative[]>([]);
  const [error, setError]             = useState("");

  // Copy carousel
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [bodyIdx, setBodyIdx]         = useState(0);

  const handleGenerate = useCallback(async () => {
    if (!county.trim()) { setError("Enter a county name"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/creative/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ county: county.trim(), state, leadType, equityBand, propertyType, leadCount }),
      });

      if (!res.ok) { setError("Generation failed. Please try again."); return; }

      const data = await res.json() as AdCreative;
      setCreative(data);
      setHeadlineIdx(0);
      setBodyIdx(0);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [county, state, leadType, equityBand, propertyType, leadCount]);

  const inputStyle = {
    background: CAVE.surface2,
    border: `1px solid ${CAVE.stoneEdge}`,
    color: "#e5e5e5",
    outline: "none",
  };

  return (
    <div
      className={cn(
        "h-full flex transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── LEFT — Controls ──────────────────────────────────────────────── */}
      <div
        className="w-60 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5" style={{ color: GEM.green }} />
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-widest">Creative Agent</span>
          </div>
          <p className="text-[10px] text-neutral-600 leading-relaxed">
            Generate hyper-local ad copy and visuals from your mined lead data.
          </p>
        </div>

        {/* County + State */}
        <div className="space-y-2">
          <SectionLabel>Target Area</SectionLabel>
          <div className="flex gap-2">
            <input
              type="text"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              placeholder="County name"
              className="flex-1 min-w-0 rounded-xl px-3 py-2 text-[12px] placeholder:text-neutral-700"
              style={inputStyle}
            />
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-14 rounded-xl px-2 py-2 text-[11px] appearance-none text-center"
              style={inputStyle}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s} style={{ background: "#0d0d14" }}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lead Type */}
        <div>
          <SectionLabel>Lead Type</SectionLabel>
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: CAVE.stoneEdge }}>
            {(["buyers", "both", "sellers"] as const).map((opt) => {
              const active = leadType === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setLeadType(opt)}
                  className="flex-1 py-1.5 text-[10px] font-semibold capitalize transition-all"
                  style={{
                    background: active ? `${GEM.green}18` : CAVE.surface2,
                    color: active ? GEM.green : "#525252",
                    borderRight: opt !== "sellers" ? `1px solid ${CAVE.stoneEdge}` : undefined,
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Equity Band */}
        <div>
          <SectionLabel>Equity Band</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {EQUITY_BANDS.map((band) => {
              const active = equityBand === band;
              return (
                <button
                  key={band}
                  onClick={() => setEquityBand(band)}
                  className="text-[10px] px-2 py-1 rounded-lg border font-medium transition-all"
                  style={{
                    background: active ? `${GEM.yellow}15` : CAVE.surface2,
                    borderColor: active ? `${GEM.yellow}40` : CAVE.stoneEdge,
                    color: active ? GEM.yellow : "#525252",
                  }}
                >
                  {band}
                </button>
              );
            })}
          </div>
        </div>

        {/* Property Type */}
        <div>
          <SectionLabel>Property Type</SectionLabel>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-[12px] appearance-none"
            style={inputStyle}
          >
            {PROPERTY_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value} style={{ background: "#0d0d14" }}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Lead Count */}
        <div>
          <div className="flex justify-between mb-1">
            <SectionLabel>Lead Count</SectionLabel>
            <span className="text-[10px] font-semibold" style={{ color: GEM.yellow }}>{leadCount}</span>
          </div>
          <input
            type="range" min={1} max={200} step={1}
            value={leadCount}
            onChange={(e) => setLeadCount(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              accentColor: GEM.yellow,
              background: `linear-gradient(to right, ${GEM.yellow} ${(leadCount / 200) * 100}%, rgba(255,255,255,0.12) ${(leadCount / 200) * 100}%)`,
            }}
          />
          <p className="text-[10px] text-neutral-700 mt-1">Prospects from your last mine</p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[11px] px-3 py-2 rounded-lg" style={{ color: GEM.red, background: `${GEM.red}10`, border: `1px solid ${GEM.red}25` }}>
            {error}
          </p>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 text-[12px] font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: GEM.green, boxShadow: loading ? "none" : GLOW.green.soft }}
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin text-black" /> Generating…</>
            : <><Sparkles className="w-3.5 h-3.5" /> Generate Creative</>
          }
        </button>

        {/* History */}
        {history.length > 0 && (
          <div>
            <SectionLabel>Recent</SectionLabel>
            <div className="space-y-1.5">
              {history.slice(0, 5).map((h) => (
                <button
                  key={h.id}
                  onClick={() => { setCreative(h); setHeadlineIdx(0); setBodyIdx(0); }}
                  className="w-full text-left px-3 py-2 rounded-xl transition-colors flex items-center gap-2"
                  style={{
                    background: creative?.id === h.id ? `${GEM.green}10` : CAVE.surface2,
                    border: `1px solid ${creative?.id === h.id ? GEM.green + "30" : CAVE.stoneEdge}`,
                  }}
                >
                  <Clock className="w-3 h-3 shrink-0 text-neutral-600" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-neutral-300 truncate">{h.county} Co., {h.state}</p>
                    <p className="text-[9px] text-neutral-600 truncate">{h.lead_type} · {h.equity_band}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── CENTER — Results ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!creative && !loading ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: `${GEM.green}10`, border: `1px solid ${GEM.green}20` }}
            >
              <Megaphone className="w-7 h-7" style={{ color: GEM.green }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-300 mb-1">Ready to generate</p>
              <p className="text-[12px] text-neutral-600 max-w-xs leading-relaxed">
                Configure your target area and lead parameters on the left, then click Generate Creative.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-2 w-full max-w-sm">
              {["Ad Copy", "Images", "Platform Sizes"].map((f) => (
                <div key={f} className="rounded-xl p-3 text-center" style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}>
                  <p className="text-[10px] font-semibold text-neutral-500">{f}</p>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          /* Loading state */
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: GEM.green }} />
            <p className="text-[13px] font-semibold text-neutral-300">Generating creative set…</p>
            <p className="text-[11px] text-neutral-600">Copy + images being created in parallel</p>
          </div>
        ) : creative ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* County badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                  style={{ background: `${GEM.green}15`, color: GEM.green, border: `1px solid ${GEM.green}30` }}
                >
                  {creative.county} Co., {creative.state}
                </span>
                <span className="text-[10px] text-neutral-600">{creative.lead_type} · {creative.equity_band} · {creative.lead_count} prospects</span>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold transition-colors"
                style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}`, color: "#737373" }}
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </div>

            {/* Local Hook */}
            <div className="rounded-xl p-4" style={{ background: `${GEM.green}08`, border: `1px solid ${GEM.green}20` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: GEM.green + "99" }}>Local Hook</p>
                  <p className="text-[13px] text-neutral-200 leading-relaxed">{creative.copy.localHook}</p>
                </div>
                <CopyBadge text={creative.copy.localHook} />
              </div>
            </div>

            {/* Headlines carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Headlines</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600">{headlineIdx + 1} / {creative.copy.headlines.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setHeadlineIdx((i) => Math.max(0, i - 1))} disabled={headlineIdx === 0} className="w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-30" style={{ background: CAVE.surface2 }}>
                      <ChevronLeft className="w-3 h-3 text-neutral-500" />
                    </button>
                    <button onClick={() => setHeadlineIdx((i) => Math.min(creative.copy.headlines.length - 1, i + 1))} disabled={headlineIdx === creative.copy.headlines.length - 1} className="w-5 h-5 rounded flex items-center justify-center transition-colors disabled:opacity-30" style={{ background: CAVE.surface2 }}>
                      <ChevronRight className="w-3 h-3 text-neutral-500" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}>
                <p className="text-[15px] font-semibold text-neutral-100">{creative.copy.headlines[headlineIdx]}</p>
                <CopyBadge text={creative.copy.headlines[headlineIdx]} />
              </div>
              {/* All headlines as chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {creative.copy.headlines.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => setHeadlineIdx(i)}
                    className="text-[10px] px-2 py-1 rounded-lg border transition-all truncate max-w-[160px]"
                    style={{
                      background: i === headlineIdx ? `${GEM.green}12` : CAVE.surface2,
                      borderColor: i === headlineIdx ? `${GEM.green}30` : CAVE.stoneEdge,
                      color: i === headlineIdx ? GEM.green : "#525252",
                    }}
                    title={h}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Body Copy carousel */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Primary Text</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-600">{bodyIdx + 1} / {creative.copy.primaryText.length}</span>
                  <div className="flex gap-1">
                    <button onClick={() => setBodyIdx((i) => Math.max(0, i - 1))} disabled={bodyIdx === 0} className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-30" style={{ background: CAVE.surface2 }}>
                      <ChevronLeft className="w-3 h-3 text-neutral-500" />
                    </button>
                    <button onClick={() => setBodyIdx((i) => Math.min(creative.copy.primaryText.length - 1, i + 1))} disabled={bodyIdx === creative.copy.primaryText.length - 1} className="w-5 h-5 rounded flex items-center justify-center disabled:opacity-30" style={{ background: CAVE.surface2 }}>
                      <ChevronRight className="w-3 h-3 text-neutral-500" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-xl p-4 flex items-start justify-between gap-3" style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}>
                <p className="text-[13px] text-neutral-300 leading-relaxed">{creative.copy.primaryText[bodyIdx]}</p>
                <CopyBadge text={creative.copy.primaryText[bodyIdx]} />
              </div>
            </div>

            {/* CTAs */}
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">CTAs</p>
              <div className="flex gap-2 flex-wrap">
                {creative.copy.ctas.map((cta, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${GEM.yellow}10`, border: `1px solid ${GEM.yellow}25` }}>
                    <span className="text-[12px] font-semibold" style={{ color: GEM.yellow }}>{cta}</span>
                    <CopyBadge text={cta} small />
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Image Variants</p>
              <div className="grid grid-cols-3 gap-3">
                {creative.images.map((img) => (
                  <div key={img.style} className="relative rounded-xl overflow-hidden group" style={{ border: `1px solid ${CAVE.stoneEdge}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.style}
                      className="w-full aspect-[4/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="w-full p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-[10px] font-semibold text-white capitalize">{img.style.replace("_", " ")}</p>
                      </div>
                    </div>
                    {img.status === "error" && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: GEM.yellow }}>
                        <span className="text-[8px] font-black text-black">!</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-700 mt-2">
                {process.env.NODE_ENV === "development" && !creative.images[0].url.includes("fal.run")
                  ? "Preview images — add FAL_API_KEY to enable Flux generation"
                  : "AI-generated via Flux · Ready for ad upload"
                }
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── RIGHT — Export & Info ────────────────────────────────────────── */}
      <div
        className="w-52 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
        style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        <div>
          <div className="flex items-center gap-1.5 mb-4">
            <SlidersHorizontal className="w-3 h-3 text-neutral-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Export</span>
          </div>

          {/* Platform badges */}
          <div className="space-y-1.5 mb-4">
            <SectionLabel>Platforms</SectionLabel>
            {PLATFORMS.map((p) => (
              <div key={p} className="flex items-center justify-between px-3 py-1.5 rounded-xl" style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}>
                <span className="text-[11px] text-neutral-400">{p}</span>
                <span className="text-[9px] text-neutral-700">{p === "Meta" || p === "Instagram" ? "Ready" : "Soon"}</span>
              </div>
            ))}
          </div>

          {/* Download button */}
          <button
            disabled={!creative}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: creative ? `${GEM.green}15` : CAVE.surface2,
              border: `1px solid ${creative ? GEM.green + "30" : CAVE.stoneEdge}`,
              color: creative ? GEM.green : "#525252",
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Download Package
          </button>
        </div>

        {/* Ad Specs */}
        <div>
          <SectionLabel>Ad Specs</SectionLabel>
          <div className="space-y-2">
            {[
              { label: "Headlines",   value: "≤ 40 chars", note: "Meta limit" },
              { label: "Body copy",   value: "≤ 125 chars", note: "Sweet spot" },
              { label: "Images",     value: "4:3 ratio",   note: "All formats" },
              { label: "Category",   value: "Housing",     note: "Meta required" },
            ].map((spec) => (
              <div key={spec.label} className="flex items-center justify-between">
                <span className="text-[10px] text-neutral-600">{spec.label}</span>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-neutral-400">{spec.value}</span>
                  <p className="text-[9px] text-neutral-700">{spec.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image generation status */}
        <div>
          <SectionLabel>Image Engine</SectionLabel>
          <div className="rounded-xl p-3 space-y-1.5" style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3 h-3" style={{ color: GEM.green }} />
              <span className="text-[10px] font-semibold text-neutral-300">Flux Schnell</span>
            </div>
            <p className="text-[9px] text-neutral-600 leading-relaxed">
              Add <code className="text-neutral-500">FAL_API_KEY</code> to .env.local to enable AI image generation. Preview images shown until configured.
            </p>
          </div>
        </div>

        {/* Pipeline note */}
        <div className="rounded-xl p-3" style={{ background: `${GEM.yellow}08`, border: `1px solid ${GEM.yellow}20` }}>
          <p className="text-[10px] font-semibold mb-1" style={{ color: GEM.yellow }}>Phase 2</p>
          <p className="text-[9px] text-neutral-600 leading-relaxed">
            One-click Meta Ads launch coming. Connect your Ad Account to activate.
          </p>
        </div>
      </div>
    </div>
  );
}
