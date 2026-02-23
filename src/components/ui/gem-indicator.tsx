import { cn } from "@/lib/utils";
import { GEM, GLOW, type StatusLevel, STATUS_GEM } from "@/lib/cave-theme";

interface GemIndicatorProps {
  /** Explicit gem color variant */
  variant?: "green" | "yellow" | "red";
  /** Or pass a status level — maps to gem color automatically */
  status?: StatusLevel;
  /** Pulse animation (default: true for active, false otherwise) */
  pulse?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZE: Record<NonNullable<GemIndicatorProps["size"]>, string> = {
  xs: "w-1.5 h-1.5",
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
};

/**
 * Tiny facet-hinted gem dot for use inside tables, cards, and list rows.
 * Replaces generic colored circles throughout the dashboard.
 *
 * Usage:
 *   <GemIndicator status="active" />          → green pulse dot
 *   <GemIndicator variant="yellow" />         → yellow static dot
 *   <GemIndicator status="error" pulse />     → red pulse dot
 */
export function GemIndicator({
  variant,
  status,
  pulse,
  size = "sm",
  className,
}: GemIndicatorProps) {
  const gemKey = variant ?? (status ? STATUS_GEM[status] : "green");
  const color = GEM[gemKey];
  const glow = GLOW[gemKey].soft;
  const shouldPulse = pulse ?? (status === "active");

  return (
    <span className={cn("relative inline-flex flex-shrink-0", SIZE[size], className)}>
      {shouldPulse && (
        <span
          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
          style={{ background: color }}
        />
      )}
      {/* Diamond shape (rotate-45 square) for faceted look */}
      <span
        className="relative inline-flex w-full h-full rounded-[2px] rotate-45"
        style={{
          background: color,
          boxShadow: glow,
        }}
      />
    </span>
  );
}
