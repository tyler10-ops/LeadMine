import { cn } from "@/lib/utils";
import { Gem, type GemVariant, type GemSize } from "./gem";
import { GLOW } from "@/lib/cave-theme";

type EmbedPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface EmbeddedGemProps {
  variant: GemVariant;
  size?: GemSize;
  /** Which corner of the parent panel to embed into */
  position?: EmbedPosition;
  /** 0–1 — how much of the gem is visible above the panel edge (default 0.45) */
  visibility?: number;
  className?: string;
}

const POSITION_STYLES: Record<EmbedPosition, string> = {
  "top-left":     "top-0 left-0 -translate-x-1/3 -translate-y-[55%]",
  "top-right":    "top-0 right-0 translate-x-1/3 -translate-y-[55%]",
  "bottom-left":  "bottom-0 left-0 -translate-x-1/3 translate-y-[55%]",
  "bottom-right": "bottom-0 right-0 translate-x-1/3 translate-y-[55%]",
};

/**
 * A gemstone partially clipped by its parent panel's edge — as if it were
 * embedded in stone. Parent must have `position: relative` and
 * `overflow: hidden` (or use the clip variant below).
 *
 * Usage:
 *   <div className="relative overflow-hidden ...">
 *     <EmbeddedGem variant="green" position="top-right" size="sm" />
 *     {children}
 *   </div>
 */
export function EmbeddedGem({
  variant,
  size = "sm",
  position = "top-right",
  className,
}: EmbeddedGemProps) {
  const glowColor = GLOW[variant].medium;

  return (
    <div
      className={cn(
        "absolute pointer-events-none select-none z-0",
        POSITION_STYLES[position],
        className
      )}
      aria-hidden="true"
      style={{
        filter: `drop-shadow(${glowColor})`,
        opacity: 0.55,
      }}
    >
      <Gem variant={variant} size={size} animated float={false} />
    </div>
  );
}

/**
 * A standalone decorative gem shard — used as a section anchor or
 * background accent (not clipped). Sits at very low opacity so it
 * reads as texture rather than UI element.
 */
export function GemShard({
  variant,
  size = "xs",
  className,
}: {
  variant: GemVariant;
  size?: GemSize;
  className?: string;
}) {
  return (
    <div
      className={cn("pointer-events-none select-none", className)}
      aria-hidden="true"
      style={{ opacity: 0.4 }}
    >
      <Gem variant={variant} size={size} animated float={false} />
    </div>
  );
}
