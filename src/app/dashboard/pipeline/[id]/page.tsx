"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PipelineStageBadge } from "@/components/hub/pipeline-stage-badge";
import { LeadTimeline } from "@/components/hub/lead-timeline";
import { QualificationForm } from "@/components/hub/qualification-form";
import { LeadSummaryCard } from "@/components/hub/lead-summary-card";
import { FollowUpCadence } from "@/components/hub/follow-up-cadence";
import { TranscriptViewer } from "@/components/hub/transcript-viewer";
import { cn } from "@/lib/utils";
import {
  Phone,
  Mail,
  ArrowLeft,
  User,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import type { LeadDetail, LeadStage, LeadQualification, CallRecord } from "@/types";

const stages: LeadStage[] = ["new", "contacted", "qualified", "booked", "dead"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pipeline/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.lead ? d : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleStageChange = async (stage: LeadStage) => {
    if (!data) return;
    const res = await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) => prev ? { ...prev, lead: updated } : null);
    }
  };

  const handleQualificationSave = async (qualification: LeadQualification) => {
    const res = await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qualification }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData((prev) => prev ? { ...prev, lead: updated } : null);
    }
  };

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
        <p className="text-sm text-neutral-600">Lead not found</p>
        <Link href="/dashboard/pipeline" className="text-xs text-neutral-500 hover:text-neutral-300 mt-2 inline-block">
          Back to pipeline
        </Link>
      </div>
    );
  }

  const { lead, calls, followUps, timeline, assignedAgent } = data;
  const intentColors: Record<string, string> = {
    buyer: "text-blue-400",
    seller: "text-emerald-400",
    investor: "text-purple-400",
    unknown: "text-neutral-500",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back link */}
      <Link
        href="/dashboard/pipeline"
        className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Pipeline
      </Link>

      {/* Header */}
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
              {lead.name || lead.email}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {lead.phone && (
                <span className="flex items-center gap-1 text-xs text-neutral-500">
                  <Phone className="w-3 h-3" />
                  {lead.phone}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-neutral-500">
                <Mail className="w-3 h-3" />
                {lead.email}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-medium uppercase", intentColors[lead.intent])}>
              {lead.intent}
            </span>
            <PipelineStageBadge stage={lead.stage || "new"} size="md" />
          </div>
        </div>

        {/* Stage selector */}
        <div className="mt-4 pt-4 border-t border-neutral-800/50">
          <div className="flex items-center gap-1">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center">
                <button
                  onClick={() => handleStageChange(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                    (lead.stage || "new") === s
                      ? "bg-neutral-800 text-neutral-200"
                      : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
                {i < stages.length - 1 && (
                  <span className="text-neutral-800 mx-0.5">/</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Assigned agent */}
        {assignedAgent && (
          <div className="mt-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-xs text-neutral-500">
              Assigned to <span className="text-neutral-300">{assignedAgent.name}</span>
            </span>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Timeline (60%) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">
              Activity Timeline
            </h2>
            <LeadTimeline entries={timeline} />
          </div>

          {/* Inline transcript viewer for calls */}
          {calls.length > 0 && (
            <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-4">
                Call Transcripts
              </h2>
              <div className="space-y-2">
                {calls.map((call: CallRecord) => (
                  <div key={call.id}>
                    <button
                      onClick={() => setExpandedCall(expandedCall === call.id ? null : call.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg bg-[#0d0d0d] border border-neutral-800/30 hover:border-neutral-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Phone className="w-3.5 h-3.5 text-neutral-600" />
                        <div>
                          <p className="text-sm text-neutral-300">
                            {call.direction === "outbound" ? "Outbound" : "Inbound"} call
                          </p>
                          <p className="text-[10px] text-neutral-600">
                            {call.duration_seconds}s &middot; {call.outcome?.replace("_", " ") || call.status}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-700">
                        {expandedCall === call.id ? "Collapse" : "Expand"}
                      </span>
                    </button>
                    {expandedCall === call.id && call.transcript && call.transcript.length > 0 && (
                      <div className="mt-2 ml-6">
                        <TranscriptViewer transcript={call.transcript} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Qualification + Summary (40%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary chips */}
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
            <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
              Lead Summary
            </h2>
            <LeadSummaryCard qualification={lead.qualification || {}} />
          </div>

          {/* Qualification form */}
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
            <QualificationForm
              qualification={lead.qualification || {}}
              onSave={handleQualificationSave}
            />
          </div>

          {/* Follow-up cadence */}
          {followUps.length > 0 && (
            <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Follow-up Cadence
              </h2>
              <FollowUpCadence activities={followUps} />
            </div>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
              <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] font-medium bg-neutral-800 text-neutral-400 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
