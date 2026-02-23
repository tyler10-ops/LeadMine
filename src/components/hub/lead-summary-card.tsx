"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  Clock,
  MapPin,
  Home,
  Flame,
  ShieldCheck,
} from "lucide-react";
import type { LeadQualification } from "@/types";

interface LeadSummaryCardProps {
  qualification: LeadQualification;
}

export function LeadSummaryCard({ qualification: q }: LeadSummaryCardProps) {
  const chips: { icon: React.ElementType; label: string; color: string }[] = [];

  if (q.budget_min || q.budget_max) {
    const budget = q.budget_min && q.budget_max
      ? `${formatCurrency(q.budget_min)} - ${formatCurrency(q.budget_max)}`
      : q.budget_max
      ? `Up to ${formatCurrency(q.budget_max)}`
      : `From ${formatCurrency(q.budget_min!)}`;
    chips.push({ icon: DollarSign, label: budget, color: "text-emerald-400 bg-emerald-500/10" });
  }

  if (q.timeline) {
    chips.push({ icon: Clock, label: q.timeline, color: "text-blue-400 bg-blue-500/10" });
  }

  if (q.locations && q.locations.length > 0) {
    chips.push({ icon: MapPin, label: q.locations.join(", "), color: "text-amber-400 bg-amber-500/10" });
  }

  if (q.property_type) {
    const label = q.property_type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    chips.push({ icon: Home, label, color: "text-purple-400 bg-purple-500/10" });
  }

  if (q.urgency) {
    const urgencyColors = {
      hot: "text-red-400 bg-red-500/10",
      warm: "text-amber-400 bg-amber-500/10",
      cold: "text-blue-400 bg-blue-500/10",
    };
    chips.push({
      icon: Flame,
      label: q.urgency.charAt(0).toUpperCase() + q.urgency.slice(1),
      color: urgencyColors[q.urgency],
    });
  }

  if (q.pre_approved) {
    chips.push({ icon: ShieldCheck, label: "Pre-approved", color: "text-emerald-400 bg-emerald-500/10" });
  }

  if (chips.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-neutral-600">No qualification data yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => {
        const Icon = chip.icon;
        return (
          <div
            key={i}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
              chip.color
            )}
          >
            <Icon className="w-3 h-3" />
            {chip.label}
          </div>
        );
      })}
    </div>
  );
}
