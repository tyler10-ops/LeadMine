"use client";

import { useEffect, useState } from "react";
import { AutomationCard } from "@/components/hub/automation-card";
import { Loader2 } from "lucide-react";
import type { Automation, AutomationStatus } from "@/types";

const STATUS_FILTERS: { value: AutomationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error", label: "Error" },
  { value: "draft", label: "Draft" },
];

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/automations")
      .then((r) => r.json())
      .then((data) => {
        setAutomations(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all"
      ? automations
      : automations.filter((a) => a.status === filter);

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
          Automation Systems
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          {automations.length} systems configured &middot;{" "}
          {automations.filter((a) => a.status === "active").length} active
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${
              filter === f.value
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-600">
            {automations.length === 0
              ? "No automations configured."
              : "No automations match this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((auto) => (
            <AutomationCard key={auto.id} automation={auto} />
          ))}
        </div>
      )}
    </div>
  );
}
