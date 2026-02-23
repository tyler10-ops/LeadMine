"use client";

import Link from "next/link";
import { CalendarCheck2, Clock, User } from "lucide-react";
import type { Appointment } from "@/types";

const meetingLabels: Record<string, string> = {
  consultation: "Consultation",
  showing: "Showing",
  listing_presentation: "Listing Pres.",
  follow_up: "Follow-up",
  closing: "Closing",
};

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
}

function getCountdown(scheduledAt: string): string {
  const diff = new Date(scheduledAt).getTime() - Date.now();
  if (diff < 0) return "Now";
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  return `${mins}m`;
}

export function UpcomingAppointments({ appointments }: UpcomingAppointmentsProps) {
  if (appointments.length === 0) {
    return (
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
            Upcoming Appointments
          </span>
        </div>
        <p className="text-xs text-neutral-600 text-center py-3">
          No upcoming appointments
        </p>
      </div>
    );
  }

  return (
    <Link href="/dashboard/appointments">
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
            Upcoming Appointments
          </span>
          <CalendarCheck2 className="w-4 h-4 text-neutral-700" />
        </div>

        <div className="space-y-2">
          {appointments.slice(0, 3).map((apt) => (
            <div
              key={apt.id}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-neutral-300 truncate">
                    {apt.lead_name || "Lead"}
                  </p>
                  <p className="text-[10px] text-neutral-600">
                    {meetingLabels[apt.meeting_type] || apt.meeting_type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-neutral-600" />
                <span className="text-[10px] font-medium text-neutral-500">
                  {getCountdown(apt.scheduled_at)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {appointments.length > 3 && (
          <p className="text-[10px] text-neutral-600 mt-2 pt-2 border-t border-neutral-800/50">
            +{appointments.length - 3} more
          </p>
        )}
      </div>
    </Link>
  );
}
