"use client";

import Link from "next/link";
import { StatusIndicator } from "./status-indicator";
import { cn } from "@/lib/utils";
import type { Automation } from "@/types";

interface AutomationCardProps {
  automation: Automation;
}

export function AutomationCard({ automation }: AutomationCardProps) {
  const successRate = automation.success_rate;
  const failureRate = automation.failure_rate;

  return (
    <Link href={`/dashboard/automations/${automation.id}`}>
      <div className="group bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
              {automation.name}
            </h3>
            {automation.description && (
              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                {automation.description}
              </p>
            )}
          </div>
          <StatusIndicator status={automation.status} />
        </div>

        {/* Trigger + Actions */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-600 w-14 shrink-0">
              Trigger
            </span>
            <span className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded">
              {automation.trigger_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-neutral-600 w-14 shrink-0">
              Actions
            </span>
            <div className="flex gap-1 flex-wrap">
              {automation.actions.slice(0, 3).map((action, i) => (
                <span
                  key={i}
                  className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded"
                >
                  {action.label}
                </span>
              ))}
              {automation.actions.length > 3 && (
                <span className="text-xs text-neutral-600">
                  +{automation.actions.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Success/Failure rates */}
        <div className="flex items-center gap-4 pt-3 border-t border-neutral-800/50">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                Success
              </span>
              <span className="text-xs font-medium text-emerald-400">
                {successRate}%
              </span>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
                Failure
              </span>
              <span className="text-xs font-medium text-red-400">
                {failureRate}%
              </span>
            </div>
            <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-400 rounded-full"
                style={{ width: `${failureRate}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-neutral-300">
              {automation.total_runs.toLocaleString()}
            </p>
            <p className="text-[10px] text-neutral-600">runs</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
