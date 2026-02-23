"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import { PipelineStageBadge } from "./pipeline-stage-badge";
import { User, Clock } from "lucide-react";
import type { Lead, LeadStage } from "@/types";

const columns: { stage: LeadStage; label: string; color: string }[] = [
  { stage: "new", label: "New", color: "border-blue-500/50" },
  { stage: "contacted", label: "Contacted", color: "border-amber-500/50" },
  { stage: "qualified", label: "Qualified", color: "border-purple-500/50" },
  { stage: "booked", label: "Booked", color: "border-emerald-500/50" },
  { stage: "dead", label: "Dead", color: "border-neutral-600/50" },
];

interface PipelineBoardProps {
  leads: Lead[];
}

function LeadCard({ lead }: { lead: Lead }) {
  const intentColors: Record<string, string> = {
    buyer: "text-blue-400",
    seller: "text-emerald-400",
    investor: "text-purple-400",
    unknown: "text-neutral-500",
  };

  return (
    <Link href={`/dashboard/pipeline/${lead.id}`}>
      <div className="bg-[#111111] border border-neutral-800/50 rounded-lg p-3 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
            {lead.name || lead.email}
          </p>
          <span className={cn("text-[10px] font-medium uppercase", intentColors[lead.intent])}>
            {lead.intent}
          </span>
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1 rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-neutral-500 transition-all"
              style={{ width: `${lead.score}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-600">{lead.score}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-600">{lead.source}</span>
          <div className="flex items-center gap-1 text-[10px] text-neutral-600">
            <Clock className="w-3 h-3" />
            {lead.last_contact_at
              ? getRelativeTime(lead.last_contact_at)
              : getRelativeTime(lead.created_at)}
          </div>
        </div>

        {lead.assigned_agent_id && (
          <div className="mt-2 pt-2 border-t border-neutral-800/50 flex items-center gap-1">
            <User className="w-3 h-3 text-neutral-600" />
            <span className="text-[10px] text-neutral-600">Agent assigned</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function PipelineBoard({ leads }: PipelineBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {columns.map(({ stage, label, color }) => {
        const stageLeads = leads.filter((l) => (l.stage || "new") === stage);
        return (
          <div key={stage} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={cn("border-t-2 rounded-t-sm mb-3 pt-3", color)}>
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <PipelineStageBadge stage={stage} />
                  <span className="text-[10px] text-neutral-600 font-medium">
                    {stageLeads.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {stageLeads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[10px] text-neutral-700">No leads</p>
                </div>
              ) : (
                stageLeads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
