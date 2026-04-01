"use client";

import { useState, useEffect, useCallback } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import {
  ArrowLeft, Pickaxe, Gem, Flame, Mail, Send, Settings,
  MapPin, Shield, Zap, Download, AlertTriangle, UserPlus,
  ArrowRight, Loader2, RefreshCw, Filter,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ActivityEvent {
  id:          string;
  event_type:  string;
  entity_type: string | null;
  entity_id:   string | null;
  title:       string;
  description: string | null;
  metadata:    Record<string, unknown>;
  icon:        string | null;
  severity:    "info" | "success" | "warning" | "error";
  created_at:  string;
}

// ── Icon resolver ─────────────────────────────────────────────────────────────

function EventIcon({ icon, severity }: { icon: string | null; severity: string }) {
  const color =
    severity === "success" ? GEM.green  :
    severity === "warning" ? GEM.yellow :
    severity === "error"   ? GEM.red    :
    "#525252";

  const props = { className: "w-3.5 h-3.5", style: { color } };

  switch (icon) {
    case "pickaxe":     return <Pickaxe    {...props} />;
    case "gem":         return <Gem        {...props} />;
    case "flame":       return <Flame      {...props} />;
    case "mail":        return <Mail       {...props} />;
    case "send":        return <Send       {...props} />;
    case "settings":    return <Settings   {...props} />;
    case "map-pin":     return <MapPin     {...props} />;
    case "map-pin-off": return <MapPin     {...props} />;
    case "shield":      return <Shield     {...props} />;
    case "zap":         return <Zap        {...props} />;
    case "download":    return <Download   {...props} />;
    case "alert":       return <AlertTriangle {...props} />;
    case "user-plus":   return <UserPlus   {...props} />;
    case "arrow-right": return <ArrowRight {...props} />;
    default:            return <Gem        {...props} />;
  }
}

// ── Severity dot ──────────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: string }) {
  const bg =
    severity === "success" ? GEM.green  :
    severity === "warning" ? GEM.yellow :
    severity === "error"   ? GEM.red    :
    "#333";
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: bg, boxShadow: severity !== "info" ? `0 0 4px ${bg}` : undefined }}
    />
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Filter options ─────────────────────────────────────────────────────────────

const FILTERS = [
  { label: "All",       value: ""          },
  { label: "Mining",    value: "mine"      },
  { label: "Leads",     value: "lead"      },
  { label: "Outreach",  value: "outreach"  },
  { label: "Settings",  value: "settings"  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const [events,    setEvents]    = useState<ActivityEvent[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,    setFilter]    = useState("");

  const fetchEvents = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    const params = new URLSearchParams({ limit: "100" });
    const res = await fetch(`/api/activity?${params}`);
    if (res.ok) {
      const data = await res.json();
      // Client-side filter since event_type is a prefix
      const filtered = filter
        ? (data.events as ActivityEvent[]).filter((e) => e.event_type.startsWith(filter))
        : data.events;
      setEvents(filtered ?? []);
      setTotal(data.total ?? 0);
    }
    setLoading(false);
    setRefreshing(false);
  }, [filter]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Group events by day
  const grouped = events.reduce<Record<string, ActivityEvent[]>>((acc, e) => {
    const key = dayLabel(e.created_at);
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-[52px] border-b backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.95)", borderColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hub"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <h1 className="text-[13px] font-semibold text-neutral-200">Activity Log</h1>
          {total > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full text-neutral-600"
              style={{ background: CAVE.surface1, border: `1px solid ${CAVE.stoneEdge}` }}>
              {total.toLocaleString()} events
            </span>
          )}
        </div>

        <button
          onClick={() => fetchEvents(true)}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* ── Filters ── */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-700" />
          <div className="flex items-center gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                style={{
                  background: filter === f.value ? "rgba(0,255,136,0.1)"  : CAVE.surface1,
                  border:     `1px solid ${filter === f.value ? GLOW.green.border : CAVE.stoneEdge}`,
                  color:      filter === f.value ? GEM.green : "#737373",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty state ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-700" />
          </div>
        )}

        {!loading && events.length === 0 && (
          <div
            className="rounded-xl px-6 py-14 text-center"
            style={{ background: CAVE.surface1, border: `1px solid ${CAVE.stoneEdge}` }}
          >
            <Pickaxe className="w-8 h-8 mx-auto mb-3 text-neutral-700" />
            <p className="text-[13px] text-neutral-500">No activity recorded yet.</p>
            <p className="text-[11px] text-neutral-700 mt-1">
              Events will appear here as you use LeadMine.
            </p>
          </div>
        )}

        {/* ── Timeline ── */}
        {!loading && Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day}>
            {/* Day label */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">
                {day}
              </span>
              <div className="flex-1 h-px" style={{ background: CAVE.stoneEdge }} />
            </div>

            {/* Events */}
            <div
              className="rounded-xl overflow-hidden divide-y"
              style={{ background: CAVE.surface1, border: `1px solid ${CAVE.stoneEdge}`, borderColor: CAVE.stoneEdge }}
            >
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3.5 px-4 py-3.5 hover:bg-white/[0.015] transition-colors"
                >
                  {/* Icon bubble */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: event.severity === "success" ? "rgba(0,255,136,0.08)"  :
                                  event.severity === "warning" ? "rgba(255,214,10,0.08)" :
                                  event.severity === "error"   ? "rgba(255,59,48,0.08)"  :
                                  CAVE.surface2,
                      border: `1px solid ${
                        event.severity === "success" ? GLOW.green.border  :
                        event.severity === "warning" ? "rgba(255,214,10,0.2)" :
                        event.severity === "error"   ? "rgba(255,59,48,0.2)"  :
                        CAVE.stoneEdge
                      }`,
                    }}
                  >
                    <EventIcon icon={event.icon} severity={event.severity} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <SeverityDot severity={event.severity} />
                      <p className="text-[13px] text-neutral-200 font-medium leading-snug truncate">
                        {event.title}
                      </p>
                    </div>
                    {event.description && (
                      <p className="text-[11px] text-neutral-600 mt-0.5 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Time */}
                  <span className="text-[10px] text-neutral-700 flex-shrink-0 mt-1">
                    {relativeTime(event.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
