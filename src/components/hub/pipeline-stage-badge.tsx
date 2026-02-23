import { cn } from "@/lib/utils";
import type { LeadStage } from "@/types";

const stageConfig: Record<LeadStage, { label: string; bg: string; text: string }> = {
  new: { label: "New", bg: "bg-blue-500/15", text: "text-blue-400" },
  contacted: { label: "Contacted", bg: "bg-amber-500/15", text: "text-amber-400" },
  qualified: { label: "Qualified", bg: "bg-purple-500/15", text: "text-purple-400" },
  booked: { label: "Booked", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  dead: { label: "Dead", bg: "bg-neutral-500/15", text: "text-neutral-500" },
};

interface PipelineStageBadgeProps {
  stage: LeadStage;
  size?: "sm" | "md";
  className?: string;
}

export function PipelineStageBadge({ stage, size = "sm", className }: PipelineStageBadgeProps) {
  const config = stageConfig[stage];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bg,
        config.text,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      {config.label}
    </span>
  );
}
