"use client";

import Link from "next/link";
import { StatusIndicator } from "./status-indicator";
import { PerformanceMeter } from "./performance-meter";
import {
  Phone,
  MessageSquare,
  Mail,
  Share2,
  Building,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import type { AIAsset } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  voice: Phone,
  sms: MessageSquare,
  email: Mail,
  social: Share2,
  listing: Building,
  booking: CalendarCheck,
};

const typeLabels: Record<string, string> = {
  voice: "Voice AI",
  sms: "SMS AI",
  email: "Email AI",
  social: "Social AI",
  listing: "Listing AI",
  booking: "Booking AI",
};

interface AssetCardProps {
  asset: AIAsset;
}

export function AssetCard({ asset }: AssetCardProps) {
  const Icon = typeIcons[asset.type] || Phone;

  return (
    <Link href={`/dashboard/assets/${asset.id}`}>
      <div className="group bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer">
        {/* Header: icon, name, status */}
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
                {typeLabels[asset.type]}
              </p>
            </div>
          </div>
          <StatusIndicator status={asset.status} showLabel={false} />
        </div>

        {/* Performance + Key Metric */}
        <div className="flex items-center justify-between">
          <PerformanceMeter score={asset.performance_score} size="sm" />
          <div className="text-right">
            <p className="text-xl font-semibold text-neutral-200">
              {asset.key_metric_value.toLocaleString()}
            </p>
            <p className="text-[10px] text-neutral-600 uppercase tracking-wider">
              {asset.key_metric_label}
            </p>
          </div>
        </div>

        {/* Footer: last active */}
        <div className="mt-4 pt-3 border-t border-neutral-800/50">
          <p className="text-[10px] text-neutral-600">
            Last active{" "}
            <span className="text-neutral-500">
              {asset.last_active_at
                ? getRelativeTime(asset.last_active_at)
                : "never"}
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
