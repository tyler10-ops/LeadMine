"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { HubMetricCard } from "@/components/hub/hub-metric-card";
import { StatusIndicator } from "@/components/hub/status-indicator";
import { CallLogTable } from "@/components/hub/call-log-table";
import { TranscriptViewer } from "@/components/hub/transcript-viewer";
import { CallRecordingPlayer } from "@/components/hub/call-recording-player";
import { ObjectionConfig } from "@/components/hub/objection-config";
import { FeatureToggle } from "@/components/hub/feature-toggle";
import { formatNumber } from "@/lib/utils";
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  CalendarCheck,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import type { AIAsset, CallRecord, ObjectionScript } from "@/types";

interface AgentDetail {
  asset: AIAsset;
  calls: CallRecord[];
  objections: ObjectionScript[];
  metrics: {
    total_calls: number;
    calls_today: number;
    conversations_started: number;
    appointments_booked: number;
    conversion_rate: number;
    avg_duration: number;
  };
}

export default function CallingAgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    fetch(`/api/calling/agents/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.asset ? d : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-neutral-600">Agent not found</p>
        <Link href="/dashboard/calling" className="text-xs text-neutral-500 hover:text-neutral-300 mt-2 inline-block">
          Back to agents
        </Link>
      </div>
    );
  }

  const { asset, calls, objections, metrics } = data;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back link */}
      <Link
        href="/dashboard/calling"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        AI Calling
      </Link>

      {/* Header */}
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Phone className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
                {asset.name}
              </h1>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mt-0.5">
                {asset.type === "voice" ? "Voice AI Agent" : "SMS AI Agent"}
              </p>
            </div>
          </div>
          <StatusIndicator status={asset.status} size="md" />
        </div>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <HubMetricCard
          label="Total Calls"
          value={formatNumber(metrics.total_calls)}
          icon={<Phone className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Conversations"
          value={formatNumber(metrics.conversations_started)}
          icon={<MessageCircle className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Appts Booked"
          value={formatNumber(metrics.appointments_booked)}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Conversion"
          value={`${metrics.conversion_rate}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Avg Duration"
          value={`${Math.floor(metrics.avg_duration / 60)}:${(metrics.avg_duration % 60).toString().padStart(2, "0")}`}
          icon={<Clock className="w-4 h-4" />}
        />
      </div>

      {/* Call history */}
      <div>
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Call History
        </h2>
        <CallLogTable calls={calls} />
      </div>

      {/* Transcript viewer for selected call */}
      {selectedCall && selectedCall.transcript && selectedCall.transcript.length > 0 && (
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
              Call Transcript
            </h2>
            <button
              onClick={() => setSelectedCall(null)}
              className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Close
            </button>
          </div>
          <CallRecordingPlayer duration={selectedCall.duration_seconds} />
          <div className="mt-4">
            <TranscriptViewer transcript={selectedCall.transcript} />
          </div>
        </div>
      )}

      {/* Mock recording player preview */}
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Recording Player
        </h2>
        <CallRecordingPlayer duration={calls[0]?.duration_seconds || 75} />
      </div>

      {/* Objection handling */}
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Objection Handling Scripts
        </h2>
        <ObjectionConfig objections={objections} />
      </div>

      {/* Agent config */}
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
          Agent Configuration
        </h2>
        <div className="space-y-2">
          <FeatureToggle
            label="Auto-Qualify Leads"
            description="Automatically move leads to 'qualified' after successful conversation"
            enabled={true}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Auto-Book Appointments"
            description="Allow agent to schedule appointments during calls"
            enabled={true}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Voicemail Detection"
            description="Detect voicemail and leave pre-configured message"
            enabled={false}
            onChange={() => {}}
          />
          <FeatureToggle
            label="Call Window Restrictions"
            description="Only make calls between 9am-8pm local time"
            enabled={true}
            onChange={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
