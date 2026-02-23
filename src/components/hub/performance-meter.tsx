"use client";

import { cn } from "@/lib/utils";

interface PerformanceMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
  variant?: "ring" | "bar";
  showLabel?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-red-400";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 60) return "#fbbf24";
  if (score >= 40) return "#fb923c";
  return "#f87171";
}

function getBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  if (score >= 40) return "bg-orange-400";
  return "bg-red-400";
}

// SVG ring meter
function RingMeter({ score, size }: { score: number; size: "sm" | "md" | "lg" }) {
  const dimensions = { sm: 48, md: 64, lg: 80 };
  const strokes = { sm: 4, md: 5, lg: 6 };
  const fonts = { sm: "text-xs", md: "text-sm", lg: "text-lg" };

  const dim = dimensions[size];
  const stroke = strokes[size];
  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: dim, height: dim }}>
      <svg
        width={dim}
        height={dim}
        className="-rotate-90"
        viewBox={`0 0 ${dim} ${dim}`}
      >
        {/* Background ring */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={stroke}
        />
        {/* Score ring */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor(score)}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-semibold", fonts[size], getScoreColor(score))}>
          {score}
        </span>
      </div>
    </div>
  );
}

// Horizontal bar meter
function BarMeter({ score }: { score: number }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">
          Performance
        </span>
        <span className={cn("text-xs font-semibold", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getBarColor(score)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function PerformanceMeter({
  score,
  size = "md",
  variant = "ring",
}: PerformanceMeterProps) {
  if (variant === "bar") {
    return <BarMeter score={score} />;
  }
  return <RingMeter score={score} size={size} />;
}
