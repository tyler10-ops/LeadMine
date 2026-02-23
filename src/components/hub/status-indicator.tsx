import { cn } from "@/lib/utils";
import type { AssetStatus, AutomationStatus } from "@/types";

interface StatusIndicatorProps {
  status: AssetStatus | AutomationStatus;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const statusConfig: Record<string, { color: string; pulse: boolean; label: string }> = {
  active: { color: "bg-emerald-400", pulse: true, label: "Active" },
  paused: { color: "bg-amber-400", pulse: false, label: "Paused" },
  error: { color: "bg-red-400", pulse: true, label: "Error" },
  draft: { color: "bg-neutral-500", pulse: false, label: "Draft" },
};

export function StatusIndicator({
  status,
  size = "sm",
  showLabel = true,
}: StatusIndicatorProps) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        <span
          className={cn(
            "rounded-full",
            config.color,
            size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5"
          )}
        />
        {config.pulse && (
          <span
            className={cn(
              "absolute inset-0 rounded-full opacity-40 animate-ping",
              config.color
            )}
          />
        )}
      </span>
      {showLabel && (
        <span
          className={cn("font-medium uppercase tracking-wider", {
            "text-[10px]": size === "sm",
            "text-xs": size === "md",
            "text-emerald-400": status === "active",
            "text-amber-400": status === "paused",
            "text-red-400": status === "error",
            "text-neutral-500": status === "draft",
          })}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
