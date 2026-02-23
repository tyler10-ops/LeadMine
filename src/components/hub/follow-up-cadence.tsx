"use client";

import { cn } from "@/lib/utils";
import { Phone, MessageSquare, Mail, Check, Clock, X } from "lucide-react";
import type { FollowUpActivity } from "@/types";

const channelIcons: Record<string, React.ElementType> = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
};

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-neutral-500 border-neutral-700" },
  sent: { icon: Check, color: "text-blue-400 border-blue-500/50" },
  delivered: { icon: Check, color: "text-blue-400 border-blue-500/50" },
  opened: { icon: Check, color: "text-amber-400 border-amber-500/50" },
  replied: { icon: Check, color: "text-emerald-400 border-emerald-500/50" },
  failed: { icon: X, color: "text-red-400 border-red-500/50" },
};

interface FollowUpCadenceProps {
  activities: FollowUpActivity[];
}

export function FollowUpCadence({ activities }: FollowUpCadenceProps) {
  const sorted = [...activities].sort((a, b) => a.sequence_step - b.sequence_step);

  if (sorted.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-neutral-600">No follow-up sequence</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {sorted.map((activity, i) => {
        const ChannelIcon = channelIcons[activity.channel] || Mail;
        const statusConf = statusConfig[activity.status] || statusConfig.pending;
        const StatusIcon = statusConf.icon;

        return (
          <div key={activity.id} className="flex items-center">
            {/* Step node */}
            <div
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg border bg-[#0d0d0d] min-w-[80px]",
                statusConf.color
              )}
            >
              <div className="flex items-center gap-1">
                <ChannelIcon className="w-3 h-3" />
                <StatusIcon className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {activity.channel}
              </span>
              <span className="text-[9px] text-neutral-600">
                Step {activity.sequence_step}
              </span>
            </div>

            {/* Connector line */}
            {i < sorted.length - 1 && (
              <div className="w-4 h-px bg-neutral-800" />
            )}
          </div>
        );
      })}
    </div>
  );
}
