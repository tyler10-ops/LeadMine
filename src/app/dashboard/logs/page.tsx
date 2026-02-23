"use client";

import { useEffect, useState, useCallback } from "react";
import { LogTable } from "@/components/hub/log-table";
import { Loader2 } from "lucide-react";
import type { AutomationLog } from "@/types";

export default function LogsPage() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    const params = new URLSearchParams({ limit: "100", offset: "0" });
    if (outcome) params.set("outcome", outcome);
    if (search) params.set("search", search);

    const res = await fetch(`/api/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [outcome, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    const csv = [
      "Timestamp,Trigger,Action,Outcome,Reason,AI Decision,Duration (ms)",
      ...logs.map((l) =>
        [
          l.timestamp,
          l.trigger_source,
          l.action_executed,
          l.outcome,
          (l.reason || "").replace(/,/g, ";"),
          (l.ai_decision_summary || "").replace(/,/g, ";"),
          l.duration_ms || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automation-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          {total.toLocaleString()} total log entries
        </p>
      </div>

      <LogTable
        logs={logs}
        showAssetColumn
        showAutomationColumn
        onFilterChange={(o) => {
          setOutcome(o);
        }}
        onSearch={(q) => {
          setSearch(q);
        }}
        onExport={handleExport}
      />
    </div>
  );
}
