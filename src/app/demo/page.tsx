"use client";

import { useState, useEffect, useRef } from "react";
import { GEM, GLOW } from "@/lib/cave-theme";

type CallPhase = "idle" | "calling" | "ringing" | "in-progress" | "ended" | "failed";

const INTENT_OPTIONS = [
  { value: "seller",   label: "Selling",   sub: "Looking to list",      color: GEM.green,   glow: GLOW.green   },
  { value: "buyer",    label: "Buying",    sub: "Looking to purchase",  color: GEM.diamond, glow: GLOW.diamond },
  { value: "investor", label: "Investing", sub: "Portfolio / rental",   color: GEM.yellow,  glow: GLOW.yellow  },
  { value: "unknown",  label: "General",   sub: "Not sure yet",         color: "#888",      glow: null         },
];

// ── Gem data — true diamond shape via clip-path polygon ───────────────────
// { x%, y%, w(px), h(px), color, glowColor, animDelay, opacity }
// w < h = tall diamond (classic gem), w > h = wide diamond (table cut)
// Spread from top (~5%) to bottom (~92%) with density increasing downward

const LEFT_GEMS = [
  // Top sparse — tiny diamonds drifting high
  { x: 15, y:  6, w: 12, h: 18, c: GEM.green,   gc: "#00FF88", d: "2.1s", o: 0.35 },
  { x: 72, y:  9, w: 10, h: 16, c: GEM.diamond, gc: "#00FFD4", d: "0.8s", o: 0.30 },
  { x: 44, y: 13, w: 14, h: 20, c: GEM.yellow,  gc: "#FFD60A", d: "1.5s", o: 0.38 },
  { x: 88, y: 11, w: 10, h: 14, c: GEM.green,   gc: "#00FF88", d: "3.0s", o: 0.28 },
  { x: 28, y: 18, w: 16, h: 22, c: GEM.diamond, gc: "#00FFD4", d: "0.4s", o: 0.40 },
  // Upper section — small-med scattered
  { x: 60, y: 22, w: 18, h: 26, c: GEM.green,   gc: "#00FF88", d: "1.2s", o: 0.45 },
  { x: 10, y: 25, w: 14, h: 20, c: GEM.yellow,  gc: "#FFD60A", d: "2.4s", o: 0.42 },
  { x: 82, y: 20, w: 16, h: 24, c: GEM.diamond, gc: "#00FFD4", d: "0.7s", o: 0.44 },
  { x: 38, y: 28, w: 20, h: 30, c: GEM.green,   gc: "#00FF88", d: "1.8s", o: 0.48 },
  { x: 94, y: 30, w: 12, h: 18, c: GEM.yellow,  gc: "#FFD60A", d: "0.3s", o: 0.38 },
  { x: 20, y: 34, w: 22, h: 32, c: GEM.diamond, gc: "#00FFD4", d: "2.7s", o: 0.52 },
  { x: 68, y: 32, w: 18, h: 28, c: GEM.green,   gc: "#00FF88", d: "1.0s", o: 0.50 },
  // Mid section — growing denser
  { x: 50, y: 38, w: 26, h: 38, c: GEM.yellow,  gc: "#FFD60A", d: "0.6s", o: 0.58 },
  { x: 8,  y: 40, w: 20, h: 30, c: GEM.green,   gc: "#00FF88", d: "1.9s", o: 0.54 },
  { x: 78, y: 38, w: 24, h: 34, c: GEM.diamond, gc: "#00FFD4", d: "2.2s", o: 0.60 },
  { x: 32, y: 43, w: 28, h: 40, c: GEM.green,   gc: "#00FF88", d: "0.5s", o: 0.62 },
  { x: 90, y: 44, w: 18, h: 26, c: GEM.yellow,  gc: "#FFD60A", d: "1.4s", o: 0.55 },
  { x: 55, y: 47, w: 32, h: 46, c: GEM.diamond, gc: "#00FFD4", d: "0.9s", o: 0.68 },
  { x: 18, y: 50, w: 26, h: 36, c: GEM.green,   gc: "#00FF88", d: "2.0s", o: 0.65 },
  // Lower-mid — main body of pile
  { x: 72, y: 52, w: 36, h: 52, c: GEM.green,   gc: "#00FF88", d: "0.2s", o: 0.78 },
  { x: 40, y: 55, w: 42, h: 58, c: GEM.diamond, gc: "#00FFD4", d: "1.3s", o: 0.82 },
  { x: 86, y: 56, w: 28, h: 40, c: GEM.yellow,  gc: "#FFD60A", d: "0.7s", o: 0.74 },
  { x: 22, y: 57, w: 30, h: 44, c: GEM.green,   gc: "#00FF88", d: "1.7s", o: 0.76 },
  { x: 62, y: 60, w: 38, h: 54, c: GEM.yellow,  gc: "#FFD60A", d: "0.4s", o: 0.80 },
  { x: 6,  y: 61, w: 24, h: 36, c: GEM.diamond, gc: "#00FFD4", d: "2.3s", o: 0.70 },
  // Dense lower — big gems clustered right-center
  { x: 50, y: 65, w: 50, h: 68, c: GEM.green,   gc: "#00FF88", d: "0.0s", o: 0.90 },
  { x: 76, y: 67, w: 44, h: 60, c: GEM.diamond, gc: "#00FFD4", d: "1.1s", o: 0.88 },
  { x: 30, y: 69, w: 40, h: 56, c: GEM.yellow,  gc: "#FFD60A", d: "0.6s", o: 0.85 },
  { x: 92, y: 71, w: 32, h: 46, c: GEM.green,   gc: "#00FF88", d: "1.8s", o: 0.82 },
  { x: 14, y: 72, w: 36, h: 50, c: GEM.diamond, gc: "#00FFD4", d: "0.3s", o: 0.84 },
  // Floor level — widest, heaviest
  { x: 60, y: 78, w: 46, h: 62, c: GEM.diamond, gc: "#00FFD4", d: "0.8s", o: 0.92 },
  { x: 36, y: 80, w: 38, h: 52, c: GEM.green,   gc: "#00FF88", d: "1.5s", o: 0.88 },
  { x: 82, y: 79, w: 34, h: 48, c: GEM.yellow,  gc: "#FFD60A", d: "0.2s", o: 0.86 },
  { x: 10, y: 81, w: 30, h: 42, c: GEM.green,   gc: "#00FF88", d: "2.0s", o: 0.80 },
  { x: 52, y: 86, w: 28, h: 36, c: GEM.diamond, gc: "#00FFD4", d: "1.0s", o: 0.75 },
  { x: 26, y: 87, w: 22, h: 30, c: GEM.yellow,  gc: "#FFD60A", d: "0.5s", o: 0.70 },
  { x: 74, y: 86, w: 20, h: 28, c: GEM.green,   gc: "#00FF88", d: "1.6s", o: 0.68 },
  { x: 95, y: 88, w: 16, h: 22, c: GEM.diamond, gc: "#00FFD4", d: "2.5s", o: 0.60 },
];

