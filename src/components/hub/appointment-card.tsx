"use client";

import { cn } from "@/lib/utils";
import {
  CalendarCheck2,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types";

const statusConfig: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "text-blue-400 bg-blue-500/15" },
  confirmed: { label: "Confirmed", color: "text-emerald-400 bg-emerald-500/15" },
  cancelled: { label: "Cancelled", color: "text-red-400 bg-red-500/15" },
  completed: { label: "Completed", color: "text-neutral-400 bg-neutral-500/15" },
  no_show: { label: "No Show", color: "text-amber-400 bg-amber-500/15" },
};

const meetingLabels: Record<string, string> = {
  consultation: "Buyer Consultation",
  showing: "Property Showing",
  listing_presentation: "Listing Presentation",
  follow_up: "Follow-up Meeting",
  closing: "Closing",
};

interface AppointmentCardProps {
  appointment: Appointment;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

function getCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return "Past";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  return `${mins}m`;
}

export function AppointmentCard({
  appointment,
  onStatusChange,
  expanded,
  onToggleExpand,
}: AppointmentCardProps) {
  const apt = appointment;
  const config = statusConfig[apt.status];
  const isPast = new Date(apt.scheduled_at).getTime() < Date.now();

  return (
    <div className="bg-[#111111] border border-neutral-800/50 rounded-xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center">
              <CalendarCheck2 className="w-4 h-4 text-neutral-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-200">
                {meetingLabels[apt.meeting_type] || apt.meeting_type}
              </p>
              <p className="text-[10px] text-neutral-600">
                {new Date(apt.scheduled_at).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {" · "}
                {apt.duration_minutes}min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && (
              <span className="text-[10px] font-medium text-neutral-500">
                {getCountdown(apt.scheduled_at)}
              </span>
            )}
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Lead info */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-neutral-600" />
            <span className="text-xs text-neutral-400">{apt.lead_name || "Unknown"}</span>
          </div>
          {apt.lead_phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3 text-neutral-600" />
              <span className="text-xs text-neutral-500">{apt.lead_phone}</span>
            </div>
          )}
          {apt.lead_email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-neutral-600" />
              <span className="text-xs text-neutral-500">{apt.lead_email}</span>
            </div>
          )}
        </div>

        {apt.location && (
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="w-3 h-3 text-neutral-600" />
            <span className="text-xs text-neutral-500">{apt.location}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {expanded ? "Hide Details" : "View Handoff"}
            </button>
          )}
          {onStatusChange && apt.status === "scheduled" && (
            <>
              <button
                onClick={() => onStatusChange(apt.id, "confirmed")}
                className="px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-400 rounded-md hover:bg-emerald-500/25 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => onStatusChange(apt.id, "cancelled")}
                className="px-2 py-1 text-[10px] font-medium bg-red-500/15 text-red-400 rounded-md hover:bg-red-500/25 transition-colors"
              >
                Cancel
              </button>
            </>
          )}
          {onStatusChange && apt.status === "confirmed" && (
            <button
              onClick={() => onStatusChange(apt.id, "completed")}
              className="px-2 py-1 text-[10px] font-medium bg-neutral-800 text-neutral-300 rounded-md hover:bg-neutral-700 transition-colors"
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
