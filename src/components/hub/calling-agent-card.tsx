"use client";

import Link from "next/link";
import { PerformanceMeter } from "./performance-meter";
import { StatusIndicator } from "./status-indicator";
import { Phone, MessageSquare } from "lucide-react";
import { getRelativeTime } from "@/lib/utils";
import type { CallingAgentMetrics } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  voice: Phone,
  sms: MessageSquare,
};

interface CallingAgentCardProps {
  metrics: CallingAgentMetrics;
}

export function CallingAgentCard({ metrics }: CallingAgentCardProps) {
  const { asset } = metrics;
  const Icon = typeIcons[asset.type] || Phone;

  return (
    <Link href={`/dashboard/calling/${asset.id}`}>
      <div className="group bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <Icon className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
                {asset.name}
              </h3>
              <p className="text-[10px] text-neutral-600 uppercase tracking-wider mt-0.5">
                {asset.type === "voice" ? "Voice AI" : "SMS AI"}
              </p>
            </div>
          </div>
          <StatusIndicator status={asset.status} showLabel={false} />
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Today</p>
            <p className="text-lg font-semibold text-neutral-200">{metrics.calls_today}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">This Week</p>
            <p className="text-lg font-semibold text-neutral-200">{metrics.calls_this_week}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Conversations</p>
            <p className="text-lg font-semibold text-neutral-200">{metrics.conversations_started}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Appts Booked</p>
            <p className="text-lg font-semibold text-neutral-200">{metrics.appointments_booked}</p>
          </div>
        </div>

        {/* Conversion rate ring + last active */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800/50">
          <PerformanceMeter score={metrics.conversion_rate} size="sm" />
          <div className="text-right">
            <p className="text-[10px] text-neutral-600">Last active</p>
            <p className="text-[10px] text-neutral-500">
              {metrics.last_call_at ? getRelativeTime(metrics.last_call_at) : "never"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
