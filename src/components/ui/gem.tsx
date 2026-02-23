import { useId } from "react";
import { cn } from "@/lib/utils";

export type GemVariant = "green" | "yellow" | "red";
export type GemSize = "xs" | "sm" | "md" | "lg" | "xl";

interface GemProps {
  variant: GemVariant;
  size?: GemSize;
  animated?: boolean;
  float?: boolean;
  className?: string;
}

const SIZE_PX: Record<GemSize, number> = {
  xs: 32,
  sm: 56,
  md: 88,
  lg: 130,
  xl: 190,
};

const COLORS: Record<
  GemVariant,
  { primary: string; bright: string; mid: string; dark: string }
> = {
  green: {
    primary: "#00FF88",
    bright: "#80FFCA",
    mid: "#00BB60",
    dark: "#002A18",
  },
  yellow: {
    primary: "#FFD60A",
    bright: "#FFE96A",
    mid: "#CCAA00",
    dark: "#2E2100",
  },
  red: {
    primary: "#FF3B30",
    bright: "#FF8A84",
    mid: "#CC2A22",
    dark: "#2E0500",
  },
};

const PULSE_CLASS: Record<GemVariant, string> = {
  green:  "gem-pulse-green",
  yellow: "gem-pulse-yellow",
  red:    "gem-pulse-red",
};

/**
 * Faceted gemstone SVG with internal glow core, face shading, and
 * edge shimmer. Optionally animated (CSS drop-shadow pulse + float).
 *
 * Gem outline keypoints (viewBox 0 0 100 120):
 *   Table: (25,8)–(75,8)         Girdle: (0,50) and (100,50)
 *   Pavilion mid: (50,82)        Culet: (50,115)
 */
export function Gem({
  variant,
  size = "md",
  animated = true,
  float = false,
  className,
}: GemProps) {
  const rawId = useId();
  // useId returns ":r0:" style strings — strip colons for valid SVG IDs
  const id = rawId.replace(/:/g, "");
  const px = SIZE_PX[size];
  const c = COLORS[variant];

  return (
    <svg
      width={px}
      height={Math.round(px * 1.2)}
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        animated && PULSE_CLASS[variant],
        float && "gem-float",
        className
      )}
    >
      <defs>
        {/* Core radial gradient — light enters from upper-left */}
        <radialGradient id={`core-${id}`} cx="38%" cy="25%" r="72%">
          <stop offset="0%"   stopColor={c.bright}  stopOpacity="1" />
          <stop offset="30%"  stopColor={c.primary} stopOpacity="0.9" />
          <stop offset="65%"  stopColor={c.mid}     stopOpacity="0.65" />
          <stop offset="100%" stopColor={c.dark}    stopOpacity="0.5" />
        </radialGradient>

        {/* Pavilion gradient — deeper, darker */}
        <radialGradient id={`pav-${id}`} cx="50%" cy="15%" r="85%">
          <stop offset="0%"   stopColor={c.mid}  stopOpacity="0.7" />
          <stop offset="100%" stopColor={c.dark} stopOpacity="0.95" />
        </radialGradient>

        {/* Inner glow blur (core sparkle) */}
        <filter id={`iglow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ── Crown (upper half) ── */}
      {/* Base crown fill */}
      <polygon
        points="25,8 75,8 100,50 0,50"
        fill={`url(#core-${id})`}
      />
      {/* Table face highlight (upper triangle, brightest) */}
      <polygon
        points="25,8 75,8 50,50"
        fill={c.bright}
        opacity="0.22"
      />
      {/* Left crown face (shadow side) */}
      <polygon
        points="0,50 25,8 50,50"
        fill="black"
        opacity="0.28"
      />
      {/* Right crown face (shadow side, deeper) */}
      <polygon
        points="100,50 75,8 50,50"
        fill="black"
        opacity="0.42"
      />

      {/* ── Pavilion (lower half) ── */}
      <polygon
        points="0,50 100,50 50,115"
        fill={`url(#pav-${id})`}
      />
      {/* Left upper pavilion */}
      <polygon
        points="0,50 50,50 50,82"
        fill="black"
        opacity="0.22"
      />
      {/* Right upper pavilion (subtle highlight) */}
      <polygon
        points="100,50 50,50 50,82"
        fill={c.primary}
        opacity="0.07"
      />
      {/* Left lower pavilion */}
      <polygon
        points="0,50 50,82 50,115"
        fill="black"
        opacity="0.38"
      />
      {/* Right lower pavilion */}
      <polygon
        points="100,50 50,82 50,115"
        fill="black"
        opacity="0.18"
      />

      {/* ── Facet lines (edge shimmer) ── */}
      {/* Crown lines from table corners to girdle center */}
      <line x1="25" y1="8"  x2="50" y2="50" stroke={c.primary} strokeWidth="0.5" opacity="0.55" />
      <line x1="75" y1="8"  x2="50" y2="50" stroke={c.primary} strokeWidth="0.5" opacity="0.55" />
      {/* Pavilion lines */}
      <line x1="0"  y1="50" x2="50" y2="82"  stroke={c.primary} strokeWidth="0.4" opacity="0.4" />
      <line x1="100" y1="50" x2="50" y2="82" stroke={c.primary} strokeWidth="0.4" opacity="0.4" />
      <line x1="50" y1="50" x2="50" y2="115" stroke={c.primary} strokeWidth="0.35" opacity="0.3" />

      {/* ── Gem outline ── */}
      <polygon
        points="25,8 75,8 100,50 50,115 0,50"
        fill="none"
        stroke={c.primary}
        strokeWidth="0.8"
        opacity="0.65"
      />

      {/* ── Table edge (top bright line) ── */}
      <line
        x1="25" y1="8" x2="75" y2="8"
        stroke={c.bright}
        strokeWidth="1.6"
        opacity="0.95"
      />

      {/* ── Left edge highlight (light-source shimmer) ── */}
      <line
        x1="0" y1="50" x2="25" y2="8"
        stroke="white"
        strokeWidth="0.7"
        opacity="0.3"
      />

      {/* ── Inner glow core ── */}
      <ellipse
        cx="46" cy="34"
        rx="16" ry="12"
        fill={c.primary}
        opacity="0.14"
        filter={`url(#iglow-${id})`}
      />
    </svg>
  );
}
