"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PipelineStats, LeadStage } from "@/types";

const stageColors: Record<LeadStage, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  qualified: "bg-purple-500",
  booked: "bg-emerald-500",
  dead: "bg-neutral-600",
};

const stageLabels: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  booked: "Booked",
  dead: "Dead",
};

interface PipelineSummaryWidgetProps {
  stats: PipelineStats;
}

export function PipelineSummaryWidget({ stats }: PipelineSummaryWidgetProps) {
  const stages: LeadStage[] = ["new", "contacted", "qualified", "booked", "dead"];
  const total = stats.total || 1; // avoid division by zero

  return (
    <Link href="/dashboard/pipeline">
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
            Pipeline
          </span>
          <span className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
            {stats.total} leads
          </span>
        </div>

        {/* Stage distribution bar */}
        <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
          {stages.map((stage) => {
            const count = stats.byStage[stage] || 0;
            const pct = (count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={stage}
                className={cn("transition-all", stageColors[stage])}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {stages.map((stage) => {
            const count = stats.byStage[stage] || 0;
            if (count === 0) return null;
            return (
              <div key={stage} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", stageColors[stage])} />
                <span className="text-[10px] text-neutral-500">
                  {stageLabels[stage]} ({count})
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div className="mt-3 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
          <span className="text-[10px] text-neutral-600">
            {stats.staleCount > 0 && (
              <span className="text-amber-400">{stats.staleCount} stale</span>
            )}
          </span>
          <span className="text-[10px] text-neutral-600">
            {stats.conversionRate}% conversion
          </span>
        </div>
      </div>
    </Link>
  );
}
