"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusIndicator } from "@/components/hub/status-indicator";
import { FeatureToggle } from "@/components/hub/feature-toggle";
import { LogTable } from "@/components/hub/log-table";
import { ArrowLeft, Loader2, Play, Pause } from "lucide-react";
import type { Automation, AutomationLog, AutomationModules } from "@/types";

export default function AutomationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/automations/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setAutomation(data.automation);
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  const toggleStatus = async () => {
    if (!automation) return;
    const newStatus = automation.status === "active" ? "paused" : "active";
    const res = await fetch(`/api/automations/${automation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAutomation(updated);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-600">Automation not found</p>
      </div>
    );
  }

  const modules = automation.modules || {};

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
            {automation.name}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <StatusIndicator status={automation.status} size="md" />
            <span className="text-xs text-neutral-600">
              {automation.total_runs.toLocaleString()} total runs
            </span>
          </div>
        </div>
        <button
          onClick={toggleStatus}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
            automation.status === "active"
              ? "bg-amber-400/10 text-amber-400 hover:bg-amber-400/20"
              : "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
          }`}
        >
          {automation.status === "active" ? (
            <>
              <Pause className="w-3.5 h-3.5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" /> Activate
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Success Rate
          </p>
          <p className="text-2xl font-semibold text-emerald-400">
            {automation.success_rate}%
          </p>
        </div>
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Failure Rate
          </p>
          <p className="text-2xl font-semibold text-red-400">
            {automation.failure_rate}%
          </p>
        </div>
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Trigger
          </p>
          <p className="text-sm font-medium text-neutral-300 mt-1">
            {automation.trigger_type}
          </p>
        </div>
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
            Actions
          </p>
          <p className="text-sm font-medium text-neutral-300 mt-1">
            {automation.actions.length} configured
          </p>
        </div>
      </div>

      {/* Actions list */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Actions Pipeline
        </h2>
        <div className="space-y-2">
          {automation.actions.map((action, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-[#111111] border border-neutral-800/50 rounded-lg px-4 py-3"
            >
              <span className="text-[10px] text-neutral-600 font-mono w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded">
                {action.type}
              </span>
              <span className="text-sm text-neutral-300">{action.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feature modules */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Feature Modules
        </h2>
        <div className="space-y-2">
          <FeatureToggle
            label="Call Routing Rules"
            description="Route calls based on lead type and availability"
            enabled={modules.call_routing?.enabled || false}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Follow-Up Timing"
            description={
              modules.follow_up_timing
                ? `${modules.follow_up_timing.delay_minutes}min delay, max ${modules.follow_up_timing.max_attempts} attempts`
                : "Configure follow-up cadence"
            }
            enabled={modules.follow_up_timing?.enabled || false}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Escalation Logic"
            description="Auto-escalate based on priority threshold"
            enabled={modules.escalation?.enabled || false}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Stop Conditions"
            description="Automatically halt automation under defined conditions"
            enabled={modules.stop_conditions?.enabled || false}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Human Takeover"
            description="Transfer to human agent when AI confidence drops"
            enabled={modules.human_takeover?.enabled || false}
            onChange={() => {}}
          />
        </div>
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Execution Logs
        </h2>
        <LogTable logs={logs} onSearch={() => {}} onExport={() => {}} />
      </div>
    </div>
  );
}
