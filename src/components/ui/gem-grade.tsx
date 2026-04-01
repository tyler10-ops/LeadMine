import { cn } from "@/lib/utils";
import { Gem, GemVariant } from "./gem";

export type GradeLevel = "elite" | "refined" | "rock" | "ungraded";

interface GemGradeProps {
  grade: GradeLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const GRADE_CONFIG: Record<
  GradeLevel,
  {
    variant: GemVariant;
    label: string;
    sublabel: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  elite: {
    variant: "green",
    label: "Elite Gem",
    sublabel: "Grade A",
    color: "text-[#00FF88]",
    bg: "bg-[#00FF88]/[0.07]",
    border: "border-[#00FF88]/20",
  },
  refined: {
    variant: "yellow",
    label: "Refined",
    sublabel: "Grade B",
    color: "text-[#FFD60A]",
    bg: "bg-[#FFD60A]/[0.07]",
    border: "border-[#FFD60A]/20",
  },
  rock: {
    variant: "red",
    label: "Rock",
    sublabel: "Grade C",
    color: "text-[#FF3B30]",
    bg: "bg-[#FF3B30]/[0.07]",
    border: "border-[#FF3B30]/20",
  },
  ungraded: {
    variant: "red",
    label: "Ungraded",
    sublabel: "Pending",
    color: "text-neutral-500",
    bg: "bg-neutral-500/[0.07]",
    border: "border-neutral-500/20",
  },
};

export function GemGrade({
  grade,
  showLabel = true,
  size = "md",
  className,
}: GemGradeProps) {
  const config = GRADE_CONFIG[grade];
  const gemSize = size === "sm" ? "xs" : "sm";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg border px-3 py-2",
        config.bg,
        config.border,
        className
      )}
    >
      <Gem variant={config.variant} size={gemSize} animated float={false} />
      {showLabel && (
        <div>
          <p className={cn("text-xs font-semibold tracking-wide leading-tight", config.color)}>
            {config.label}
          </p>
          <p className="text-[10px] text-neutral-600 mt-0.5">{config.sublabel}</p>
        </div>
      )}
    </div>
  );
}
