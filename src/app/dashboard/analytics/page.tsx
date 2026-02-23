"use client";

import { useEffect, useState } from "react";
import { HubMetricCard } from "@/components/hub/hub-metric-card";
import {
  LeadsAndAppointmentsChart,
  AutomationRunsChart,
  CommissionChart,
  ResponseTimeChart,
} from "@/components/hub/analytics-charts";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  DollarSign,
  Clock,
  Zap,
  Activity,
  Loader2,
} from "lucide-react";
import type { HubAnalytics } from "@/types";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<HubAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?days=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setAnalytics(data.totals ? data : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  const totals = analytics?.totals;
  const daily = analytics?.daily || [];

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
            Analytics & ROI
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Performance metrics and return on investment
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1">
          {[
            { value: 7, label: "7D" },
            { value: 30, label: "30D" },
            { value: 90, label: "90D" },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${
                range === r.value
                  ? "bg-neutral-800 text-neutral-200"
                  : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <HubMetricCard
          label="AI-Handled Leads"
          value={formatNumber(totals?.aiHandledLeads || 0)}
          icon={<Users className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Appointments"
          value={formatNumber(totals?.appointmentsBooked || 0)}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Est. Commission"
          value={formatCurrency(totals?.estimatedCommission || 0)}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Avg Response"
          value={`${totals?.avgResponseTime || 0}ms`}
          icon={<Clock className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Total Runs"
          value={formatNumber(totals?.totalRuns || 0)}
          icon={<Zap className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Success Rate"
          value={`${totals?.successRate || 0}%`}
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LeadsAndAppointmentsChart data={daily} />
        <AutomationRunsChart data={daily} />
        <CommissionChart data={daily} />
        <ResponseTimeChart data={daily} />
      </div>
    </div>
  );
}
