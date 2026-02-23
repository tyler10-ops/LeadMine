"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import type { MarketSignal, SignalDirection } from "@/types";

const dirColor: Record<SignalDirection, string> = {
  bullish: "text-emerald-400",
  bearish: "text-red-400",
  neutral: "text-neutral-500",
};

const dirIcon: Record<SignalDirection, typeof TrendingUp> = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

interface SignalTickerProps {
  signals: MarketSignal[];
}

export function SignalTicker({ signals }: SignalTickerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animId: number;
    let pos = 0;

    const animate = () => {
      pos += 0.5;
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [signals]);

  if (signals.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...signals, ...signals];

  return (
    <div className="bg-[#0d0d0d] border border-neutral-800/50 rounded-xl overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-6 px-4 py-3 overflow-hidden whitespace-nowrap"
      >
        {items.map((sig, i) => {
          const Icon = dirIcon[sig.signal_direction];
          return (
            <div key={`${sig.id}-${i}`} className="flex items-center gap-2 shrink-0">
              {sig.is_high_impact && (
                <Zap className="w-3 h-3 text-amber-400" />
              )}
              <Icon className={cn("w-3 h-3", dirColor[sig.signal_direction])} />
              <span className="text-xs text-neutral-400 font-medium max-w-[250px] truncate">
                {sig.headline}
              </span>
              <span className="text-[10px] font-mono text-neutral-600">
                {sig.impact_score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
