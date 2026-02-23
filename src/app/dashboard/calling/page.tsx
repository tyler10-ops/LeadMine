"use client";

import { useEffect, useState } from "react";
import { HubMetricCard } from "@/components/hub/hub-metric-card";
import { CallingAgentCard } from "@/components/hub/calling-agent-card";
import { CallLogTable } from "@/components/hub/call-log-table";
import { formatNumber } from "@/lib/utils";
import { Phone, MessageCircle, CalendarCheck, TrendingUp, Loader2 } from "lucide-react";
import type { CallingAgentMetrics, CallRecord } from "@/types";

export default function CallingPage() {
  const [agents, setAgents] = useState<CallingAgentMetrics[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/calling/agents").then((r) => r.json()),
      fetch("/api/calling/calls?limit=20").then((r) => r.json()),
    ])
      .then(([a, c]) => {
        setAgents(Array.isArray(a) ? a : []);
        setRecentCalls(Array.isArray(c) ? c : []);
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

  // Aggregate metrics
  const totalCallsToday = agents.reduce((sum, a) => sum + a.calls_today, 0);
  const totalConversations = agents.reduce((sum, a) => sum + a.conversations_started, 0);
  const totalAppointments = agents.reduce((sum, a) => sum + a.appointments_booked, 0);
  const overallConversion = totalConversations > 0
    ? Math.round((totalAppointments / totalConversations) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          AI Calling Agents
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Monitor AI agent performance and call activity
        </p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HubMetricCard
          label="Calls Today"
          value={formatNumber(totalCallsToday)}
          icon={<Phone className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Conversations"
          value={formatNumber(totalConversations)}
          icon={<MessageCircle className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Appts Booked"
          value={formatNumber(totalAppointments)}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Conversion Rate"
          value={`${overallConversion}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Agent cards */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Agents
        </h2>
        {agents.length === 0 ? (
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-600">
              No calling agents configured. Create voice or SMS assets to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agents.map((m) => (
              <CallingAgentCard key={m.asset.id} metrics={m} />
            ))}
          </div>
        )}
      </div>

      {/* Recent calls */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Recent Calls
        </h2>
        <CallLogTable calls={recentCalls} />
      </div>
    </div>
  );
}
