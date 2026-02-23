"use client";

import { LeadSummaryCard } from "./lead-summary-card";
import { MessageSquare, AlertTriangle, Lightbulb, Target } from "lucide-react";
import type { Appointment } from "@/types";

interface HandoffSummaryProps {
  appointment: Appointment;
}

export function HandoffSummary({ appointment }: HandoffSummaryProps) {
  const apt = appointment;

  return (
    <div className="border-t border-neutral-800/50 p-5 space-y-4 bg-[#0d0d0d]">
      {/* Conversation highlights */}
      {apt.conversation_summary && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Conversation Highlights
            </h4>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            {apt.conversation_summary}
          </p>
        </div>
      )}

      {/* Qualification snapshot */}
      {apt.qualification_snapshot && Object.keys(apt.qualification_snapshot).length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Qualification Snapshot
            </h4>
          </div>
          <LeadSummaryCard qualification={apt.qualification_snapshot} />
        </div>
      )}

      {/* Objections raised */}
      {apt.qualification_snapshot?.objections && apt.qualification_snapshot.objections.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Objections Raised
            </h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {apt.qualification_snapshot.objections.map((obj, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400 rounded-md"
              >
                {obj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key talking points */}
      {apt.key_talking_points && apt.key_talking_points.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            <h4 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Key Talking Points
            </h4>
          </div>
          <ul className="space-y-1.5">
            {apt.key_talking_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="text-sm text-neutral-400">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
