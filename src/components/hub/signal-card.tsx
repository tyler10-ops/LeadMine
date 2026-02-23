"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Shield,
  AlertTriangle,
} from "lucide-react";
import type { MarketSignal, SignalCategory, SignalDirection } from "@/types";

const categoryStyles: Record<SignalCategory, { bg: string; text: string; label: string }> = {
  rates: { bg: "bg-blue-400/10", text: "text-blue-400", label: "Rates" },
  inventory: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Inventory" },
  demand: { bg: "bg-amber-400/10", text: "text-amber-400", label: "Demand" },
  policy: { bg: "bg-purple-400/10", text: "text-purple-400", label: "Policy" },
  local_market: { bg: "bg-cyan-400/10", text: "text-cyan-400", label: "Local" },
  macro: { bg: "bg-rose-400/10", text: "text-rose-400", label: "Macro" },
};

const directionConfig: Record<
  SignalDirection,
  { icon: typeof TrendingUp; color: string; label: string }
> = {
  bullish: { icon: TrendingUp, color: "text-emerald-400", label: "Bullish" },
  bearish: { icon: TrendingDown, color: "text-red-400", label: "Bearish" },
  neutral: { icon: Minus, color: "text-neutral-500", label: "Neutral" },
};

interface SignalCardProps {
  signal: MarketSignal;
  onInteraction?: (signalId: string, type: string) => void;
}

export function SignalCard({ signal, onInteraction }: SignalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cat = categoryStyles[signal.category] || categoryStyles.macro;
  const dir = directionConfig[signal.signal_direction] || directionConfig.neutral;
  const DirIcon = dir.icon;
  const interp = signal.interpretation;

  const handleExpand = () => {
    const willExpand = !expanded;
    setExpanded(willExpand);
    if (willExpand && onInteraction) {
      onInteraction(signal.id, "expanded");
    }
  };

  return (
    <div
      className={cn(
        "bg-[#111111] border rounded-xl overflow-hidden transition-colors",
        signal.is_high_impact
          ? "border-amber-500/30 hover:border-amber-500/50"
          : "border-neutral-800/50 hover:border-neutral-700/50"
      )}
    >
      {/* Collapsed row */}
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer"
        onClick={handleExpand}
      >
        {/* Direction indicator */}
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
            dir.color === "text-emerald-400" && "bg-emerald-400/10",
            dir.color === "text-red-400" && "bg-red-400/10",
            dir.color === "text-neutral-500" && "bg-neutral-800/50"
          )}
        >
          <DirIcon className={cn("w-4 h-4", dir.color)} />
        </div>

        {/* Impact score bar */}
        <div className="w-10 shrink-0">
          <div className="text-[10px] font-mono text-center mb-0.5"
            style={{
              color: signal.impact_score >= 75 ? "#f59e0b"
                : signal.impact_score >= 50 ? "#a3a3a3"
                : "#525252"
            }}
          >
            {signal.impact_score}
          </div>
          <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${signal.impact_score}%`,
                backgroundColor: signal.impact_score >= 75 ? "#f59e0b"
                  : signal.impact_score >= 50 ? "#737373"
                  : "#404040",
              }}
            />
          </div>
        </div>

        {/* Category tag */}
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded shrink-0",
            cat.bg,
            cat.text
          )}
        >
          {cat.label}
        </span>

        {/* Headline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {signal.is_high_impact && (
              <Zap className="w-3 h-3 text-amber-400 shrink-0" />
            )}
            <h4 className="text-sm text-neutral-300 font-medium truncate">
              {signal.headline}
            </h4>
          </div>
        </div>

        {/* Confidence + geography */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-neutral-700" />
            <span className="text-[10px] font-mono text-neutral-600">
              {signal.confidence_score}%
            </span>
          </div>
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
            {signal.geography === "national" ? "US" : signal.region}
          </span>
          <span className="text-[10px] text-neutral-700 font-mono">
            {new Date(signal.published_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Expand toggle */}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-neutral-600 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-neutral-600 shrink-0" />
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-neutral-800/30">
          {/* Summary */}
          {signal.summary && (
            <p className="text-sm text-neutral-400 leading-relaxed mt-4">
              {signal.summary}
            </p>
          )}

          {/* AI Interpretation */}
          {interp && (
            <div className="mt-4 space-y-3">
              {/* AI Summary */}
              <div className="bg-neutral-800/20 rounded-lg p-4">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">
                  AI Analysis
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {interp.ai_summary}
                </p>
              </div>

              {/* Realtor Impact — the key insight */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-3 h-3 text-blue-400" />
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider font-medium">
                    Impact on Your Business
                  </p>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {interp.ai_realtor_impact}
                </p>
              </div>

              {/* Forward-looking implication */}
              {interp.ai_suggested_implication && (
                <p className="text-xs text-neutral-500 italic px-1">
                  Outlook: {interp.ai_suggested_implication}
                </p>
              )}

              {/* Asset recommendations */}
              {interp.asset_recommendations &&
                Array.isArray(interp.asset_recommendations) &&
                interp.asset_recommendations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">
                      Recommended Actions
                    </p>
                    <div className="grid gap-2">
                      {interp.asset_recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-neutral-800/20 rounded-lg px-4 py-3"
                        >
                          <span
                            className={cn(
                              "text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 shrink-0",
                              rec.priority === "high"
                                ? "bg-red-400/10 text-red-400"
                                : rec.priority === "medium"
                                ? "bg-amber-400/10 text-amber-400"
                                : "bg-neutral-700/30 text-neutral-500"
                            )}
                          >
                            {rec.priority}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-neutral-300 font-medium">
                              <span className="text-neutral-500 uppercase">
                                {rec.asset_type}
                              </span>{" "}
                              — {rec.action}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              {rec.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Impact factors breakdown */}
          {signal.impact_factors && (
            <div className="mt-4 flex gap-6">
              {[
                { label: "Breadth", value: signal.impact_factors.breadth },
                { label: "Magnitude", value: signal.impact_factors.magnitude },
                { label: "Historical", value: signal.impact_factors.historical_relevance },
                { label: "Confidence", value: signal.impact_factors.confidence },
              ]
                .filter((f) => f.value !== undefined)
                .map((factor) => (
                  <div key={factor.label} className="text-center">
                    <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
                      {factor.label}
                    </div>
                    <div className="text-xs font-mono text-neutral-400">
                      {factor.value}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Tags + source */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-800/30">
            <span className="text-[10px] text-neutral-600 font-medium">
              {signal.source_name}
            </span>
            {(signal.tags || []).map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-neutral-700 uppercase tracking-wider"
              >
                #{tag}
              </span>
            ))}
            {signal.source_url && (
              <a
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
