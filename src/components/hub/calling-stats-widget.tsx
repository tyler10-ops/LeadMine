"use client";

import Link from "next/link";
import { Phone, MessageCircle, CalendarCheck } from "lucide-react";

interface CallingStatsWidgetProps {
  callsToday: number;
  conversationsToday: number;
  appointmentsToday: number;
}

export function CallingStatsWidget({
  callsToday,
  conversationsToday,
  appointmentsToday,
}: CallingStatsWidgetProps) {
  return (
    <Link href="/dashboard/calling">
      <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5 hover:border-neutral-700 hover:bg-[#141414] transition-all duration-200 cursor-pointer group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider">
            AI Calling Today
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto mb-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-200">{callsToday}</p>
            <p className="text-[9px] text-neutral-600 uppercase tracking-wider">Calls</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto mb-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-200">{conversationsToday}</p>
            <p className="text-[9px] text-neutral-600 uppercase tracking-wider">Convos</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center mx-auto mb-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg font-semibold text-neutral-200">{appointmentsToday}</p>
            <p className="text-[9px] text-neutral-600 uppercase tracking-wider">Appts</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
