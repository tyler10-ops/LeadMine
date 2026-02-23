import { cn } from "@/lib/utils";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { EmbeddedGem } from "./embedded-gem";
import type { GemVariant } from "./gem";

interface MiningPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Draws a colored left-edge status stripe */
  status?: "green" | "yellow" | "red";
  /** Embeds a tiny gem in the specified corner */
  gemAccent?: GemVariant;
  gemPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Applies an inset glow to suggest the panel is carved from stone */
  carved?: boolean;
  padding?: "sm" | "md" | "lg";
}

const PADDING = { sm: "p-3", md: "p-4", lg: "p-5" };

/**
 * Stone-aesthetic panel card. Drop-in replacement for the generic Card
 * used throughout the dashboard. Carved inner shadows + optional gem accents.
 */
export function MiningPanel({
  children,
  className,
  status,
  gemAccent,
  gemPosition = "top-right",
  carved = false,
  padding = "md",
}: MiningPanelProps) {
  const statusColor = status ? GEM[status] : null;
  const statusBorder = status ? GLOW[status].border : CAVE.stoneEdge;

  return (
    <div
      className={cn("relative rounded-xl overflow-hidden", PADDING[padding], className)}
      style={{
        background: CAVE.surface2,
        border: `1px solid ${statusBorder}`,
        boxShadow: carved
          ? `${CAVE.innerCarve}${status ? `, ${GLOW[status].inset}` : ""}`
          : status
          ? GLOW[status].inset
          : undefined,
        // Left edge status stripe
        ...(statusColor && {
          borderLeft: `2px solid ${statusColor}`,
        }),
      }}
    >
      {gemAccent && (
        <EmbeddedGem
          variant={gemAccent}
          size="xs"
          position={gemPosition}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * GlowBorder — wraps a child in an active-state glow ring.
 * Used on high-priority sections or the currently focused panel.
 */
interface GlowBorderProps {
  children: React.ReactNode;
  variant: "green" | "yellow" | "red";
  intensity?: "soft" | "medium" | "strong";
  className?: string;
}

export function GlowBorder({
  children,
  variant,
  intensity = "soft",
  className,
}: GlowBorderProps) {
  return (
    <div
      className={cn("rounded-xl", className)}
      style={{
        boxShadow: `0 0 0 1px ${GLOW[variant].border}, ${GLOW[variant][intensity]}`,
      }}
    >
      {children}
    </div>
  );
}
