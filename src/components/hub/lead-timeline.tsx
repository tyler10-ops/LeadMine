"use client";

import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import { SentimentBadge } from "./sentiment-badge";
import {
  Phone,
  MessageSquare,
  Mail,
  ArrowRightLeft,
  StickyNote,
  CalendarCheck2,
} from "lucide-react";
import type { LeadTimelineEntry, CallSentiment } from "@/types";

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  call: { icon: Phone, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  sms: { icon: MessageSquare, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  email: { icon: Mail, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  stage_change: { icon: ArrowRightLeft, color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20" },
  note: { icon: StickyNote, color: "text-neutral-400 bg-neutral-500/10 border-neutral-500/20" },
  appointment: { icon: CalendarCheck2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

interface LeadTimelineProps {
  entries: LeadTimelineEntry[];
}

export function LeadTimeline({ entries }: LeadTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-neutral-600">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-neutral-800/50" />

      <div className="space-y-4">
        {entries.map((entry, i) => {
          const config = typeConfig[entry.type] || typeConfig.note;
          const Icon = config.icon;

          return (
            <div key={i} className="relative flex gap-3 pl-1">
              {/* Icon node */}
              <div
                className={cn(
                  "relative z-10 w-7 h-7 rounded-full border flex items-center justify-center shrink-0",
                  config.color
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-neutral-300">{entry.title}</p>
                  {entry.metadata?.sentiment ? (
                    <SentimentBadge sentiment={String(entry.metadata.sentiment) as CallSentiment} />
                  ) : null}
                </div>
                {entry.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2">{entry.description}</p>
                )}
                <p className="text-[10px] text-neutral-700 mt-1">
                  {getRelativeTime(entry.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
