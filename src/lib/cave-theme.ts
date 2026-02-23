/**
 * Cave Theme — Single source of truth for the Gem Mine design system.
 *
 * Both the landing page and dashboard import from here.
 * No accent color should be hardcoded anywhere else.
 */

// ── Gem color system (3 states only) ──────────────────────────────────────────

export const GEM = {
  green:  "#00FF88",   // Elite / Active / Bullish / Qualified
  yellow: "#FFD60A",   // Potential / Paused / Neutral / Pending
  red:    "#FF3B30",   // Rejected / Error / Bearish / Dead
} as const;

// ── Glow values (use for drop-shadow and box-shadow) ─────────────────────────

export const GLOW = {
  green: {
    soft:   "0 0 8px rgba(0, 255, 136, 0.35)",
    medium: "0 0 16px rgba(0, 255, 136, 0.55)",
    strong: "0 0 28px rgba(0, 255, 136, 0.75), 0 0 56px rgba(0, 255, 136, 0.2)",
    inset:  "inset 0 0 20px rgba(0, 255, 136, 0.06)",
    border: "rgba(0, 255, 136, 0.22)",
    bg:     "rgba(0, 255, 136, 0.06)",
  },
  yellow: {
    soft:   "0 0 8px rgba(255, 214, 10, 0.35)",
    medium: "0 0 16px rgba(255, 214, 10, 0.55)",
    strong: "0 0 28px rgba(255, 214, 10, 0.75), 0 0 56px rgba(255, 214, 10, 0.2)",
    inset:  "inset 0 0 20px rgba(255, 214, 10, 0.06)",
    border: "rgba(255, 214, 10, 0.22)",
    bg:     "rgba(255, 214, 10, 0.06)",
  },
  red: {
    soft:   "0 0 8px rgba(255, 59, 48, 0.35)",
    medium: "0 0 16px rgba(255, 59, 48, 0.55)",
    strong: "0 0 28px rgba(255, 59, 48, 0.75), 0 0 56px rgba(255, 59, 48, 0.2)",
    inset:  "inset 0 0 20px rgba(255, 59, 48, 0.06)",
    border: "rgba(255, 59, 48, 0.22)",
    bg:     "rgba(255, 59, 48, 0.06)",
  },
} as const;

// ── Cave surface system ───────────────────────────────────────────────────────

export const CAVE = {
  base:      "#0A0A0A",  // Body / page background
  deep:      "#08080f",  // Panel backgrounds (slightly blue-tinted deep)
  surface1:  "#111111",  // Card surfaces
  surface2:  "rgba(255,255,255,0.025)",  // Glass panels
  stoneEdge: "rgba(255,255,255,0.055)", // Standard borders
  stoneMid:  "rgba(255,255,255,0.04)",  // Subtle dividers
  stoneDeep: "#1A1A1A",  // Heavier borders
  innerCarve:"inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.4)",
} as const;

// ── Animation timings (CSS values) ───────────────────────────────────────────

export const TIMING = {
  gemPulse:  "5s ease-in-out infinite",
  gemFloat:  "6s ease-in-out infinite",
  dustRise:  "9s linear infinite",
} as const;

// ── Status → gem color mapping ────────────────────────────────────────────────

export type StatusLevel = "active" | "paused" | "error" | "idle";

export const STATUS_GEM: Record<StatusLevel, keyof typeof GEM> = {
  active: "green",
  idle:   "yellow",
  paused: "yellow",
  error:  "red",
};

// ── Signal direction → gem color ──────────────────────────────────────────────

export type SignalDirection = "bullish" | "neutral" | "bearish";

export const SIGNAL_GEM: Record<SignalDirection, keyof typeof GEM> = {
  bullish: "green",
  neutral: "yellow",
  bearish: "red",
};

// ── Score → gem color (lead qualification scores) ────────────────────────────

export function scoreToGem(score: number): keyof typeof GEM {
  if (score >= 80) return "green";
  if (score >= 55) return "yellow";
  return "red";
}

// ── Pipeline stage → gem color ────────────────────────────────────────────────

export type PipelineStage = "New" | "Contacted" | "Qualified" | "Booked" | "Dead";

export const STAGE_GEM: Record<PipelineStage, { color: string; glow: string }> = {
  New:       { color: "#3A3A3A",       glow: "transparent" },
  Contacted: { color: GEM.yellow,      glow: GLOW.yellow.border },
  Qualified: { color: "#00BB60",       glow: "rgba(0,187,96,0.2)" },
  Booked:    { color: GEM.green,       glow: GLOW.green.border },
  Dead:      { color: GEM.red,         glow: "transparent" },
};

// ── Performance bar colors (max 2: green for high, yellow for mid) ────────────

export const PERF_COLOR = (pct: number): string =>
  pct >= 80 ? GEM.green : pct >= 60 ? GEM.yellow : GEM.red;