const RIGHT_GEMS = [
  // Top sparse — different pattern from left
  { x: 85, y:  7, w: 12, h: 18, c: GEM.yellow,  gc: "#FFD60A", d: "1.3s", o: 0.32 },
  { x: 30, y:  8, w: 10, h: 16, c: GEM.green,   gc: "#00FF88", d: "2.6s", o: 0.28 },
  { x: 58, y: 12, w: 14, h: 20, c: GEM.diamond, gc: "#00FFD4", d: "0.6s", o: 0.36 },
  { x: 12, y: 10, w: 10, h: 14, c: GEM.yellow,  gc: "#FFD60A", d: "1.9s", o: 0.30 },
  { x: 72, y: 16, w: 16, h: 22, c: GEM.green,   gc: "#00FF88", d: "0.2s", o: 0.40 },
  // Upper section
  { x: 42, y: 21, w: 18, h: 26, c: GEM.diamond, gc: "#00FFD4", d: "1.5s", o: 0.44 },
  { x: 90, y: 23, w: 14, h: 20, c: GEM.green,   gc: "#00FF88", d: "0.9s", o: 0.40 },
  { x: 20, y: 19, w: 16, h: 24, c: GEM.yellow,  gc: "#FFD60A", d: "2.2s", o: 0.42 },
  { x: 62, y: 27, w: 20, h: 30, c: GEM.green,   gc: "#00FF88", d: "0.4s", o: 0.50 },
  { x: 6,  y: 29, w: 12, h: 18, c: GEM.diamond, gc: "#00FFD4", d: "3.1s", o: 0.38 },
  { x: 80, y: 33, w: 22, h: 32, c: GEM.yellow,  gc: "#FFD60A", d: "1.1s", o: 0.52 },
  { x: 36, y: 31, w: 18, h: 28, c: GEM.diamond, gc: "#00FFD4", d: "2.8s", o: 0.48 },
  // Mid section
  { x: 52, y: 37, w: 26, h: 38, c: GEM.green,   gc: "#00FF88", d: "0.7s", o: 0.58 },
  { x: 94, y: 39, w: 20, h: 30, c: GEM.diamond, gc: "#00FFD4", d: "1.6s", o: 0.54 },
  { x: 24, y: 41, w: 24, h: 34, c: GEM.yellow,  gc: "#FFD60A", d: "0.1s", o: 0.60 },
  { x: 70, y: 42, w: 28, h: 40, c: GEM.green,   gc: "#00FF88", d: "2.0s", o: 0.62 },
  { x: 10, y: 45, w: 18, h: 26, c: GEM.diamond, gc: "#00FFD4", d: "1.3s", o: 0.56 },
  { x: 46, y: 48, w: 32, h: 46, c: GEM.yellow,  gc: "#FFD60A", d: "0.5s", o: 0.68 },
  { x: 84, y: 49, w: 26, h: 36, c: GEM.green,   gc: "#00FF88", d: "1.8s", o: 0.64 },
  // Lower-mid
  { x: 28, y: 52, w: 36, h: 52, c: GEM.diamond, gc: "#00FFD4", d: "0.3s", o: 0.78 },
  { x: 60, y: 54, w: 42, h: 58, c: GEM.yellow,  gc: "#FFD60A", d: "1.4s", o: 0.82 },
  { x: 14, y: 56, w: 28, h: 40, c: GEM.green,   gc: "#00FF88", d: "0.8s", o: 0.74 },
  { x: 78, y: 55, w: 30, h: 44, c: GEM.diamond, gc: "#00FFD4", d: "2.1s", o: 0.76 },
  { x: 40, y: 59, w: 38, h: 54, c: GEM.green,   gc: "#00FF88", d: "0.6s", o: 0.80 },
  { x: 95, y: 60, w: 24, h: 36, c: GEM.yellow,  gc: "#FFD60A", d: "1.7s", o: 0.70 },
  // Dense lower — clustered left-center (opposite of left pile)
  { x: 38, y: 64, w: 50, h: 68, c: GEM.yellow,  gc: "#FFD60A", d: "0.0s", o: 0.90 },
  { x: 18, y: 66, w: 44, h: 60, c: GEM.green,   gc: "#00FF88", d: "1.2s", o: 0.88 },
  { x: 62, y: 68, w: 40, h: 56, c: GEM.diamond, gc: "#00FFD4", d: "0.4s", o: 0.85 },
  { x: 4,  y: 70, w: 32, h: 46, c: GEM.yellow,  gc: "#FFD60A", d: "1.9s", o: 0.82 },
  { x: 84, y: 69, w: 36, h: 50, c: GEM.green,   gc: "#00FF88", d: "0.7s", o: 0.84 },
  // Floor level
  { x: 30, y: 77, w: 46, h: 62, c: GEM.green,   gc: "#00FF88", d: "0.9s", o: 0.92 },
  { x: 58, y: 79, w: 38, h: 52, c: GEM.diamond, gc: "#00FFD4", d: "1.6s", o: 0.88 },
  { x: 14, y: 80, w: 34, h: 48, c: GEM.yellow,  gc: "#FFD60A", d: "0.3s", o: 0.86 },
  { x: 82, y: 78, w: 30, h: 42, c: GEM.green,   gc: "#00FF88", d: "2.2s", o: 0.80 },
  { x: 46, y: 85, w: 28, h: 36, c: GEM.diamond, gc: "#00FFD4", d: "1.1s", o: 0.75 },
  { x: 74, y: 87, w: 22, h: 30, c: GEM.yellow,  gc: "#FFD60A", d: "0.6s", o: 0.70 },
  { x: 4,  y: 86, w: 20, h: 28, c: GEM.green,   gc: "#00FF88", d: "1.8s", o: 0.68 },
  { x: 92, y: 89, w: 16, h: 22, c: GEM.diamond, gc: "#00FFD4", d: "2.4s", o: 0.60 },
];

