"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusIndicator } from "@/components/hub/status-indicator";
import { PerformanceMeter } from "@/components/hub/performance-meter";
import { FeatureToggle } from "@/components/hub/feature-toggle";
import { LogTable } from "@/components/hub/log-table";
import {
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Phone,
  MessageSquare,
  Mail,
  Share2,
  Building,
  CalendarCheck,
  FlaskConical,
} from "lucide-react";
import type { AIAsset, Automation, AutomationLog } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  voice: Phone,
  sms: MessageSquare,
  email: Mail,
  social: Share2,
  listing: Building,
  booking: CalendarCheck,
};

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState<AIAsset | null>(null);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Log filtering state
  const [logSearch, setLogSearch] = useState("");
  const [logOutcome, setLogOutcome] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    fetch(`/api/assets/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data.asset);
        setAutomations(data.automations || []);
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const toggleStatus = async () => {
    if (!asset) return;
    const newStatus = asset.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAsset(updated);
    }
  };

  // --- Log search & filter ---
  const fetchLogs = useCallback(
    async (search: string, outcome: string | null) => {
      const queryParams = new URLSearchParams();
      queryParams.set("asset_id", params.id as string);
      if (search) queryParams.set("search", search);
      if (outcome) queryParams.set("outcome", outcome);
      queryParams.set("limit", "200");

      try {
        const res = await fetch(`/api/logs?${queryParams}`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        // keep existing logs on failure
      }
    },
    [params.id]
  );

  const handleLogSearch = useCallback(
    (query: string) => {
      setLogSearch(query);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        fetchLogs(query, logOutcome);
      }, 300);
    },
    [fetchLogs, logOutcome]
  );

  const handleLogFilter = useCallback(
    (outcome: string | null) => {
      setLogOutcome(outcome);
      fetchLogs(logSearch, outcome);
    },
    [fetchLogs, logSearch]
  );

  // --- Log export ---
  const handleLogExport = useCallback(() => {
    if (logs.length === 0) return;

    const headers = [
      "Timestamp",
      "Trigger",
      "Action",
      "Outcome",
      "Duration (ms)",
      "Reason",
      "AI Decision",
    ];

    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = logs.map((log) =>
      [
        new Date(log.timestamp).toISOString(),
        log.trigger_source,
        log.action_executed,
        log.outcome,
        log.duration_ms?.toString() ?? "",
        log.reason ?? "",
        log.ai_decision_summary ?? "",
      ]
        .map(escapeCSV)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset?.name ?? "asset"}-logs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs, asset?.name]);

  // --- Config toggle ---
  const handleConfigToggle = async (key: string, enabled: boolean) => {
    if (!asset) return;
    const prevConfig = { ...asset.config };
    const newConfig = { ...asset.config, [key]: enabled };

    // Optimistic update
    setAsset({ ...asset, config: newConfig });

    const res = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: newConfig }),
    });

    if (!res.ok) {
      // Revert on failure
      setAsset((prev) => (prev ? { ...prev, config: prevConfig } : prev));
    }
  };

  // --- Test / Simulate ---
  const handleSimulate = () => {
    if (!asset) return;
    const simLog: AutomationLog = {
      id: `sim-${Date.now()}`,
      realtor_id: asset.realtor_id,
      automation_id: null,
      asset_id: asset.id,
      timestamp: new Date().toISOString(),
      trigger_source: "Manual simulation",
      action_executed: `${asset.type} dry run`,
      outcome: "skipped",
      reason: "Simulated run — no data was sent or modified",
      ai_decision_summary: `Simulated execution of ${asset.name}. In production, this would process a real trigger through the ${asset.type} pipeline.`,
      metadata: { simulated: true },
      duration_ms: 0,
    };
    setLogs((prev) => [simLog, ...prev]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-600">Asset not found</p>
      </div>
    );
  }

  const Icon = typeIcons[asset.type] || Phone;

  // Derive AI confidence from outcome metrics
  const confidence = Math.round(
    (asset.response_success_rate * 0.4 +
      asset.completion_rate * 0.3 +
      (100 - asset.error_rate) * 0.3)
  );

  return (
    <div className="max-w-6xl space-y-8">
      {/* Back + header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center">
              <Icon className="w-6 h-6 text-neutral-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
                {asset.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <StatusIndicator status={asset.status} size="md" />
                <span className="text-xs text-neutral-600">
                  {asset.type.toUpperCase()} AI
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleStatus}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              asset.status === "active"
                ? "bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
                : "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
            }`}
          >
            {asset.status === "active" ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Activate
              </>
            )}
          </button>
          <button
            onClick={handleSimulate}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Test / Simulate
          </button>
        </div>
      </div>

      {/* Performance breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5 flex flex-col items-center">
          <PerformanceMeter score={asset.performance_score} size="lg" />
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mt-2">
            Overall
          </p>
        </div>
        {[
          { label: "Response Success", value: asset.response_success_rate },
          { label: "Engagement", value: asset.engagement_rate },
          { label: "Completion", value: asset.completion_rate },
          { label: "AI Confidence", value: confidence },
        ].map((metric) => (
          <div
            key={metric.label}
            className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5"
          >
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-3">
              {metric.label}
            </p>
            <PerformanceMeter score={metric.value} variant="bar" />
          </div>
        ))}
      </div>

      {/* Key metric + error rate */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            {asset.key_metric_label}
          </p>
          <p className="text-3xl font-semibold text-neutral-200">
            {asset.key_metric_value.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Error Rate
          </p>
          <p className="text-3xl font-semibold text-red-400">
            {asset.error_rate}%
          </p>
        </div>
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Connected Automations
          </p>
          <p className="text-3xl font-semibold text-neutral-200">
            {automations.length}
          </p>
        </div>
      </div>

      {/* Configuration panel */}
      {asset.config && Object.keys(asset.config).length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
            Configuration
          </h2>
          <div className="space-y-2">
            {Object.entries(asset.config).map(([key, value]) => (
              <FeatureToggle
                key={key}
                label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                enabled={Boolean(value)}
                onChange={(enabled) => handleConfigToggle(key, enabled)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Audit logs */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Audit Logs
        </h2>
        <LogTable
          logs={logs}
          onSearch={handleLogSearch}
          onFilterChange={handleLogFilter}
          onExport={handleLogExport}
        />
      </div>
    </div>
  );
}
