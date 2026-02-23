import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  subtitle?: string;
}

export function MetricCard({ title, value, change, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardValue>{value}</CardValue>
      {(change !== undefined || subtitle) && (
        <div className="mt-2 flex items-center gap-1.5">
          {change !== undefined && (
            <>
              {change > 0 ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : change < 0 ? (
                <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Minus className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span
                className={cn("text-xs font-medium", {
                  "text-emerald-600": change > 0,
                  "text-red-600": change < 0,
                  "text-neutral-400": change === 0,
                })}
              >
                {change > 0 ? "+" : ""}
                {change}% vs last week
              </span>
            </>
          )}
          {subtitle && !change && (
            <span className="text-xs text-neutral-500">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
}
