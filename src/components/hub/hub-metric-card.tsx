import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HubMetricCardProps {
  label: string;
  value: string;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function HubMetricCard({
  label,
  value,
  change,
  subtitle,
  icon,
}: HubMetricCardProps) {
  return (
    <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
          {label}
        </span>
        {icon && <span className="text-neutral-700">{icon}</span>}
      </div>
      <p className="text-2xl font-semibold text-neutral-200 tracking-tight">
        {value}
      </p>
      {(change !== undefined || subtitle) && (
        <div className="flex items-center gap-1.5 mt-2">
          {change !== undefined && (
            <>
              {change > 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : change < 0 ? (
                <TrendingDown className="w-3 h-3 text-red-400" />
              ) : (
                <Minus className="w-3 h-3 text-neutral-600" />
              )}
              <span
                className={cn("text-[11px] font-medium", {
                  "text-emerald-400": change > 0,
                  "text-red-400": change < 0,
                  "text-neutral-600": change === 0,
                })}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </>
          )}
          {subtitle && (
            <span className="text-[11px] text-neutral-600">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
