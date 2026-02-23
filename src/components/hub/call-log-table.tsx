"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import { SentimentBadge } from "./sentiment-badge";
import { TranscriptViewer } from "./transcript-viewer";
import {
  PhoneIncoming,
  PhoneOutgoing,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { CallRecord } from "@/types";

interface CallLogTableProps {
  calls: CallRecord[];
}

const statusColors: Record<string, string> = {
  completed: "text-emerald-400",
  no_answer: "text-amber-400",
  voicemail: "text-blue-400",
  busy: "text-orange-400",
  failed: "text-red-400",
};

const outcomeLabels: Record<string, string> = {
  appointment_set: "Appointment Set",
  follow_up_needed: "Follow-up Needed",
  not_interested: "Not Interested",
  callback_requested: "Callback Requested",
  qualified: "Qualified",
  escalated: "Escalated",
};

export function CallLogTable({ calls }: CallLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (calls.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-neutral-600">No call records yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-neutral-800/50 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-800/50">
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4 w-8" />
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Time
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Direction
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Duration
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Status
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Sentiment
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Outcome
            </th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const isExpanded = expandedId === call.id;
            const hasTranscript = call.transcript && call.transcript.length > 0;

            return (
              <tr key={call.id} className="group">
                <td colSpan={7} className="p-0">
                  <button
                    onClick={() => hasTranscript && setExpandedId(isExpanded ? null : call.id)}
                    className={cn(
                      "w-full flex items-center hover:bg-neutral-800/20 transition-colors",
                      hasTranscript && "cursor-pointer"
                    )}
                    disabled={!hasTranscript}
                  >
                    <div className="py-3 px-4 w-8">
                      {hasTranscript && (
                        isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-neutral-600" />
                          : <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                      )}
                    </div>
                    <div className="py-3 px-4 flex-1 text-left">
                      <span className="text-xs text-neutral-400">
                        {getRelativeTime(call.started_at)}
                      </span>
                    </div>
                    <div className="py-3 px-4 flex-1">
                      {call.direction === "outbound" ? (
                        <PhoneOutgoing className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="py-3 px-4 flex-1 text-left">
                      <span className="text-xs text-neutral-400">
                        {Math.floor(call.duration_seconds / 60)}:{(call.duration_seconds % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                    <div className="py-3 px-4 flex-1 text-left">
                      <span className={cn("text-xs font-medium capitalize", statusColors[call.status])}>
                        {call.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="py-3 px-4 flex-1">
                      <SentimentBadge sentiment={call.sentiment} />
                    </div>
                    <div className="py-3 px-4 flex-1 text-left">
                      <span className="text-xs text-neutral-500">
                        {call.outcome ? outcomeLabels[call.outcome] || call.outcome : "—"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded transcript */}
                  {isExpanded && hasTranscript && (
                    <div className="px-4 pb-4 pt-1 border-t border-neutral-800/30">
                      {call.ai_summary && (
                        <p className="text-xs text-neutral-500 mb-3 italic">
                          {call.ai_summary}
                        </p>
                      )}
                      <TranscriptViewer transcript={call.transcript} />
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
