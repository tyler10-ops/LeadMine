"use client";

import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Shield,
} from "lucide-react";
import type { MarketSignal } from "@/types";

interface SignalStatsProps {
  signals: MarketSignal[];
  total: number;
}

export function SignalStats({ signals, total }: SignalStatsProps) {
  const bullish = signals.filter((s) => s.signal_direction === "bullish").length;
  const bearish = signals.filter((s) => s.signal_direction === "bearish").length;
  const highImpact = signals.filter((s) => s.is_high_impact).length;
  const avgImpact =
    signals.length > 0
      ? Math.round(signals.reduce((sum, s) => sum + s.impact_score, 0) / signals.length)
      : 0;
  const avgConfidence =
    signals.length > 0
      ? Math.round(
          signals.reduce((sum, s) => sum + s.confidence_score, 0) / signals.length
        )
      : 0;

  const stats = [
    {
      label: "Total Signals",
      value: total.toString(),
      icon: <Activity className="w-3.5 h-3.5" />,
      color: "text-neutral-400",
    },
    {
      label: "Bullish",
      value: bullish.toString(),
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      color: "text-emerald-400",
    },
    {
      label: "Bearish",
      value: bearish.toString(),
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      color: "text-red-400",
    },
    {
      label: "High Impact",
      value: highImpact.toString(),
      icon: <Zap className="w-3.5 h-3.5" />,
      color: "text-amber-400",
    },
    {
      label: "Avg Impact",
      value: avgImpact.toString(),
      icon: <BarChart3 className="w-3.5 h-3.5" />,
      color: "text-neutral-400",
    },
    {
      label: "Avg Confidence",
      value: `${avgConfidence}%`,
      icon: <Shield className="w-3.5 h-3.5" />,
      color: "text-neutral-400",
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#111111] border border-neutral-800/50 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-neutral-700">{stat.icon}</span>
            <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-lg font-semibold tracking-tight ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