// ── Gem pile component ─────────────────────────────────────────────────────

function GemPile({ gems, side }: { gems: typeof LEFT_GEMS; side: "left" | "right" }) {
  return (
    <div className="relative w-full h-full overflow-hidden">

      {/* Deep floor glow */}
      <div className="absolute bottom-0 left-0 right-0 h-96 pointer-events-none" style={{
        background: `radial-gradient(ellipse 110% 70% at 50% 105%,
          rgba(0,255,136,0.20) 0%,
          rgba(0,255,212,0.11) 30%,
          rgba(255,214,10,0.06) 55%,
          transparent 75%)`,
      }} />
      <div className="absolute bottom-0 left-0 right-0 h-56 pointer-events-none" style={{
        background: `radial-gradient(ellipse 65% 45% at 50% 100%, rgba(0,255,136,0.09) 0%, transparent 70%)`,
      }} />

      {/* Inward bleed toward form */}
      <div className="absolute inset-y-0 w-20 pointer-events-none" style={{
        [side === "left" ? "right" : "left"]: 0,
        background: side === "left"
          ? "linear-gradient(to right, transparent, rgba(0,255,136,0.04))"
          : "linear-gradient(to left,  transparent, rgba(0,255,136,0.04))",
      }} />

      {/* Dust motes */}
      {[...Array(18)].map((_, i) => (
        <div key={i} className="absolute rounded-full animate-pulse pointer-events-none" style={{
          width:  i % 5 === 0 ? "2px" : "1px",
          height: i % 5 === 0 ? "2px" : "1px",
          left:   `${4 + (i * 5.1 + (side === "right" ? 19 : 0)) % 92}%`,
          top:    `${5  + (i * 9.3 + (side === "right" ? 11 : 0)) % 80}%`,
          background: i % 3 === 0 ? GEM.green : i % 3 === 1 ? GEM.diamond : GEM.yellow,
          opacity: 0.35,
          animationDelay:    `${i * 0.32}s`,
          animationDuration: `${2.5 + (i % 7) * 0.6}s`,
        }} />
      ))}

      {/* Gems — true diamond via clip-path, glow via filter drop-shadow */}
      {gems.map((gem, i) => (
        <div key={i} className="absolute pointer-events-none"
          style={{ left: `${gem.x}%`, top: `${gem.y}%` }}>

          {/* Bloom glow — radial behind the gem, no clip so glow spreads freely */}
          <div className="absolute animate-pulse" style={{
            width:     gem.w * 3.5,
            height:    gem.h * 3.5,
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${gem.gc}28 0%, transparent 65%)`,
            borderRadius: "50%",
            animationDelay:    gem.d,
            animationDuration: `${3.5 + (i % 7) * 0.8}s`,
          }} />

          {/* Diamond body — clip-path gives true rhombus, drop-shadow gives glow */}
          <div className="absolute animate-pulse" style={{
            width:     gem.w,
            height:    gem.h,
            transform: "translate(-50%, -50%)",
            clipPath:  "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            background: `linear-gradient(160deg,
              rgba(255,255,255,0.55) 0%,
              ${gem.c} 20%,
              ${gem.c}ee 55%,
              ${gem.c}99 100%)`,
            filter: `drop-shadow(0 0 ${Math.round(gem.w * 0.35)}px ${gem.gc}cc)
                     drop-shadow(0 0 ${Math.round(gem.w * 0.7)}px ${gem.gc}66)`,
            opacity:    gem.o,
            animationDelay:    gem.d,
            animationDuration: `${3 + (i % 6) * 0.75}s`,
          }} />

          {/* Upper facet shimmer — smaller diamond overlay for cut-gem look */}
          <div className="absolute" style={{
            width:     gem.w * 0.45,
            height:    gem.h * 0.45,
            transform: "translate(-80%, -88%)",
            clipPath:  "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            background: "linear-gradient(160deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.1) 70%, transparent 100%)",
            opacity: 0.7,
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Intent selector ────────────────────────────────────────────────────────

function IntentSelector({ value, onChange, disabled }: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {INTENT_OPTIONS.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            className="relative flex flex-col items-start px-3 py-2.5 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden"
            style={{
              background:  active ? `${opt.color}12` : "#0a0a0a",
              border:      `1px solid ${active ? opt.color + "44" : "rgba(255,255,255,0.07)"}`,
              boxShadow:   active && opt.glow ? `inset 0 0 20px ${opt.color}0a, ${opt.glow.soft}` : "none",
            }}
          >
            {/* Gem dot */}
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="flex-shrink-0"
                style={{
                  width:        8,
                  height:       8,
                  transform:    "rotate(45deg)",
                  background:   active ? opt.color : "rgba(255,255,255,0.15)",
                  boxShadow:    active && opt.glow ? opt.glow.soft : "none",
                  borderRadius: "1px",
                }}
              />
              <span
                className="text-xs font-semibold tracking-wide"
                style={{ color: active ? opt.color : "#555" }}
              >
                {opt.label}
              </span>
            </div>
            <span className="text-xs pl-3.5" style={{ color: active ? opt.color + "88" : "#333" }}>
              {opt.sub}
            </span>

            {/* Active corner accent */}
            {active && (
              <div
                className="absolute top-0 right-0 w-8 h-8 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${opt.color}22, transparent 70%)`,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [phone, setPhone]                     = useState("");
  const [leadName, setLeadName]               = useState("");
  const [intent, setIntent]                   = useState("seller");
  const [realtorName, setRealtorName]         = useState("Mike Johnson");
  const [realtorBusiness, setRealtorBusiness] = useState("Johnson Real Estate Group");

  const [phase, setPhase]     = useState<CallPhase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError]     = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const t0Ref    = useRef(0);

  useEffect(() => {
    if (phase === "ringing" || phase === "in-progress") {
      if (!timerRef.current) {
        t0Ref.current = Date.now();
        timerRef.current = setInterval(() => {
          setElapsed(Math.floor((Date.now() - t0Ref.current) / 1000));
        }, 1000);
      }
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  async function startCall() {
    if (!phone.trim()) return;
    setPhase("calling"); setError(null); setElapsed(0);
    try {
      const res  = await fetch("/api/demo/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name: leadName, intent, realtorName, realtorBusiness }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to start call"); setPhase("failed"); return; }
      setPhase("ringing");
      startPolling(data.vapi_call_id);
    } catch {
      setError("Network error — is the dev server running?");
      setPhase("failed");
    }
  }

  function startPolling(callId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/demo/call?id=${callId}`);
        const data = await res.json();
        if (data.status === "in-progress") setPhase("in-progress");
        else if (data.status === "ended") {
          setPhase("ended");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* keep polling */ }
    }, 3000);
    setTimeout(() => { if (pollRef.current) clearInterval(pollRef.current); }, 720000);
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("idle"); setElapsed(0); setError(null);
  }

  const isActive = phase !== "idle" && phase !== "failed";

  const statusColor =
    phase === "calling"     ? GEM.yellow  :
    phase === "ringing"     ? GEM.diamond :
    phase === "in-progress" ? GEM.green   :
    phase === "ended"       ? GEM.green   : GEM.red;

  const statusGlow =
    phase === "calling"     ? GLOW.yellow.medium  :
    phase === "ringing"     ? GLOW.diamond.medium :
    phase === "in-progress" ? GLOW.green.medium   :
    phase === "ended"       ? GLOW.green.soft      : GLOW.red.soft;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#000" }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0 z-10"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex-shrink-0" style={{
            transform: "rotate(45deg)",
            background: GEM.green,
            boxShadow: GLOW.green.medium,
            borderRadius: "3px",
          }} />
          <span className="font-semibold text-white tracking-tight">LeadMine</span>
          <span className="text-neutral-800 text-sm">/ AI Demo</span>
        </div>
        <div className="text-xs px-3 py-1 rounded-full border" style={{
          color: GEM.green, borderColor: GLOW.green.border, background: GLOW.green.bg,
        }}>
          Live
        </div>
      </header>

      {/* Three-column body */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left gem pile */}
        <div className="flex-1 relative">
          <GemPile gems={LEFT_GEMS} side="left" />
        </div>

        {/* Center form */}
        <div className="w-[420px] flex-shrink-0 flex flex-col justify-center py-10 px-2 relative z-10">

          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-white tracking-tight">Outbound AI Caller</h1>
            <p className="text-neutral-600 text-xs mt-1.5">
              Enter a lead — the AI calls, qualifies, and books the appointment.
            </p>
          </div>

          <div className="rounded-2xl border p-5 space-y-4" style={{
            background:     "rgba(255,255,255,0.025)",
            borderColor:    "rgba(255,255,255,0.07)",
            backdropFilter: "blur(20px)",
            boxShadow:      "0 0 80px rgba(0,0,0,0.9)",
          }}>

            {/* Phone */}
            <div>
              <label className="text-xs text-neutral-600 uppercase tracking-widest mb-1.5 block">
                Lead Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(205) 555-0100"
                disabled={isActive}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none disabled:opacity-40 transition-all"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.currentTarget.style.borderColor = GEM.green + "55"; e.currentTarget.style.boxShadow = GLOW.green.soft; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Name */}
            <div>
              <label className="text-xs text-neutral-600 uppercase tracking-widest mb-1.5 block">
                Lead Name <span className="text-neutral-800 normal-case tracking-normal">optional</span>
              </label>
              <input
                type="text"
                value={leadName}
                onChange={e => setLeadName(e.target.value)}
                placeholder="John Smith"
                disabled={isActive}
                className="w-full rounded-lg px-3 py-2.5 text-sm text-white placeholder-neutral-700 focus:outline-none disabled:opacity-40"
                style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.currentTarget.style.borderColor = GEM.green + "55"; e.currentTarget.style.boxShadow = GLOW.green.soft; }}
                onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            {/* Intent selector */}
            <div>
              <label className="text-xs text-neutral-600 uppercase tracking-widest mb-2 block">
                Lead Intent
              </label>
              <IntentSelector value={intent} onChange={setIntent} disabled={isActive} />
            </div>

            {/* Realtor */}
            <div className="pt-3 border-t grid grid-cols-2 gap-3"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div>
                <label className="text-xs text-neutral-600 uppercase tracking-widest mb-1.5 block">Realtor</label>
                <input
                  type="text"
                  value={realtorName}
                  onChange={e => setRealtorName(e.target.value)}
                  disabled={isActive}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none disabled:opacity-40"
                  style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = GEM.green + "55"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600 uppercase tracking-widest mb-1.5 block">Brokerage</label>
                <input
                  type="text"
                  value={realtorBusiness}
                  onChange={e => setRealtorBusiness(e.target.value)}
                  disabled={isActive}
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none disabled:opacity-40"
                  style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.borderColor = GEM.green + "55"; }}
                  onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </div>
            </div>

            {/* CTA */}
            {!isActive ? (
              <button
                onClick={startCall}
                disabled={!phone.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                style={{
                  background: phone.trim() ? GEM.green : "#111",
                  color:      phone.trim() ? "#000"    : "#333",
                  boxShadow:  phone.trim() ? GLOW.green.strong : "none",
                }}
              >
                Start Demo Call
              </button>
            ) : (
              <button
                onClick={reset}
                disabled={phase === "calling"}
                className="w-full py-3 rounded-xl font-medium text-sm text-neutral-600 disabled:opacity-30 transition-all"
                style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Status */}
          {phase !== "idle" && (
            <div className="mt-4 rounded-xl border p-4" style={{
              background:  "#050505",
              borderColor: statusColor + "30",
              boxShadow:   `inset 0 0 40px ${statusColor}08, 0 0 24px ${statusColor}08`,
            }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor, boxShadow: statusGlow }} />
                  {(phase === "ringing" || phase === "in-progress") && (
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: statusColor, opacity: 0.5 }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {phase === "calling"     && "Connecting…"}
                    {phase === "ringing"     && `Ringing ${phone}`}
                    {phase === "in-progress" && "Call in progress"}
                    {phase === "ended"       && "Call complete"}
                    {phase === "failed"      && "Call failed"}
                  </p>
                  <p className="text-xs text-neutral-700 mt-0.5 truncate">
                    {phase === "calling"     && "Sending to Vapi AI"}
                    {phase === "ringing"     && `Jordan is calling as ${realtorName}'s assistant`}
                    {phase === "in-progress" && "Qualifying and booking appointment"}
                    {phase === "ended"       && "Transcript saved in Vapi dashboard"}
                    {phase === "failed"      && (error ?? "Check terminal for details")}
                  </p>
                </div>
                {(phase === "ringing" || phase === "in-progress") && (
                  <span className="font-mono text-sm tabular-nums flex-shrink-0" style={{ color: statusColor }}>
                    {fmt(elapsed)}
                  </span>
                )}
              </div>

              {(phase === "in-progress" || phase === "ended") && (
                <div className="space-y-1.5 pt-3 border-t pl-1" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {[
                    { done: true,              text: `Introduced as Jordan for ${realtorName}` },
                    { done: true,              text: "Asking about real estate goals" },
                    { done: phase === "ended", text: "Qualifying timeline and motivation" },
                    { done: phase === "ended", text: "Booking appointment slot" },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                        background: step.done ? GEM.green : "rgba(255,255,255,0.07)",
                        boxShadow:  step.done ? GLOW.green.soft : "none",
                      }} />
                      <span style={{ color: step.done ? GEM.green : "#2e2e2e" }}>{step.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right gem pile */}
        <div className="flex-1 relative">
          <GemPile gems={RIGHT_GEMS} side="right" />
        </div>
      </div>

      <footer className="px-6 py-3 border-t text-center flex-shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <p className="text-xs text-neutral-800">Powered by Vapi.ai · OpenAI · LeadMine</p>
      </footer>
    </div>
  );
}
