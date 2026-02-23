"use client";

import { useEffect, useState } from "react";
import { AppointmentCard } from "@/components/hub/appointment-card";
import { HandoffSummary } from "@/components/hub/handoff-summary";
import { Loader2, CalendarCheck2, ChevronDown } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => r.json())
      .then((data) => {
        setAppointments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  const now = new Date();
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) >= now &&
      (a.status === "scheduled" || a.status === "confirmed")
  );
  const past = appointments.filter(
    (a) =>
      new Date(a.scheduled_at) < now ||
      a.status === "completed" ||
      a.status === "cancelled" ||
      a.status === "no_show"
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          Appointments
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Upcoming meetings with AI-qualified leads and handoff summaries
        </p>
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Upcoming ({upcoming.length})
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-8 text-center">
            <p className="text-sm text-neutral-600">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt) => (
              <div key={apt.id}>
                <AppointmentCard
                  appointment={apt}
                  onStatusChange={handleStatusChange}
                  expanded={expandedId === apt.id}
                  onToggleExpand={() =>
                    setExpandedId(expandedId === apt.id ? null : apt.id)
                  }
                />
                {expandedId === apt.id && <HandoffSummary appointment={apt} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past appointments */}
      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-2 mb-4 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`}
            />
            <h2 className="text-sm font-medium uppercase tracking-wider">
              Past Appointments ({past.length})
            </h2>
          </button>

          {showPast && (
            <div className="space-y-3">
              {past.map((apt) => (
                <div key={apt.id}>
                  <AppointmentCard
                    appointment={apt}
                    onStatusChange={handleStatusChange}
                    expanded={expandedId === apt.id}
                    onToggleExpand={() =>
                      setExpandedId(expandedId === apt.id ? null : apt.id)
                    }
                  />
                  {expandedId === apt.id && <HandoffSummary appointment={apt} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
