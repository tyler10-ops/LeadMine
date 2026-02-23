"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Download, ChevronDown, ChevronUp } from "lucide-react";
import type { AutomationLog, LogOutcome } from "@/types";

interface LogTableProps {
  logs: AutomationLog[];
  showAssetColumn?: boolean;
  showAutomationColumn?: boolean;
  onFilterChange?: (outcome: string | null) => void;
  onSearch?: (query: string) => void;
  onExport?: () => void;
}

const outcomeStyles: Record<LogOutcome, { bg: string; text: string }> = {
  success: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  failure: { bg: "bg-red-400/10", text: "text-red-400" },
  partial: { bg: "bg-amber-400/10", text: "text-amber-400" },
  skipped: { bg: "bg-neutral-400/10", text: "text-neutral-500" },
};

export function LogTable({
  logs,
  showAssetColumn = false,
  showAutomationColumn = false,
  onFilterChange,
  onSearch,
  onExport,
}: LogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const handleFilter = (outcome: string | null) => {
    const newFilter = activeFilter === outcome ? null : outcome;
    setActiveFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Search */}
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600" />
              <input
                type="text"
                placeholder="Search logs..."
                onChange={(e) => onSearch(e.target.value)}
                className="bg-neutral-800/50 border border-neutral-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 w-64"
              />
            </div>
          )}

          {/* Outcome filters */}
          <div className="flex gap-1 ml-2">
            {(["success", "failure", "partial", "skipped"] as LogOutcome[]).map(
              (outcome) => (
                <button
                  key={outcome}
                  onClick={() => handleFilter(outcome)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
                    activeFilter === outcome
                      ? cn(outcomeStyles[outcome].bg, outcomeStyles[outcome].text)
                      : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/50"
                  )}
                >
                  {outcome}
                </button>
              )
            )}
          </div>
        </div>

        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        )}
      </div>

      {/* Table */}
      <div className="border border-neutral-800/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-800/20">
              <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                Timestamp
              </th>
              {showAutomationColumn && (
                <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                  Automation
                </th>
              )}
              {showAssetColumn && (
                <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                  Asset
                </th>
              )}
              <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                Trigger
              </th>
              <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                Action
              </th>
              <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                Outcome
              </th>
              <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-2.5 px-4">
                Duration
              </th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/30">
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-sm text-neutral-600"
                >
                  No logs found
                </td>
              </tr>
            )}
            {logs.map((log) => {
              const isExpanded = expandedRow === log.id;
              const style = outcomeStyles[log.outcome];
              return (
                <tr key={log.id} className="group">
                  <td colSpan={showAssetColumn && showAutomationColumn ? 8 : showAssetColumn || showAutomationColumn ? 7 : 6}>
                    <div>
                      {/* Main row */}
                      <div
                        className="flex items-center hover:bg-neutral-800/20 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedRow(isExpanded ? null : log.id)
                        }
                      >
                        <div className="w-[160px] px-4 py-2.5">
                          <span className="text-xs text-neutral-500 font-mono">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                        {showAutomationColumn && (
                          <div className="flex-1 px-4 py-2.5">
                            <span className="text-xs text-neutral-400">
                              {log.automation_name || "—"}
                            </span>
                          </div>
                        )}
                        {showAssetColumn && (
                          <div className="flex-1 px-4 py-2.5">
                            <span className="text-xs text-neutral-400">
                              {log.asset_name || "—"}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 px-4 py-2.5">
                          <span className="text-xs text-neutral-400">
                            {log.trigger_source}
                          </span>
                        </div>
                        <div className="flex-1 px-4 py-2.5">
                          <span className="text-xs text-neutral-400">
                            {log.action_executed}
                          </span>
                        </div>
                        <div className="w-[100px] px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider",
                              style.bg,
                              style.text
                            )}
                          >
                            {log.outcome}
                          </span>
                        </div>
                        <div className="w-[80px] px-4 py-2.5">
                          <span className="text-xs text-neutral-600 font-mono">
                            {log.duration_ms ? `${log.duration_ms}ms` : "—"}
                          </span>
                        </div>
                        <div className="w-8 px-2">
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-neutral-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
                          )}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 bg-neutral-800/10">
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            {log.reason && (
                              <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
                                  Reason
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {log.reason}
                                </p>
                              </div>
                            )}
                            {log.ai_decision_summary && (
                              <div>
                                <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
                                  AI Decision
                                </p>
                                <p className="text-xs text-neutral-400">
                                  {log.ai_decision_summary}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
