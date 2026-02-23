"use client";

import { cn } from "@/lib/utils";
import type { ObjectionScript } from "@/types";

interface ObjectionConfigProps {
  objections: ObjectionScript[];
  onUpdate?: (id: string, updates: Partial<ObjectionScript>) => void;
}

const categoryColors: Record<string, string> = {
  price: "text-emerald-400 bg-emerald-500/10",
  timing: "text-blue-400 bg-blue-500/10",
  competition: "text-amber-400 bg-amber-500/10",
  financing: "text-purple-400 bg-purple-500/10",
  location: "text-orange-400 bg-orange-500/10",
  general: "text-neutral-400 bg-neutral-500/10",
};

export function ObjectionConfig({ objections, onUpdate }: ObjectionConfigProps) {
  if (objections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-neutral-600">No objection scripts configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {objections.map((obj) => {
        const successRate = obj.times_used > 0
          ? Math.round((obj.times_successful / obj.times_used) * 100)
          : obj.effectiveness_score;

        return (
          <div
            key={obj.id}
            className="bg-[#0d0d0d] border border-neutral-800/30 rounded-lg p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-medium uppercase",
                  categoryColors[obj.category] || categoryColors.general
                )}
              >
                {obj.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-600">
                  Used {obj.times_used}x
                </span>
              </div>
            </div>

            {/* Objection */}
            <p className="text-sm text-neutral-400 mb-2 italic">
              &ldquo;{obj.objection_text}&rdquo;
            </p>

            {/* Response */}
            <p className="text-sm text-neutral-300 mb-3">{obj.response_text}</p>

            {/* Effectiveness bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    successRate >= 70
                      ? "bg-emerald-400"
                      : successRate >= 40
                      ? "bg-amber-400"
                      : "bg-red-400"
                  )}
                  style={{ width: `${successRate}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-medium">
                {successRate}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
