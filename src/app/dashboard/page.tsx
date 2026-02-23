"use client";

import { useEffect, useState } from "react";
import { HubMetricCard } from "@/components/hub/hub-metric-card";
import { AssetCard } from "@/components/hub/asset-card";
import { AutomationCard } from "@/components/hub/automation-card";
import { MarketFeed } from "@/components/hub/market-feed";
import { formatNumber, formatCurrency } from "@/lib/utils";
import {
  Users,
  CalendarCheck,
  DollarSign,
  Zap,
  Activity,
  Loader2,
} from "lucide-react";
import type { AIAsset, Automation, MarketNews, HubAnalytics, PipelineStats, CallingAgentMetrics, Appointment } from "@/types";
import { PipelineSummaryWidget } from "@/components/hub/pipeline-summary-widget";
import { CallingStatsWidget } from "@/components/hub/calling-stats-widget";
import { UpcomingAppointments } from "@/components/hub/upcoming-appointments";
import Link from "next/link";

export default function CommandCenter() {
  const [assets, setAssets] = useState<AIAsset[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [analytics, setAnalytics] = useState<HubAnalytics | null>(null);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [callingAgents, setCallingAgents] = useState<CallingAgentMetrics[]>([]);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/assets").then((r) => r.json()),
      fetch("/api/automations").then((r) => r.json()),
      fetch("/api/market-intel?limit=5").then((r) => r.json()),
      fetch("/api/analytics?days=30").then((r) => r.json()),
      fetch("/api/pipeline/stats").then((r) => r.json()),
      fetch("/api/calling/agents").then((r) => r.json()),
      fetch("/api/appointments?upcoming=true&limit=5").then((r) => r.json()),
    ])
      .then(([a, au, n, an, ps, ca, ua]) => {
        setAssets(Array.isArray(a) ? a : []);
        setAutomations(Array.isArray(au) ? au : []);
        setNews(Array.isArray(n) ? n : []);
        setAnalytics(an.totals ? an : null);
        setPipelineStats(ps.total !== undefined ? ps : null);
        setCallingAgents(Array.isArray(ca) ? ca : []);
        setUpcomingAppts(Array.isArray(ua) ? ua : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  const totals = analytics?.totals;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          Command Center
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Real-time overview of all AI systems and automations
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <HubMetricCard
          label="AI-Handled Leads"
          value={formatNumber(totals?.aiHandledLeads || 0)}
          icon={<Users className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Appointments Booked"
          value={formatNumber(totals?.appointmentsBooked || 0)}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Est. Commission"
          value={formatCurrency(totals?.estimatedCommission || 0)}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Automation Runs"
          value={formatNumber(totals?.totalRuns || 0)}
          icon={<Zap className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Success Rate"
          value={`${totals?.successRate || 0}%`}
          icon={<Activity className="w-4 h-4" />}
        />
      </div>

      {/* Pipeline, Calling, Appointments widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pipelineStats && <PipelineSummaryWidget stats={pipelineStats} />}
        <CallingStatsWidget
          callsToday={callingAgents.reduce((sum, a) => sum + a.calls_today, 0)}
          conversationsToday={callingAgents.reduce((sum, a) => sum + a.conversations_started, 0)}
          appointmentsToday={callingAgents.reduce((sum, a) => sum + a.appointments_booked, 0)}
        />
        <UpcomingAppointments appointments={upcomingAppts} />
      </div>

      {/* AI Assets section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            AI Assets
          </h2>
          <Link
            href="/dashboard/assets"
            className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            View All
          </Link>
        </div>
        {assets.length === 0 ? (
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-600">
              No AI assets configured. Assets will appear here once active.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.slice(0, 6).map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>

      {/* Automations section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Automation Systems
          </h2>
          <Link
            href="/dashboard/automations"
            className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            View All
          </Link>
        </div>
        {automations.length === 0 ? (
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-600">
              No automations configured yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {automations.slice(0, 4).map((auto) => (
              <AutomationCard key={auto.id} automation={auto} />
            ))}
          </div>
        )}
      </div>

      {/* Market Intelligence */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Market Intelligence
          </h2>
          <Link
            href="/dashboard/market"
            className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Full Feed
          </Link>
        </div>
        <MarketFeed news={news} />
      </div>
    </div>
  );
}
