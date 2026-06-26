"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Phone,
  PhoneOff,
  MessageSquare,
  Mail,
  Search,
  Brain,
  Zap,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Target,
  MapPin,
  Bell,
  Download,
  X,
  CheckCircle2,
  Loader2,
  Send,
  User,
  Pickaxe,
  Home,
  Building2,
  Layers,
  TreePine,
  Users,
  DollarSign,
  Clock,
  Minus,
  Plus,
  Radar,
  Activity,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  GEM,
  GLOW,
  CAVE,
  PERF_COLOR,
  scoreToGem,
} from "@/lib/cave-theme";
import { MiningPanel, GlowBorder } from "@/components/ui/mining-panel";
import { GemShard } from "@/components/ui/embedded-gem";
import { Gem } from "@/components/ui/gem";
import { GemGrade as GemGradeBadge } from "@/components/ui/gem-grade";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { canAccess, getLimits } from "@/lib/plan-limits";
import type { Plan } from "@/lib/plan-limits";

// ── Display helpers ────────────────────────────────────────────────────────────

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family: "Single Family",
  condo:         "Condo",
  multi_family:  "Multi-Family",
  townhouse:     "Townhouse",
  land:          "Land",
};

const FLAG_LABELS: Record<string, string> = {
  long_ownership_10yr: "10+ Yrs",
  long_ownership_20yr: "20+ Yrs",
  high_equity_40pct:   "40%+ Equity",
  high_equity_70pct:   "70%+ Equity",
  absentee_owner:      "Absentee",
  stale_transaction:   "5+ Yr Stale",
};

const GRADE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  elite:    { label: "Elite",    color: GEM.green,  bg: GLOW.green.bg  },
  refined:  { label: "Refined",  color: GEM.yellow, bg: GLOW.yellow.bg },
  rock:     { label: "Rock",     color: GEM.red,    bg: GLOW.red.bg    },
  ungraded: { label: "Ungraded", color: "#525252",  bg: "rgba(82,82,82,0.1)" },
};

const STAGE_LIST = ["new", "contacted", "qualified", "booked", "dead"] as const;

// ── PropertyLead type ─────────────────────────────────────────────────────────

interface PropertyLead {
  id: string;
  name: string;
  propertyAddress: string;
  city: string;
  county: string;
  state: string;
  propertyType: string;
  yearsOwned: number;
  equityPercent: number;
  estimatedValue: number;
  isAbsenteeOwner: boolean;
  score: number;
  grade: "elite" | "refined" | "rock";
  flags: string[];
  stage: string;
  aiFlag: boolean;
  phone?: string | null;
  email?: string | null;
  last_contact_at?: string;
  heat_score?: number;
}

// ── DB lead shape from Supabase ────────────────────────────────────────────────
interface DbLead {
  id: string;
  owner_name?: string;
  property_address?: string;
  property_city?: string;
  property_county?: string;
  property_state?: string;
  property_type?: string;
  years_owned?: number;
  equity_percent?: number;
  is_absentee_owner?: boolean;
  opportunity_score?: number;
  heat_score?: number;
  gem_grade?: string;
  signal_flags?: string[];
  stage?: string;
  estimated_value?: number;
  phone?: string | null;
  email?: string | null;
  created_at?: string;
  last_contact_at?: string;
}

function dbLeadToPropertyLead(l: DbLead): PropertyLead {
  return {
    id:              l.id,
    name:            l.owner_name ?? l.property_address ?? "Unknown Owner",
    propertyAddress: l.property_address ?? "",
    city:            l.property_city ?? "",
    county:          l.property_county ?? "",
    state:           l.property_state ?? "",
    propertyType:    l.property_type ?? "single_family",
    yearsOwned:      l.years_owned ?? 0,
    equityPercent:   Math.round(l.equity_percent ?? 0),
    estimatedValue:  l.estimated_value ?? 0,
    isAbsenteeOwner: l.is_absentee_owner ?? false,
    score:           l.heat_score ?? l.opportunity_score ?? 0,
    grade:           (l.gem_grade as "elite" | "refined" | "rock") ?? "rock",
    flags:           l.signal_flags ?? [],
    stage:           l.stage ?? "new",
    aiFlag:          (l.gem_grade === "elite" || l.gem_grade === "refined"),
    phone:           l.phone ?? null,
    email:           l.email ?? null,
    last_contact_at: l.last_contact_at,
    heat_score:      l.heat_score,
  };
}

const PROPERTY_TYPES = ["single_family", "condo", "multi_family", "townhouse"];

// ── Stage color maps ──────────────────────────────────────────────────────────

const stageGem: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",       color: "#3A3A3A",  bg: "rgba(58,58,58,0.15)" },
  contacted: { label: "Contacted", color: GEM.yellow, bg: GLOW.yellow.bg        },
  qualified: { label: "Qualified", color: "#00BB60",  bg: "rgba(0,187,96,0.1)"  },
  booked:    { label: "Booked",    color: GEM.green,  bg: GLOW.green.bg         },
  dead:      { label: "Dead",      color: GEM.red,    bg: GLOW.red.bg           },
};

const stageBarColor: Record<string, string> = {
  New:       "#3A3A3A",
  Contacted: GEM.yellow,
  Qualified: "#00BB60",
  Booked:    GEM.green,
  Dead:      GEM.red,
};

// ── Mock notifications ─────────────────────────────────────────────────────────

type NotifType = "mining_complete";
interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({
  children,
  gemVariant,
}: {
  children: React.ReactNode;
  gemVariant?: "green" | "yellow" | "red";
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {gemVariant && <GemShard variant={gemVariant} size="xs" />}
      <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

// ── Call Overlay ──────────────────────────────────────────────────────────────

function CallOverlay({
  lead,
  duration,
  onHangUp,
  onAdvanceStage,
}: {
  lead: PropertyLead;
  duration: number;
  onHangUp: () => void;
  onAdvanceStage: (stage: string) => void;
}) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [note, setNote] = useState("");
  const [muted, setMuted] = useState(false);

  const handleHangUp = () => {
    onAdvanceStage("contacted");
    onHangUp();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 pointer-events-none">
      <div
        className="w-[420px] rounded-3xl border pointer-events-auto overflow-hidden"
        style={{
          background:  "rgba(10,10,18,0.97)",
          borderColor: `${GEM.green}30`,
          boxShadow:   `0 0 48px rgba(0,255,136,0.12), 0 24px 64px rgba(0,0,0,0.7)`,
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Calling header */}
        <div className="px-6 pt-6 pb-4 text-center">
          {/* Pulse rings */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: `${GEM.green}10`, animationDuration: "2s" }}
            />
            <div
              className="absolute inset-2 rounded-full animate-ping"
              style={{ background: `${GEM.green}18`, animationDuration: "2s", animationDelay: "0.4s" }}
            />
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-bold"
              style={{ background: `${GEM.green}20`, color: GEM.green, border: `2px solid ${GEM.green}40` }}
            >
              {lead.name[0]}
            </div>
          </div>
          <p className="text-[16px] font-semibold text-neutral-100">{lead.name}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">{lead.propertyAddress}, {lead.city}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GEM.green }} />
            <span className="text-[12px] font-mono text-neutral-400">{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Quick note */}
        {showNoteInput ? (
          <div className="px-4 pb-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Call notes..."
              className="w-full text-[12px] text-neutral-300 placeholder-neutral-700 bg-transparent rounded-xl p-2.5 outline-none resize-none"
              rows={2}
              style={{ border: `1px solid ${CAVE.stoneMid}` }}
              autoFocus
            />
          </div>
        ) : (
          <div className="px-4 pb-2 text-center">
            <button
              onClick={() => setShowNoteInput(true)}
              className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              + Add call note
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 px-6 pt-2 pb-6">
          {/* Mute placeholder */}
          <button
            onClick={() => setMuted((m) => !m)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors hover:bg-white/[0.06]"
            style={{
              border: `1px solid ${muted ? GEM.red + "55" : CAVE.stoneMid}`,
              color: muted ? GEM.red : "#a3a3a3",
              background: muted ? `${GEM.red}12` : "transparent",
            }}
          >
            {muted ? "Muted" : "Mute"}
          </button>

          {/* Hang up */}
          <button
            onClick={handleHangUp}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              background: GEM.red,
              boxShadow:  `0 0 24px rgba(255,59,48,0.4)`,
            }}
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>

          {/* Qualify quick-action */}
          <button
            onClick={() => { onAdvanceStage("qualified"); onHangUp(); }}
            className="w-12 h-12 rounded-full flex items-center justify-center text-[9px] font-bold text-center leading-tight transition-colors hover:bg-white/[0.06]"
            style={{ border: `1px solid ${CAVE.stoneMid}`, color: "#00BB60" }}
          >
            Mark<br />Qualified
          </button>
        </div>

        {/* Stage auto-advance note */}
        <div
          className="text-[10px] text-neutral-700 text-center pb-4"
          style={{ color: "#525252" }}
        >
          Hanging up will move lead to <span style={{ color: GEM.yellow }}>Contacted</span>
        </div>
      </div>
    </div>
  );
}

// ── Compose Panel (SMS / Email) ───────────────────────────────────────────────

function ComposePanel({
  lead,
  type,
  onClose,
}: {
  lead: PropertyLead;
  type: "sms" | "email";
  onClose: () => void;
}) {
  const [subject, setSubject]   = useState(`Your property at ${lead.propertyAddress}`);
  const [body, setBody]         = useState("");
  const [sent, setSent]         = useState(false);
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const templates = type === "sms"
    ? [
        `Hi ${lead.name.split(" ")[0]}, I'm a local realtor and noticed your property on ${lead.propertyAddress}. Would you ever consider an offer? Happy to chat.`,
        `${lead.name.split(" ")[0]}, following up about ${lead.propertyAddress}. I have buyers actively looking in ${lead.county} County right now.`,
        `Hi ${lead.name.split(" ")[0]}, just checking in — any interest in a free property valuation for ${lead.propertyAddress}?`,
      ]
    : [
        `Hi ${lead.name},\n\nI'm reaching out because I specialize in ${lead.county} County real estate and your property at ${lead.propertyAddress} caught my attention.\n\nWould you be open to a quick conversation about the current market?\n\nBest regards`,
        `Hi ${lead.name},\n\nI have qualified buyers actively searching in your area. Properties like yours at ${lead.propertyAddress} are in high demand right now.\n\nWould you like a free, no-obligation market analysis?\n\nBest,`,
      ];

  const handleSend = async () => {
    setSendError(null);

    if (type === "sms") {
      if (!lead.phone) {
        setSendError("No phone number on file for this lead.");
        return;
      }
      setSending(true);
      try {
        const res = await fetch("/api/outreach/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: lead.phone, message: body, leadId: lead.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSendError(data.error ?? "Send failed");
          return;
        }
      } catch {
        setSendError("Network error — try again");
        return;
      } finally {
        setSending(false);
      }
    }

    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px]">
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background:  "rgba(10,10,18,0.97)",
          borderColor: type === "sms" ? `${GEM.yellow}30` : `${CAVE.stoneMid}`,
          boxShadow:   "0 8px 40px rgba(0,0,0,0.6)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: CAVE.stoneMid }}
        >
          <div className="flex items-center gap-2">
            {type === "sms"
              ? <MessageSquare className="w-3.5 h-3.5" style={{ color: GEM.yellow }} />
              : <Mail className="w-3.5 h-3.5 text-neutral-500" />
            }
            <p className="text-[12px] font-semibold text-neutral-200">
              {type === "sms" ? "Send SMS" : "Send Email"} — {lead.name}
            </p>
          </div>
          <button onClick={onClose}>
            <X className="w-4 h-4 text-neutral-600 hover:text-neutral-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Recipient */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }}
          >
            <User className="w-3 h-3 text-neutral-600" />
            <span className="text-[11px] text-neutral-400">{lead.name}</span>
            <span className="text-[10px] text-neutral-700 ml-auto">{lead.propertyAddress}</span>
          </div>

          {/* Subject (email only) */}
          {type === "email" && (
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full text-[12px] text-neutral-300 placeholder-neutral-600 bg-transparent outline-none px-3 py-2 rounded-xl"
              style={{ border: `1px solid ${CAVE.stoneMid}`, background: CAVE.surface2 }}
            />
          )}

          {/* Message body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "sms" ? "Write a message..." : "Write your email..."}
            rows={4}
            className="w-full text-[12px] text-neutral-300 placeholder-neutral-600 bg-transparent outline-none resize-none px-3 py-2 rounded-xl"
            style={{ border: `1px solid ${CAVE.stoneMid}`, background: CAVE.surface2 }}
          />

          {/* Quick templates */}
          <div>
            <p className="text-[10px] text-neutral-700 mb-1.5">Quick templates</p>
            <div className="space-y-1">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBody(t)}
                  className="w-full text-left text-[10px] text-neutral-600 hover:text-neutral-400 px-2 py-1.5 rounded-lg transition-colors truncate"
                  style={{ background: CAVE.surface2 }}
                >
                  {t.slice(0, 60)}...
                </button>
              ))}
            </div>
          </div>

          {/* Send button */}
          {sendError && (
            <p className="text-[11px] text-center" style={{ color: GEM.red }}>{sendError}</p>
          )}

          {sent ? (
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: GEM.green }} />
              <span className="text-[12px] font-semibold" style={{ color: GEM.green }}>
                {type === "sms" ? "SMS sent!" : "Email sent!"}
              </span>
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={!body.trim() || sending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold transition-all disabled:opacity-40"
              style={{
                background: type === "sms" ? GEM.yellow : "rgba(255,255,255,0.1)",
                color:      type === "sms" ? "#000" : "#e5e5e5",
              }}
            >
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {sending ? "Sending..." : `Send ${type === "sms" ? "SMS" : "Email"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Street View Carousel ───────────────────────────────────────────────────────

const STREET_VIEW_ANGLES = [
  { heading: "0",   fov: "90",  label: "Front" },
  { heading: "330", fov: "90",  label: "Left"  },
  { heading: "30",  fov: "90",  label: "Right" },
];

function StreetViewCarousel({ address }: { address: string }) {
  const [idx, setIdx]       = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>([false, false, false]);
  const [errors, setErrors] = useState<boolean[]>([false, false, false]);

  const encoded = encodeURIComponent(address);
  const current = STREET_VIEW_ANGLES[idx];

  const markLoaded = (i: number) =>
    setLoaded((prev) => { const n = [...prev]; n[i] = true; return n; });
  const markError = (i: number) =>
    setErrors((prev) => { const n = [...prev]; n[i] = true; return n; });

  if (errors.every(Boolean)) return null;

  return (
    <div className="mx-4 mt-3 rounded-xl overflow-hidden relative" style={{ border: `1px solid ${CAVE.stoneMid}` }}>
      {/* Main image */}
      <div className="relative w-full" style={{ aspectRatio: "16/7", background: CAVE.stoneDeep }}>
        {!loaded[idx] && !errors[idx] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
          </div>
        )}
        {!errors[idx] && (
          <img
            key={idx}
            src={`/api/property/streetview?address=${encoded}&heading=${current.heading}&fov=${current.fov}&size=600x280`}
            alt={`${current.label} view of ${address}`}
            className="w-full h-full object-cover"
            style={{ opacity: loaded[idx] ? 1 : 0, transition: "opacity 0.3s ease" }}
            onLoad={() => markLoaded(idx)}
            onError={() => markError(idx)}
          />
        )}
        {/* Address overlay */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 py-2"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
        >
          <p className="text-[10px] text-neutral-300 truncate">{address}</p>
        </div>
        {/* Nav arrows */}
        {STREET_VIEW_ANGLES.length > 1 && (
          <>
            <button
              onClick={() => setIdx((i) => (i - 1 + STREET_VIEW_ANGLES.length) % STREET_VIEW_ANGLES.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(0,0,0,0.55)", border: `1px solid rgba(255,255,255,0.12)` }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white rotate-180" />
            </button>
            <button
              onClick={() => setIdx((i) => (i + 1) % STREET_VIEW_ANGLES.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: "rgba(0,0,0,0.55)", border: `1px solid rgba(255,255,255,0.12)` }}
            >
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          </>
        )}
      </div>
      {/* Angle dots */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: CAVE.stoneDeep, borderTop: `1px solid ${CAVE.stoneMid}` }}
      >
        <div className="flex gap-1.5">
          {STREET_VIEW_ANGLES.map((a, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="transition-all"
              style={{
                width: i === idx ? 16 : 5, height: 5, borderRadius: 3,
                background: i === idx ? GEM.green : "rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
              }}
            />
          ))}
        </div>
        <span className="text-[10px] text-neutral-600">{current.label} view · Street View</span>
      </div>
    </div>
  );
}

// ── Grade Legend ──────────────────────────────────────────────────────────────

const SIGNAL_BREAKDOWN = [
  { label: "Absentee owner",         points: "+25", color: GEM.green  },
  { label: "Owned 20+ years",        points: "+20", color: GEM.green  },
  { label: "Equity > 70%",           points: "+20", color: GEM.green  },
  { label: "Equity > 40%",           points: "+15", color: GEM.yellow },
  { label: "Owned 10+ years",        points: "+15", color: GEM.yellow },
  { label: "Stale transaction 5+ yr", points: "+10", color: GEM.yellow },
  { label: "Recently sold (<2 yr)",  points: "−35", color: GEM.red   },
  { label: "Incomplete record",      points: "−10", color: GEM.red   },
] as const;

function GradeLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: CAVE.stoneEdge, background: CAVE.stoneDeep }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-[11px] font-semibold text-neutral-400">How gems are graded</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold" style={{ color: GEM.green }}>Elite ≥65</span>
          <span className="text-[10px] font-bold" style={{ color: GEM.yellow }}>Refined ≥35</span>
          <span className="text-[10px] font-bold" style={{ color: GEM.red }}>Rock &lt;35</span>
          <ChevronDown className="w-3 h-3 text-neutral-600 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: CAVE.stoneEdge }}>
          <p className="text-[10px] text-neutral-600 mt-2 mb-2">
            Each property is scored 0–100 based on seller motivation signals from county assessor data.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {SIGNAL_BREAKDOWN.map(s => (
              <div key={s.label} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-neutral-500">{s.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Property Lead Card ─────────────────────────────────────────────────────────

function PropertyLeadCard({
  lead,
  currentStage,
  isHighlighted,
  onCall,
  onSms,
  onEmail,
  onStageChange,
  onSendToAutomation,
}: {
  lead: PropertyLead;
  currentStage: string;
  isHighlighted: boolean;
  onCall: () => void;
  onSms: () => void;
  onEmail: () => void;
  onStageChange: (stage: string) => void;
  onSendToAutomation: () => void;
}) {
  const [showStageMenu, setShowStageMenu] = useState(false);
  const gradeConfig = GRADE_CONFIG[lead.grade] ?? GRADE_CONFIG.ungraded;
  const scoreGemKey = scoreToGem(lead.score);
  const scoreColor  = GEM[scoreGemKey];
  const stage       = stageGem[currentStage] ?? stageGem.new;

  return (
    <div
      className="rounded-2xl border transition-all overflow-hidden relative"
      style={{
        background:  CAVE.surface2,
        borderColor: isHighlighted
          ? GEM.yellow
          : lead.grade === "elite"
          ? `${GEM.green}28`
          : lead.grade === "refined"
          ? `${GEM.yellow}20`
          : CAVE.stoneEdge,
        boxShadow: isHighlighted
          ? `0 0 24px rgba(255,214,10,0.15)`
          : lead.grade === "elite"
          ? `0 0 20px rgba(0,255,136,0.06)`
          : "none",
      }}
    >
      {/* Left grade accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: gradeConfig.color, opacity: lead.grade === "rock" ? 0.2 : 0.7 }}
      />

      {/* Header */}
      <div className="flex items-start gap-3 pl-4 pr-3.5 pt-3.5 pb-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-0.5"
          style={{ background: `${gradeConfig.color}15`, color: gradeConfig.color }}
        >
          {lead.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-[13px] font-semibold text-neutral-100 truncate">{lead.name}</p>
              {lead.aiFlag && <Zap className="w-3 h-3 flex-shrink-0" style={{ color: GEM.green }} />}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <GemGradeBadge grade={lead.grade} size="sm" />
              <span className="text-[14px] font-bold tabular-nums" style={{ color: scoreColor }}>
                {lead.score}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
            {lead.propertyAddress}, {lead.city}
          </p>
          {/* Score bar */}
          <div className="mt-2 h-[3px] rounded-full overflow-hidden" style={{ background: CAVE.stoneMid }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${lead.score}%`, background: scoreColor, boxShadow: `0 0 6px ${scoreColor}55` }}
            />
          </div>
        </div>
      </div>

      {/* Property meta chips */}
      <div className="flex items-center gap-1.5 flex-wrap pl-4 pr-3.5 pt-2.5">
        <span
          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-medium"
          style={{ background: CAVE.stoneDeep, color: "#707070", border: `1px solid ${CAVE.stoneMid}` }}
        >
          <MapPin className="w-2.5 h-2.5" />
          {lead.county}, {lead.state}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium"
          style={{ background: CAVE.stoneDeep, color: "#707070", border: `1px solid ${CAVE.stoneMid}` }}
        >
          {PROPERTY_TYPE_LABELS[lead.propertyType] ?? lead.propertyType}
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-medium tabular-nums"
          style={{ background: CAVE.stoneDeep, color: "#707070", border: `1px solid ${CAVE.stoneMid}` }}
        >
          {lead.yearsOwned} yrs owned
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-md font-semibold tabular-nums"
          style={{ background: `${GEM.yellow}10`, color: GEM.yellow, border: `1px solid ${GEM.yellow}22` }}
        >
          {lead.equityPercent}% equity
        </span>
        {lead.isAbsenteeOwner && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md"
            style={{ color: GEM.green, background: `${GEM.green}12`, border: `1px solid ${GEM.green}22` }}
          >
            Absentee
          </span>
        )}
      </div>

      {/* Street View photos */}
      {lead.propertyAddress && (
        <StreetViewCarousel address={`${lead.propertyAddress}, ${lead.city}, ${lead.state}`} />
      )}

      {/* Value & Equity report */}
      {lead.estimatedValue > 0 && (
        <div className="mx-3.5 mt-2.5 rounded-xl p-2.5" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneMid}` }}>
          <p className="text-[9px] font-semibold text-neutral-600 uppercase tracking-widest mb-2">AI Grade Report</p>
          <div className="grid grid-cols-3 gap-2 mb-2.5">
            <div>
              <p className="text-[9px] text-neutral-600 mb-0.5">Est. Value</p>
              <p className="text-[12px] font-bold text-neutral-100">
                ${lead.estimatedValue >= 1000000
                  ? `${(lead.estimatedValue / 1000000).toFixed(1)}M`
                  : `${Math.round(lead.estimatedValue / 1000)}k`}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-600 mb-0.5">Equity Est.</p>
              <p className="text-[12px] font-bold" style={{ color: GEM.yellow }}>
                ${Math.round(lead.estimatedValue * lead.equityPercent / 100 / 1000)}k
              </p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-600 mb-0.5">Opportunity</p>
              <p className="text-[12px] font-bold" style={{ color: gradeConfig.color }}>{gradeConfig.label}</p>
            </div>
          </div>
          {/* Scoring factors */}
          <div className="space-y-1.5">
            {/* Ownership tenure */}
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-neutral-600 w-20 shrink-0">Ownership</p>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneMid }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(lead.yearsOwned / 30 * 100, 100)}%`, background: lead.yearsOwned >= 20 ? GEM.green : lead.yearsOwned >= 10 ? GEM.yellow : GEM.red }} />
              </div>
              <p className="text-[9px] font-semibold text-neutral-400 w-10 text-right shrink-0">{lead.yearsOwned} yrs</p>
            </div>
            {/* Equity */}
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-neutral-600 w-20 shrink-0">Equity</p>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneMid }}>
                <div className="h-full rounded-full" style={{ width: `${lead.equityPercent}%`, background: lead.equityPercent >= 70 ? GEM.green : lead.equityPercent >= 40 ? GEM.yellow : GEM.red }} />
              </div>
              <p className="text-[9px] font-semibold text-neutral-400 w-10 text-right shrink-0">{lead.equityPercent}%</p>
            </div>
            {/* Occupancy */}
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-neutral-600 w-20 shrink-0">Occupancy</p>
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneMid }}>
                <div className="h-full rounded-full" style={{ width: lead.isAbsenteeOwner ? "90%" : "40%", background: lead.isAbsenteeOwner ? GEM.green : GEM.yellow }} />
              </div>
              <p className="text-[9px] font-semibold w-10 text-right shrink-0" style={{ color: lead.isAbsenteeOwner ? GEM.green : "#a3a3a3" }}>
                {lead.isAbsenteeOwner ? "Absent" : "Owner"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Signal flags + stage (clickable) */}
      <div className="flex flex-wrap gap-1 pl-4 pr-3.5 pt-2 items-center">
        {lead.flags.slice(0, 3).map((flag) => (
          <span
            key={flag}
            className="text-[9px] px-1.5 py-0.5 rounded-md border font-medium"
            style={{ color: "#8a8a8a", borderColor: `${CAVE.stoneMid}`, background: CAVE.stoneDeep }}
          >
            {FLAG_LABELS[flag] ?? flag}
          </span>
        ))}

        {/* Stage badge — clickable dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowStageMenu((v) => !v)}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border transition-colors"
            style={{ color: stage.color, borderColor: `${stage.color}30`, background: stage.bg }}
          >
            {stage.label}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {showStageMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl border z-20 overflow-hidden"
              style={{ background: CAVE.stoneDeep, borderColor: CAVE.stoneMid, minWidth: "120px", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
            >
              {STAGE_LIST.map((s) => {
                const sg = stageGem[s];
                return (
                  <button
                    key={s}
                    onClick={() => { onStageChange(s); setShowStageMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.05]"
                    style={{ background: currentStage === s ? `${sg.color}10` : "transparent" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-sm rotate-45 flex-shrink-0" style={{ background: sg.color }} />
                    <span className="text-[11px]" style={{ color: currentStage === s ? sg.color : "#a3a3a3" }}>
                      {sg.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div
        className="flex items-center gap-1.5 pl-4 pr-3 pb-3 pt-2.5 mt-1.5 border-t"
        style={{ borderColor: CAVE.stoneMid }}
      >
        <button
          onClick={onCall}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:brightness-125"
          style={{ background: `${GEM.green}12`, border: `1px solid ${GEM.green}25`, color: GEM.green }}
          title="Call"
        >
          <Phone className="w-3 h-3" />
          Call
        </button>
        <button
          onClick={onSms}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:brightness-125"
          style={{ background: `${GEM.yellow}10`, border: `1px solid ${GEM.yellow}25`, color: GEM.yellow }}
          title="SMS"
        >
          <MessageSquare className="w-3 h-3" />
          SMS
        </button>
        <button
          onClick={onEmail}
          className="w-[30px] h-[30px] rounded-xl flex items-center justify-center transition-colors hover:bg-white/[0.06]"
          style={{ border: `1px solid ${CAVE.stoneMid}` }}
          title="Email"
        >
          <Mail className="w-3 h-3 text-neutral-500" />
        </button>
        <div className="flex-1" />
        <button
          onClick={onSendToAutomation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all hover:brightness-110"
          style={{ background: `${GEM.green}14`, border: `1px solid ${GEM.green}28`, color: GEM.green }}
        >
          <Zap className="w-3 h-3" />
          Automate
        </button>
      </div>
    </div>
  );
}

// ── Full-Screen Mining Display ─────────────────────────────────────────────────

// ── Job-firing intelligence stages ─────────────────────────────────────────
const INTEL_STAGES = ["Signal Detection", "Data Extraction", "Pattern Analysis", "Opportunity Validation", "Lead Generation"];

// Live intelligence lines streamed into the feed during an active scan.
const SCAN_ACTIVITY = [
  "Analyzing market signals",
  "Reviewing property activity",
  "Identifying homeowner patterns",
  "Detecting seller intent",
  "Cross-referencing equity & tenure",
  "Scoring opportunities",
  "Extracting lead intelligence",
];

// Maps a backend phase key to the active stage index (0–4).
function stageFromPhase(phaseKey: string): number {
  const k = (phaseKey || "").toLowerCase();
  if (k.includes("complete")) return INTEL_STAGES.length;
  if (k.includes("saving"))   return 4;
  if (k.includes("grading"))  return 2;
  if (k.includes("enrich"))   return 1;
  return 0;
}

// Detection blips, positioned within a 200×200 radar viewBox (center 100,100).
const RADAR_BLIPS = [
  { x: 148, y: 78,  delay: 0   },
  { x: 70,  y: 132, delay: 0.8 },
  { x: 132, y: 138, delay: 1.5 },
  { x: 86,  y: 64,  delay: 2.2 },
  { x: 158, y: 116, delay: 1.1 },
];

function IntelRadar({ active, size = 220 }: { active: boolean; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {/* Expanding detection waves */}
      {active && [0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ border: `1px solid ${GEM.green}`, animation: `lm-ping 2.8s ${i * 0.93}s ease-out infinite` }}
        />
      ))}

      {/* Rotating sweep, clipped to a perfect circle */}
      {active && (
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 296deg, ${GEM.green}1c 338deg, ${GEM.green}55 359deg, transparent 360deg)`,
              animation: "lm-spin 3.2s linear infinite",
            }}
          />
        </div>
      )}

      {/* Rings, crosshair & blips — single SVG origin for exact symmetry */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        {[95, 63, 32].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke={GEM.green} strokeOpacity={0.16} strokeWidth={1} />
        ))}
        <line x1="100" y1="6" x2="100" y2="194" stroke={GEM.green} strokeOpacity={0.07} strokeWidth={1} />
        <line x1="6" y1="100" x2="194" y2="100" stroke={GEM.green} strokeOpacity={0.07} strokeWidth={1} />
        <circle cx="100" cy="100" r="2.5" fill={GEM.green} />
        {active && RADAR_BLIPS.map((b, i) => (
          <circle
            key={i}
            cx={b.x} cy={b.y} r="3"
            fill={GEM.green}
            style={{ filter: `drop-shadow(0 0 4px ${GEM.green})`, transformOrigin: `${b.x}px ${b.y}px`, animation: `lm-blip 4s ${b.delay}s ease-in-out infinite` }}
          />
        ))}
      </svg>
    </div>
  );
}

function confidenceFor(grade: "elite" | "refined" | "rock") {
  if (grade === "elite")   return { color: GEM.green,  label: "High Confidence"     };
  if (grade === "refined") return { color: GEM.yellow, label: "Moderate Confidence" };
  return { color: GEM.red, label: "Emerging Opportunity" };
}

interface DiscoveryLead {
  id: string;
  title: string;
  location: string;
  score: number;
  grade: "elite" | "refined" | "rock";
}

function DiscoveryCard({ lead, index }: { lead: DiscoveryLead; index: number }) {
  const conf   = confidenceFor(lead.grade);
  const signal = Math.min(5, Math.max(1, Math.round(lead.score / 20)));
  return (
    <div
      className="rounded-2xl p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${conf.color}22`,
        animation: `lm-pop 0.5s ${0.2 + index * 0.09}s both`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-white truncate leading-tight">{lead.title}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5 truncate">{lead.location}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[26px] font-black tabular-nums leading-none" style={{ color: conf.color }}>{lead.score}</div>
          <p className="text-[8px] uppercase tracking-[0.15em] text-neutral-600 mt-0.5">Score</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: conf.color, background: `${conf.color}14` }}>
          {conf.label}
        </span>
        <div className="flex items-end gap-[2px] h-3.5" title="Signal strength">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="w-[3px] rounded-full" style={{ height: `${n * 20}%`, background: n <= signal ? conf.color : "rgba(255,255,255,0.12)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MiningFullscreen({
  status,
  phaseKey,
  zipCodes,
  progress,
  result,
  discoveredLeads,
  onDismiss,
}: {
  status: "running" | "complete";
  phaseKey: string;
  zipCodes: string[];
  progress: { recordsFound: number; recordsSaved: number; recordsEnriched: number };
  result: { elite: number; refined: number; rock: number; total: number } | null;
  discoveredLeads: DiscoveryLead[];
  onDismiss: () => void;
}) {
  const [displayCount, setDisplayCount] = useState(0);
  const [feed, setFeed] = useState<{ id: number; text: string }[]>([]);

  // Smooth count-up toward the live record count.
  useEffect(() => {
    if (progress.recordsFound <= displayCount) return;
    const diff = progress.recordsFound - displayCount;
    const step = Math.max(1, Math.floor(diff / 8));
    const t = setTimeout(() => setDisplayCount((c) => Math.min(c + step, progress.recordsFound)), 80);
    return () => clearTimeout(t);
  }, [progress.recordsFound, displayCount]);

  // Stream intelligence lines into the activity feed while scanning.
  useEffect(() => {
    if (status !== "running") return;
    let i = 0;
    const push = () => setFeed((prev) => [...prev.slice(-3), { id: i, text: SCAN_ACTIVITY[i % SCAN_ACTIVITY.length] }]);
    push();
    const t = setInterval(() => { i++; push(); }, 1100);
    return () => clearInterval(t);
  }, [status]);

  const stageIndex   = stageFromPhase(phaseKey);
  const discovered   = result?.total ?? discoveredLeads.length;
  const scanningWord = stageIndex <= 1 ? "Scanning the market" : "Mining intelligence";

  return (
    <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto relative" style={{ background: CAVE.deep }}>
      <style>{`
        @keyframes lm-spin { to { transform: rotate(360deg); } }
        @keyframes lm-ping { 0% { transform: scale(0.32); opacity: 0.5; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes lm-blip { 0%, 100% { opacity: 0; transform: scale(0.4); } 12% { opacity: 1; transform: scale(1); } 45% { opacity: 0.12; } }
        @keyframes lm-rise { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lm-pop { 0% { opacity: 0; transform: translateY(10px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes lm-dot { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
      `}</style>

      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${GEM.green}06 1px, transparent 1px), linear-gradient(90deg, ${GEM.green}06 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          maskImage: "radial-gradient(ellipse 80% 75% at 50% 40%, black 10%, transparent 100%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 px-8 py-10">

        {/* Eyebrow */}
        <div className="flex items-center gap-2">
          <Radar className="w-3.5 h-3.5" style={{ color: GEM.green }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: GEM.green }}>
            LeadMine Intelligence Engine
          </p>
          <span className="relative flex h-1.5 w-1.5">
            <span className="inline-flex h-full w-full rounded-full" style={{ background: GEM.green, animation: "lm-dot 1.4s ease-in-out infinite" }} />
          </span>
        </div>

        {status === "running" ? (
          <>
            {/* Radar */}
            <IntelRadar active size={220} />

            {/* Live count */}
            <div className="text-center -mt-1">
              <div className="text-[56px] font-black tabular-nums leading-none" style={{ color: GEM.green, textShadow: `0 0 36px ${GEM.green}45` }}>
                {displayCount.toLocaleString()}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 tracking-wide">{scanningWord} · signals detected</p>
            </div>

            {/* ZIP chips */}
            {zipCodes.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {zipCodes.map((z) => (
                  <span key={z} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: `${GEM.green}0E`, border: `1px solid ${GEM.green}22`, color: GEM.green }}>
                    <MapPin className="w-2.5 h-2.5" />{z}
                  </span>
                ))}
              </div>
            )}

            {/* Stage timeline */}
            <div className="w-full space-y-1.5">
              {INTEL_STAGES.map((label, i) => {
                const done   = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <div
                    key={label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                    style={{
                      background: active ? `${GEM.green}0c` : "transparent",
                      border: `1px solid ${active ? `${GEM.green}28` : "transparent"}`,
                    }}
                  >
                    <div
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                      style={{
                        background: done ? GEM.green : active ? `${GEM.green}20` : "transparent",
                        border: `1.5px solid ${done || active ? GEM.green : CAVE.stoneDeep}`,
                        color: "#000",
                      }}
                    >
                      {done ? "✓" : active ? <Loader2 className="w-2.5 h-2.5 animate-spin" style={{ color: GEM.green }} /> : ""}
                    </div>
                    <span className="text-[12px] font-medium flex-1" style={{ color: done ? GEM.green : active ? "#e5e5e5" : "#404040" }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Live activity feed */}
            <div className="w-full rounded-2xl p-3.5" style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${CAVE.stoneEdge}` }}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Activity className="w-3 h-3 text-neutral-600" />
                <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-600 font-semibold">Live Feed</span>
              </div>
              <div className="space-y-1.5">
                {feed.map((line) => (
                  <div key={line.id} className="flex items-center gap-2" style={{ animation: "lm-rise 0.4s ease-out both" }}>
                    <span className="w-1 h-1 rounded-full shrink-0" style={{ background: GEM.green }} />
                    <span className="text-[12px] text-neutral-400">{line.text}…</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-neutral-700 text-center">Scanning runs in the background — you can leave this tab.</p>
          </>
        ) : (
          <>
            {/* Discovery */}
            <div className="text-center pt-2">
              <div className="flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${GEM.green}18`, border: `1px solid ${GEM.green}40`, boxShadow: `0 0 40px ${GEM.green}30` }}>
                  <Sparkles className="w-6 h-6" style={{ color: GEM.green }} />
                </div>
              </div>
              <div className="text-[64px] font-black tabular-nums leading-none" style={{ color: GEM.green, textShadow: `0 0 40px ${GEM.green}55`, animation: "lm-pop 0.5s both" }}>
                {discovered.toLocaleString()}
              </div>
              <p className="text-[15px] font-semibold text-white mt-2">New Opportunities Discovered</p>
              {result && (
                <p className="text-[11px] text-neutral-500 mt-1">
                  {result.elite} high · {result.refined} moderate · {result.rock} emerging
                </p>
              )}
            </div>

            {/* Discovered cards (staggered reveal) */}
            {discoveredLeads.length > 0 && (
              <div className="w-full space-y-2.5">
                {discoveredLeads.slice(0, 6).map((lead, i) => (
                  <DiscoveryCard key={lead.id} lead={lead} index={i} />
                ))}
              </div>
            )}

            <button
              onClick={onDismiss}
              className="w-full mt-1 px-8 py-3.5 rounded-2xl text-[14px] font-bold text-black flex items-center justify-center gap-2 transition-all hover:brightness-110"
              style={{ background: GEM.green, boxShadow: `0 0 32px ${GEM.green}40` }}
            >
              View all leads <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mining Launch Screen ──────────────────────────────────────────────────────

function PropTypeIcon({ type }: { type: string }) {
  const cls = "w-4 h-4";
  if (type === "single_family") return <Home      className={cls} />;
  if (type === "condo")         return <Building2 className={cls} />;
  if (type === "multi_family")  return <Layers    className={cls} />;
  if (type === "townhouse")     return <Building2 className={cls} />;
  if (type === "land")          return <TreePine  className={cls} />;
  return <Home className={cls} />;
}

function MiningLaunchScreen({
  selectedZips,
  zipInput,
  setZipInput,
  zipError,
  setZipError,
  addZip,
  removeZip,
  zipLimit,
  selectedPropertyTypes,
  togglePropertyType,
  minEquity,
  setMinEquity,
  minYearsOwned,
  setMinYearsOwned,
  absenteeOnly,
  setAbsenteeOnly,
  minScore,
  setMinScore,
  excludeContacted,
  setExcludeContacted,
  leadType,
  buyerBudgetMin,
  buyerBudgetMax,
  buyerTimeline,
  setBuyerBudgetMin: _setBuyerBudgetMin,
  setBuyerBudgetMax,
  setBuyerTimeline,
  onMine,
}: {
  selectedZips: string[];
  zipInput: string;
  setZipInput: (v: string) => void;
  zipError: string;
  setZipError: (v: string) => void;
  addZip: (v: string) => void;
  removeZip: (v: string) => void;
  zipLimit: number;
  selectedPropertyTypes: string[];
  togglePropertyType: (t: string) => void;
  minEquity: number;
  setMinEquity: (v: number) => void;
  minYearsOwned: number;
  setMinYearsOwned: (v: number) => void;
  absenteeOnly: boolean;
  setAbsenteeOnly: (v: boolean) => void;
  minScore: number;
  setMinScore: (v: number) => void;
  excludeContacted: boolean;
  setExcludeContacted: (v: boolean) => void;
  leadType: "seller" | "buyer";
  buyerBudgetMin?: number;
  buyerBudgetMax?: number;
  buyerTimeline?: string;
  setBuyerBudgetMin?: (v: number) => void;
  setBuyerBudgetMax?: (v: number) => void;
  setBuyerTimeline?: (v: string) => void;
  onMine: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"configure" | "how">("configure");

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden py-8 px-6" style={{ background: CAVE.deep }}>
      <style>{`
        @keyframes lm-grid-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        @keyframes lm-launch-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
      `}</style>

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(${GEM.green}07 1px, transparent 1px), linear-gradient(90deg, ${GEM.green}07 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 70% 80% at 50% 50%, black 10%, transparent 100%)",
        animation: "lm-grid-pulse 4s ease-in-out infinite",
      }} />

      {/* Glow */}
      <div className="absolute pointer-events-none rounded-full" style={{
        width: 600, height: 600,
        top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        background: `radial-gradient(circle, ${GEM.green}09 0%, transparent 60%)`,
      }} />

      <div className="relative z-10 w-full max-w-lg space-y-5">

        {/* Header */}
        <div className="text-center space-y-2" style={{ animation: "lm-launch-float 6s ease-in-out infinite" }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2"
            style={{ background: `${GEM.green}12`, border: `1px solid ${GEM.green}28`, boxShadow: `0 0 24px ${GEM.green}12` }}
          >
            {leadType === "seller" ? <Radar className="w-6 h-6" style={{ color: GEM.green }} /> : <Users className="w-6 h-6" style={{ color: GEM.green }} />}
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: GEM.green }}>Ready to Scan</p>
          <h2 className="text-[24px] font-black text-white tracking-tight leading-tight">Discover hidden opportunities</h2>
          <p className="text-[12px] text-neutral-500 leading-relaxed">
            {leadType === "seller"
              ? "Enter your target ZIP codes — LeadMine scans the market for motivated sellers with high equity and long ownership."
              : "Enter your target ZIP codes — LeadMine surfaces active buyers signaling intent in your market."}
          </p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-xl mx-auto" style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${CAVE.stoneMid}`, width: "fit-content" }}>
          {([
            { key: "configure", label: "Configure Mine" },
            { key: "how",       label: "How It Works"  },
          ] as const).map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className="px-4 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all"
                style={{
                  background: active ? `${GEM.green}18` : "transparent",
                  color:      active ? GEM.green : "#737373",
                  boxShadow:  active ? `0 0 8px ${GEM.green}20` : "none",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {activeTab === "how" && (
          <div className="rounded-2xl border p-5 space-y-3" style={{ background: "rgba(13,13,20,0.9)", borderColor: `${GEM.green}20` }}>
            {[
              { step: "1", title: "Enter ZIPs", body: "Pick the zip codes you want to target. Each run pulls fresh county or signal data for those areas." },
              { step: "2", title: "AI scores & grades", body: "Every lead is scored 0–100 on equity, ownership tenure, and motivation signals. Top leads become Elite or Refined gems." },
              { step: "3", title: "Review your pipeline", body: "New leads land in your Leads panel sorted by grade. Contact, qualify, and book from there." },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5" style={{ background: `${GEM.green}18`, color: GEM.green, border: `1px solid ${GEM.green}35` }}>{step}</div>
                <div>
                  <p className="text-[12px] font-semibold text-neutral-200">{title}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "configure" && <>
        {/* ZIP input card */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: "rgba(13,13,20,0.9)", borderColor: `${GEM.green}20`, boxShadow: `0 0 32px ${GEM.green}08` }}>
          {/* ZIP chips */}
          {selectedZips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedZips.map((z) => (
                <span key={z} className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-xl border font-semibold" style={{ background: `${GEM.green}12`, borderColor: `${GEM.green}30`, color: GEM.green }}>
                  <MapPin className="w-3 h-3" />
                  {z}
                  <button onClick={() => removeZip(z)} className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* ZIP input row */}
          {selectedZips.length < zipLimit ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: selectedZips.length > 0 ? GEM.green : "#525252" }} />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder={selectedZips.length === 0 ? "Enter ZIP code — e.g. 90210" : "Add another ZIP..."}
                  value={zipInput}
                  onChange={(e) => { setZipInput(e.target.value.replace(/\D/g, "")); setZipError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") addZip(zipInput); }}
                  className="w-full pl-10 pr-3 py-3 rounded-xl text-[14px] font-medium text-neutral-100 placeholder-neutral-600 outline-none transition-all"
                  style={{
                    background: CAVE.surface2,
                    border: `1.5px solid ${zipError ? GEM.red + "60" : zipInput.length === 5 ? GEM.green + "50" : CAVE.stoneMid}`,
                    boxShadow: zipInput.length === 5 ? `0 0 12px ${GEM.green}12` : "none",
                  }}
                  autoFocus
                />
              </div>
              <button
                onClick={() => addZip(zipInput)}
                disabled={zipInput.length !== 5}
                className="px-4 py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-35"
                style={{ background: `${GEM.green}20`, border: `1.5px solid ${GEM.green}35`, color: GEM.green }}
              >
                Add
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-center text-neutral-600 py-2">Max {zipLimit} ZIP{zipLimit === 1 ? "" : "s"} on this plan</p>
          )}
          {zipError && <p className="text-[11px]" style={{ color: GEM.red }}>{zipError}</p>}

          {/* Property type tiles — Sellers */}
          {leadType === "seller" && (
            <div>
              <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2.5">Property Type</p>
              <div className="grid grid-cols-4 gap-2">
                {PROPERTY_TYPES.map((type) => {
                  const active = selectedPropertyTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => togglePropertyType(type)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-semibold transition-all"
                      style={{
                        background:  active ? `${GEM.green}12` : CAVE.surface2,
                        borderColor: active ? `${GEM.green}35` : CAVE.stoneMid,
                        color:       active ? GEM.green : "#525252",
                      }}
                    >
                      <PropTypeIcon type={type} />
                      {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Family", "Fam.")}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buyer filters */}
          {leadType === "buyer" && (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-neutral-600 uppercase tracking-widest mb-2.5">Desired Property Type</p>
                <div className="grid grid-cols-4 gap-2">
                  {PROPERTY_TYPES.map((type) => {
                    const active = selectedPropertyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => togglePropertyType(type)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-semibold transition-all"
                        style={{
                          background:  active ? `${GEM.green}12` : CAVE.surface2,
                          borderColor: active ? `${GEM.green}35` : CAVE.stoneMid,
                          color:       active ? GEM.green : "#525252",
                        }}
                      >
                        <PropTypeIcon type={type} />
                        {type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace("Family", "Fam.")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneMid}` }}>
                  <p className="text-[10px] text-neutral-600 flex items-center gap-1.5"><DollarSign className="w-3 h-3" />Budget Range</p>
                  <p className="text-[13px] font-bold text-neutral-200">
                    {buyerBudgetMin !== undefined ? `$${Math.round(buyerBudgetMin / 1000)}k` : "$200k"} – {buyerBudgetMax !== undefined ? `$${Math.round(buyerBudgetMax / 1000)}k` : "$800k"}
                  </p>
                  <input type="range" min={100000} max={2000000} step={50000}
                    value={buyerBudgetMax ?? 800000}
                    onChange={(e) => setBuyerBudgetMax?.(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: GEM.green, background: `linear-gradient(to right, ${GEM.green} ${((( buyerBudgetMax ?? 800000) - 100000) / 1900000) * 100}%, rgba(255,255,255,0.10) ${(((buyerBudgetMax ?? 800000) - 100000) / 1900000) * 100}%)` }}
                  />
                </div>
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneMid}` }}>
                  <p className="text-[10px] text-neutral-600 flex items-center gap-1.5"><Clock className="w-3 h-3" />Timeline</p>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {(["ASAP", "3 Mo", "6 Mo", "Browsing"] as const).map((t) => {
                      const val = t.toLowerCase().replace(" ", "_");
                      const active = (buyerTimeline ?? "3_mo") === val;
                      return (
                        <button key={t} onClick={() => setBuyerTimeline?.(val)}
                          className="py-1 rounded-lg text-[10px] font-semibold transition-all"
                          style={{ background: active ? `${GEM.green}18` : "transparent", color: active ? GEM.green : "#525252", border: `1px solid ${active ? GEM.green + "35" : CAVE.stoneMid}` }}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seller equity/years stepper cards */}
          {leadType === "seller" && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Min Equity */}
              <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${CAVE.stoneMid}` }}>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">Min Equity</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setMinEquity(Math.max(0, minEquity - 10))}
                    disabled={minEquity === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Minus className="w-3 h-3 text-neutral-400" />
                  </button>
                  <span className="text-[18px] font-black tabular-nums" style={{ color: minEquity > 0 ? GEM.yellow : "#3f3f46" }}>
                    {minEquity === 0 ? "Any" : `${minEquity}%`}
                  </span>
                  <button
                    onClick={() => setMinEquity(Math.min(80, minEquity + 10))}
                    disabled={minEquity === 80}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(minEquity / 80) * 100}%`, background: minEquity > 0 ? GEM.yellow : "transparent" }} />
                </div>
              </div>
              {/* Min Years */}
              <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${CAVE.stoneMid}` }}>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">Min Years</span>
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setMinYearsOwned(Math.max(0, minYearsOwned - 5))}
                    disabled={minYearsOwned === 0}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Minus className="w-3 h-3 text-neutral-400" />
                  </button>
                  <span className="text-[18px] font-black tabular-nums" style={{ color: minYearsOwned > 0 ? GEM.yellow : "#3f3f46" }}>
                    {minYearsOwned === 0 ? "Any" : `${minYearsOwned}yr`}
                  </span>
                  <button
                    onClick={() => setMinYearsOwned(Math.min(30, minYearsOwned + 5))}
                    disabled={minYearsOwned === 30}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
                <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${(minYearsOwned / 30) * 100}%`, background: minYearsOwned > 0 ? GEM.yellow : "transparent" }} />
                </div>
              </div>
            </div>
          )}

          {/* Advanced seller filters */}
          {leadType === "seller" && (
            <div className="space-y-2.5 pt-1">
              {/* Min AI score */}
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${CAVE.stoneMid}` }}>
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="text-[11px] font-semibold text-neutral-300">Min AI Score</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMinScore(Math.max(0, minScore - 10))}
                    disabled={minScore === 0}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Minus className="w-3 h-3 text-neutral-400" />
                  </button>
                  <span className="text-[13px] font-black tabular-nums w-9 text-center" style={{ color: minScore > 0 ? GEM.yellow : "#3f3f46" }}>
                    {minScore === 0 ? "Any" : minScore}
                  </span>
                  <button
                    onClick={() => setMinScore(Math.min(90, minScore + 10))}
                    disabled={minScore === 90}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                    style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                  >
                    <Plus className="w-3 h-3 text-neutral-400" />
                  </button>
                </div>
              </div>

              {/* Absentee owners only */}
              <button
                onClick={() => setAbsenteeOnly(!absenteeOnly)}
                className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
                style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${absenteeOnly ? GEM.green + "35" : CAVE.stoneMid}` }}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" style={{ color: absenteeOnly ? GEM.green : "#737373" }} />
                  <span className="text-[11px] font-semibold" style={{ color: absenteeOnly ? "#d4d4d4" : "#a3a3a3" }}>Absentee owners only</span>
                </div>
                <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all" style={{ background: absenteeOnly ? GEM.green : "rgba(255,255,255,0.1)", justifyContent: absenteeOnly ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>

              {/* Skip leads already in pipeline */}
              <button
                onClick={() => setExcludeContacted(!excludeContacted)}
                className="w-full rounded-xl p-3 flex items-center justify-between transition-all"
                style={{ background: "rgba(13,13,20,0.7)", border: `1px solid ${excludeContacted ? GEM.green + "35" : CAVE.stoneMid}` }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: excludeContacted ? GEM.green : "#737373" }} />
                  <span className="text-[11px] font-semibold" style={{ color: excludeContacted ? "#d4d4d4" : "#a3a3a3" }}>Skip leads already in pipeline</span>
                </div>
                <div className="w-9 h-5 rounded-full flex items-center px-0.5 transition-all" style={{ background: excludeContacted ? GEM.green : "rgba(255,255,255,0.1)", justifyContent: excludeContacted ? "flex-end" : "flex-start" }}>
                  <div className="w-4 h-4 rounded-full bg-white" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Mine button */}
        <button
          onClick={onMine}
          disabled={selectedZips.length === 0}
          className="w-full py-4 rounded-2xl text-[15px] font-black tracking-wide transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          style={{
            background:  selectedZips.length > 0 ? GEM.green : CAVE.surface2,
            color:       selectedZips.length > 0 ? "#000" : "#525252",
            boxShadow:   selectedZips.length > 0 ? `0 0 36px ${GEM.green}35, 0 4px 16px rgba(0,0,0,0.4)` : "none",
            border:      selectedZips.length > 0 ? "none" : `1px solid ${CAVE.stoneMid}`,
          }}
        >
          <Radar className="w-5 h-5" />
          {selectedZips.length === 0
            ? "Enter a ZIP code to start"
            : `Start Scan — ${selectedZips.length} ZIP${selectedZips.length === 1 ? "" : "s"}`}
        </button>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-8 text-center">
          {([
            { Icon: Pickaxe, label: "Auto-mines nightly" },
            { Icon: Zap,     label: "AI grades every lead" },
            { Icon: Target,  label: "Results in minutes"  },
          ] as const).map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-neutral-600" />
              <p className="text-[10px] text-neutral-700">{label}</p>
            </div>
          ))}
        </div>
        </>}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────


interface LeadMachinePanelProps {
  isActive: boolean;
  realtorSlug?: string;
  onNavigate?: (index: number) => void;
  onMiningChange?: (isRunning: boolean) => void;
  plan?: Plan;
  isUnlocked?: boolean;
}

export function LeadMachinePanel(props: LeadMachinePanelProps) {
  // Plan gate lives in this thin wrapper so the hook-heavy inner component only
  // mounts when unlocked. This keeps hook order stable and avoids a
  // rules-of-hooks crash if `plan`/`isUnlocked` resolve asynchronously after the
  // first render.
  if (!(props.isUnlocked ?? canAccess(props.plan ?? "free", "leadMachine"))) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: "#000000" }}>
        <UpgradePrompt
          feature="Lead Machine"
          requiredPlan="Miner"
          description="Upgrade to Miner to search US counties, mine graded property leads, and take action directly from each lead card."
        />
      </div>
    );
  }
  return <LeadMachinePanelInner {...props} />;
}

function LeadMachinePanelInner({ isActive, realtorSlug, onNavigate, onMiningChange, plan = "free" }: LeadMachinePanelProps) {
  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(["single_family"]);
  const [minEquity, setMinEquity]         = useState<number>(30);
  const [minYearsOwned, setMinYearsOwned] = useState<number>(5);
  const [absenteeOnly, setAbsenteeOnly]   = useState<boolean>(false);
  const [minScore, setMinScore]           = useState<number>(0);
  const [excludeContacted, setExcludeContacted] = useState<boolean>(true);

  // ── ZIP code input ────────────────────────────────────────────────────────
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [zipInput, setZipInput]         = useState("");
  const [zipError, setZipError]         = useState("");

  // ── Mining ────────────────────────────────────────────────────────────────
  const [leadType, setLeadType]         = useState<"seller" | "buyer">("seller");
  const [buyerBudgetMin, setBuyerBudgetMin] = useState(200000);
  const [buyerBudgetMax, setBuyerBudgetMax] = useState(800000);
  const [buyerTimeline, setBuyerTimeline]   = useState("3_mo");
  const [miningStatus, setMiningStatus] = useState<"idle" | "running" | "complete" | "error">("idle");

  // ── Usage tracking ────────────────────────────────────────────────────────
  const [leadsThisMonth, setLeadsThisMonth] = useState<number>(0);

  useEffect(() => {
    fetch("/api/leads/usage")
      .then((r) => r.json())
      .then((d) => setLeadsThisMonth(d.leadsThisMonth ?? 0))
      .catch(() => {});
  }, [miningStatus]);
  const [miningPhase, setMiningPhase]   = useState<string>("");
  const [miningPhaseKey, setMiningPhaseKey] = useState<string>("");
  const [miningProgress, setMiningProgress] = useState<{ recordsFound: number; recordsSaved: number; recordsEnriched: number }>({ recordsFound: 0, recordsSaved: 0, recordsEnriched: 0 });
  const [miningResult, setMiningResult] = useState<{ elite: number; refined: number; rock: number; total: number } | null>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef  = useRef<string | null>(null);
  const [notifications, setNotifications]         = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [agentStatus, setAgentStatus]             = useState<{ name: string; status: string; target: string | null }[]>([]);
  const [analyticsStats, setAnalyticsStats]       = useState<{ leadsMinedThisWeek: number; callsMade: number; smsSent: number; responses: number } | null>(null);

  // ── Real leads from Supabase ──────────────────────────────────────────────
  const [dbLeads, setDbLeads]     = useState<PropertyLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsFetched, setLeadsFetched] = useState(false);

  const fetchLeads = async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (realtorSlug) params.set("clientId", realtorSlug);
      const res = await fetch(`/api/leads/property?${params}`);
      if (res.ok) {
        const data: DbLead[] = await res.json();
        setDbLeads(data.map(dbLeadToPropertyLead));
      }
    } catch {
      // fall through to mock data
    } finally {
      setLeadsLoading(false);
      setLeadsFetched(true);
    }
  };

  useEffect(() => {
    if (!isActive) return;
    fetchLeads();

    // Fetch events as notifications
    fetch("/api/events?limit=20")
      .then((r) => r.json())
      .then((d) => {
        const events = Array.isArray(d) ? d : (d.events ?? []);
        const mapped: Notification[] = events
          .filter((e: { event_type?: string }) => e.event_type === "mining_complete")
          .map((e: { id: string; event_type: string; title?: string; description?: string; metadata?: Record<string, number>; created_at?: string }) => ({
            id:         e.id,
            type:       "mining_complete" as NotifType,
            title:      e.title ?? "Mining complete",
            body:       e.description ?? "",
            read:       false,
            created_at: e.created_at ?? new Date().toISOString(),
            metadata:   e.metadata ?? {},
          }));
        if (mapped.length > 0) setNotifications(mapped);
      })
      .catch(() => {});

    // Fetch agent/automation status
    fetch("/api/automation/status")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.agents)) setAgentStatus(d.agents);
      })
      .catch(() => {});

    // Fetch weekly analytics
    fetch("/api/analytics?days=7")
      .then((r) => r.json())
      .then((d) => {
        setAnalyticsStats({
          leadsMinedThisWeek: d.totalLeads ?? 0,
          callsMade:          d.callsMade  ?? 0,
          smsSent:            d.smsSent    ?? 0,
          responses:          d.responses  ?? 0,
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Re-fetch after mining completes
  useEffect(() => {
    if (miningStatus === "complete") fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miningStatus]);

  // Refresh when the realtor returns to the tab, so leads added by background
  // scheduled mines surface automatically without a manual reload.
  useEffect(() => {
    if (!isActive) return;
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") fetchLeads();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // ── Lead actions ──────────────────────────────────────────────────────────
  const [leadStages, setLeadStages] = useState<Record<string, string>>({});

  const ALL_LEADS: PropertyLead[] = dbLeads;
  const newLeadsCount = ALL_LEADS.filter((l: PropertyLead) => (leadStages[l.id] ?? l.stage) === "new").length;

  // ── Computed real data (derived from ALL_LEADS) ───────────────────────────
  const stageBreakdown = STAGE_LIST.map((s) => {
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    const count = ALL_LEADS.filter((l: PropertyLead) => (leadStages[l.id] ?? l.stage) === s).length;
    const pct   = ALL_LEADS.length > 0 ? Math.round((count / ALL_LEADS.length) * 100) : 0;
    return { stage: label, count, pct };
  });

  const leadSources = [
    { source: "County Assessor", count: ALL_LEADS.filter((l: PropertyLead) => l.grade === "elite" || l.grade === "refined" || l.grade === "rock").length },
  ].filter((s) => s.count > 0);

  const now = Date.now();
  const followUpQueue = ALL_LEADS
    .filter((l: PropertyLead) => {
      if (!l.last_contact_at) return false;
      const t = new Date(l.last_contact_at).getTime();
      return t >= now - 7 * 24 * 60 * 60 * 1000 && t < now - 48 * 60 * 60 * 1000;
    })
    .filter((l: PropertyLead) => l.stage !== "qualified" && l.stage !== "booked")
    .slice(0, 4)
    .map((l: PropertyLead) => {
      const hoursAgo = Math.floor((now - new Date(l.last_contact_at!).getTime()) / (1000 * 60 * 60));
      const due = hoursAgo < 24 ? "Today" : hoursAgo < 48 ? "Tomorrow" : "This week";
      const urgency = hoursAgo > 96 ? "high" : hoursAgo > 48 ? "medium" : "low";
      return { name: l.name, action: l.isAbsenteeOwner ? "Follow-up — absentee owner" : "Follow-up call", due, urgency };
    });

  const aiScoreFeed = [...ALL_LEADS]
    .sort((a: PropertyLead, b: PropertyLead) => b.score - a.score)
    .slice(0, 3)
    .map((l: PropertyLead) => {
      const signals = l.flags.map((f) => FLAG_LABELS[f] ?? f).join(", ") || "Multiple signals";
      return { name: l.name, score: l.score, delta: "", reason: signals };
    });
  const [callingLead, setCallingLead]         = useState<PropertyLead | null>(null);
  const [callDuration, setCallDuration]       = useState(0);
  const [composeLead, setComposeLead]         = useState<{ lead: PropertyLead; type: "sms" | "email" } | null>(null);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Call timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!callingLead) return;
    setCallDuration(0);
    const interval = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, [callingLead]);

  // ── Auto-clear highlight ──────────────────────────────────────────────────
  useEffect(() => {
    if (!highlightedLeadId) return;
    const t = setTimeout(() => setHighlightedLeadId(null), 3500);
    return () => clearTimeout(t);
  }, [highlightedLeadId]);

  // ── Cleanup mining poll on unmount ────────────────────────────────────────
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // ── ZIP helpers ───────────────────────────────────────────────────────────
  const { maxZipCodes } = getLimits(plan);
  const zipLimit = maxZipCodes ?? 999;

  const addZip = (raw: string) => {
    const zip = raw.trim().replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) { setZipError("Enter a valid 5-digit ZIP"); return; }
    if (selectedZips.includes(zip)) { setZipError("Already added"); return; }
    if (selectedZips.length >= zipLimit) { setZipError(`${plan} plan allows ${zipLimit} ZIP${zipLimit === 1 ? "" : "s"}`); return; }
    setSelectedZips((prev) => [...prev, zip]);
    setZipInput("");
    setZipError("");
  };

  const removeZip = (zip: string) =>
    setSelectedZips((prev) => prev.filter((z) => z !== zip));

  // ── Property type toggle ──────────────────────────────────────────────────
  const togglePropertyType = (type: string) =>
    setSelectedPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  // ── Mining ────────────────────────────────────────────────────────────────
  const PHASE_LABELS: Record<string, string> = {
    // B2B pipeline phases
    scraping:  leadType === "seller" ? "Fetching county records..." : "Scanning buyer intent signals...",
    enriching: leadType === "seller" ? "Scoring properties..."      : "Enriching & deduplicating...",
    grading:   "Grading gems...",
    saving:    "Saving leads...",
    complete:  "Complete",
    error:     "Error",
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleStopMine = async () => {
    stopPolling();
    setMiningStatus("idle");
    setMiningPhase("");
    onMiningChange?.(false);
    const jobId = jobIdRef.current;
    if (!jobId) return;
    jobIdRef.current = null;
    const endpoint = "/api/mining/stop";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    }).catch(() => {}); // best-effort cancel
  };

  const handleStartMine = async () => {
    if (selectedZips.length === 0) return;
    setMiningStatus("running");
    setMiningPhase("Starting mine...");
    setMiningPhaseKey("scraping");
    setMiningProgress({ recordsFound: 0, recordsSaved: 0, recordsEnriched: 0 });
    setMiningResult(null);
    onMiningChange?.(true);

    let jobId: string;
    try {
      if (leadType === "seller") {
        const res = await fetch("/api/mining/property-start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            zipCodes:        selectedZips,
            propertyTypes:   selectedPropertyTypes.length > 0 ? selectedPropertyTypes : ["single_family"],
            minYearsOwned:   minYearsOwned,
            minEquityPct:    minEquity,
            absenteeOnly,
            minScore,
            excludeContacted,
          }),
        });
        if (!res.ok) throw new Error(`Start failed: ${res.status}`);
        const data = await res.json();
        jobId = data.jobId;
      } else {
        // Buyers: pull live buyer-intent signals from Reddit + Craigslist.
        // This source runs synchronously (no queue job), so we await it and jump
        // straight to "complete" instead of polling a jobId.
        setMiningPhase("Scanning buyer intent signals...");
        const res = await fetch("/api/mining/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: selectedZips.join(", ") }),
        });
        if (!res.ok) throw new Error(`Start failed: ${res.status}`);
        const data  = await res.json();
        const saved = data.saved ?? 0;
        setMiningStatus("complete");
        setMiningPhase("Complete");
        setMiningPhaseKey("complete");
        setMiningResult({ elite: 0, refined: 0, rock: 0, total: saved });
        setMiningProgress({ recordsFound: data.total ?? saved, recordsSaved: saved, recordsEnriched: data.total ?? saved });
        onMiningChange?.(false);
        setNotifications((prev) => [
          {
            id:         `n${Date.now()}`,
            type:       "mining_complete" as const,
            title:      `Buyer scan complete — ${selectedZips.join(", ")}`,
            body:       `Found ${saved} active buyer signal${saved !== 1 ? "s" : ""} from Reddit & Craigslist.`,
            read:       false,
            created_at: new Date().toISOString(),
            metadata:   { lead_count: saved },
          },
          ...prev,
        ]);
        fetchLeads();
        return;
      }
    } catch (err) {
      console.error("[LeadMachine] start error", err);
      setMiningStatus("error");
      setMiningPhase("Failed to start — check worker is running");
      onMiningChange?.(false);
      return;
    }

    jobIdRef.current = jobId;

    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/mining/status?jobId=${jobId}`);
        if (!res.ok) return;
        const data = await res.json();

        const phase: string = data.progress?.phase ?? "";
        if (phase) setMiningPhaseKey(phase);
        if (phase && PHASE_LABELS[phase]) setMiningPhase(PHASE_LABELS[phase]);

        // Capture live progress counters
        if (data.progress) {
          setMiningProgress({
            recordsFound:    data.progress.recordsFound    ?? 0,
            recordsSaved:    data.progress.recordsSaved    ?? 0,
            recordsEnriched: data.progress.recordsEnriched ?? 0,
          });
        }

        if (data.state === "completed") {
          stopPolling();
          setMiningStatus("complete");
          setMiningPhase("Complete");
          setMiningPhaseKey("complete");
          onMiningChange?.(false);
          const result = data.result ?? {};
          const total   = result.totalSaved       ?? 0;
          const elite   = result.byGrade?.elite   ?? 0;
          const refined = result.byGrade?.refined ?? 0;
          const rock    = result.byGrade?.rock    ?? 0;
          setMiningResult({ elite, refined, rock, total });
          setNotifications((prev) => [
            {
              id: `n${Date.now()}`,
              type: "mining_complete" as const,
              title: `Mining complete — ${selectedZips.join(", ")}`,
              body: `Found ${total} opportunity leads. ${elite} Elite Gems, ${refined} Refined.`,
              read: false,
              created_at: new Date().toISOString(),
              metadata: { elite_count: elite, refined_count: refined, lead_count: total },
            },
            ...prev,
          ]);
        } else if (data.state === "failed") {
          stopPolling();
          setMiningStatus("error");
          setMiningPhase(data.failedReason ?? "Mine failed");
          onMiningChange?.(false);
        }
      } catch (err) {
        console.error("[LeadMachine] poll error", err);
      }
    }, 3000);
  };

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // ── Stage change ──────────────────────────────────────────────────────────
  const changeLeadStage = (leadId: string, stage: string) =>
    setLeadStages((prev) => ({ ...prev, [leadId]: stage }));

  // ── Queue item click → highlight lead ────────────────────────────────────
  const handleQueueClick = (name: string) => {
    const lead = ALL_LEADS.find((l) => l.name === name);
    if (!lead) return;
    setSelectedStage(null);
    setSearchQuery("");
    setHighlightedLeadId(lead.id);
  };

  // ── Export leads CSV ──────────────────────────────────────────────────────
  const exportLeads = () => {
    const headers = ["Name", "Address", "City", "County", "State", "Type", "Yrs Owned", "Equity %", "Score", "Grade", "Stage"];
    const wrap    = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows    = filteredLeads.map((l) =>
      [l.name, l.propertyAddress, l.city, l.county, l.state,
       PROPERTY_TYPE_LABELS[l.propertyType] ?? l.propertyType,
       l.yearsOwned, l.equityPercent, l.score, l.grade,
       leadStages[l.id] ?? l.stage].map(wrap).join(",")
    );
    const csv  = [headers.map(wrap).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `leadmine-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Filtered leads (all 5 filters applied) ────────────────────────────────
  const filteredLeads = ALL_LEADS.filter((lead) => {
    const currentStage = leadStages[lead.id] ?? lead.stage;
    if (selectedStage && currentStage !== selectedStage) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !lead.name.toLowerCase().includes(q) &&
        !lead.propertyAddress.toLowerCase().includes(q) &&
        !lead.county.toLowerCase().includes(q)
      ) return false;
    }
    if (lead.equityPercent < minEquity) return false;
    if (lead.yearsOwned < minYearsOwned) return false;
    if (selectedPropertyTypes.length > 0 && !selectedPropertyTypes.includes(lead.propertyType)) return false;
    return true;
  });

  return (
    <>
      {/* ── Call Overlay ────────────────────────────────────────────────── */}
      {callingLead && (
        <CallOverlay
          lead={callingLead}
          duration={callDuration}
          onHangUp={() => setCallingLead(null)}
          onAdvanceStage={(stage) => changeLeadStage(callingLead.id, stage)}
        />
      )}

      {/* ── SMS / Email Compose Panel ────────────────────────────────────── */}
      {composeLead && (
        <ComposePanel
          lead={composeLead.lead}
          type={composeLead.type}
          onClose={() => setComposeLead(null)}
        />
      )}

      <div
        className={cn(
          "h-full w-full flex transition-all duration-500",
          isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        )}
        style={{ background: CAVE.deep }}
      >
        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div
          className="w-64 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto"
          style={{ borderRight: `1px solid ${CAVE.stoneMid}` }}
        >
          {/* Mine New Area */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <SectionHeader gemVariant="green">Mine New Area</SectionHeader>

              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((v) => !v)}
                  className="relative p-1.5 rounded-lg transition-colors hover:bg-white/[0.06]"
                >
                  <Bell className="w-3.5 h-3.5 text-neutral-500" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[8px] font-black text-black flex items-center justify-center"
                      style={{ background: GEM.green, boxShadow: GLOW.green.soft }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div
                    className="absolute top-8 right-0 w-72 rounded-2xl border z-50 overflow-hidden"
                    style={{ background: CAVE.stoneDeep, borderColor: CAVE.stoneMid, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: CAVE.stoneMid }}>
                      <p className="text-[11px] font-semibold text-neutral-300">Notifications</p>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] text-neutral-500 hover:text-neutral-300">
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)}>
                          <X className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-neutral-600 text-center py-6">No notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b last:border-0"
                            style={{ borderColor: CAVE.stoneMid, background: n.read ? "transparent" : "rgba(0,255,136,0.04)" }}
                          >
                            <div className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: GEM.green }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-neutral-200 leading-tight">{n.title}</p>
                                <p className="text-[10px] text-neutral-500 mt-0.5">{n.body}</p>
                                <div className="flex gap-3 mt-1.5">
                                  <span className="text-[10px] font-bold" style={{ color: GEM.green }}>
                                    {(n.metadata as Record<string, number>).elite_count} Elite
                                  </span>
                                  <span className="text-[10px] font-bold" style={{ color: GEM.yellow }}>
                                    {(n.metadata as Record<string, number>).refined_count} Refined
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && canAccess(plan, "csvExport") && (
                      <div className="px-4 py-2.5 border-t" style={{ borderColor: CAVE.stoneMid }}>
                        <button
                          onClick={exportLeads}
                          className="w-full flex items-center justify-center gap-1.5 text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Export leads as CSV
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lead type toggle */}
            <div className="flex rounded-xl overflow-hidden border mb-2" style={{ borderColor: CAVE.stoneMid }}>
              {(["seller", "buyer"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setLeadType(type); setMiningStatus("idle"); setMiningPhase(""); }}
                  className="flex-1 py-1.5 text-[11px] font-semibold transition-all"
                  style={{
                    background: leadType === type ? `${GEM.green}18` : CAVE.surface2,
                    color:      leadType === type ? GEM.green : "#555",
                    borderRight: type === "seller" ? `1px solid ${CAVE.stoneMid}` : undefined,
                  }}
                >
                  {type === "seller" ? "Sellers" : "Buyers"}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {/* Usage bar */}
              {(() => {
                const { maxLeadsPerMonth } = getLimits(plan);
                const cap = maxLeadsPerMonth ?? 0;
                const pct = cap > 0 ? Math.min((leadsThisMonth / cap) * 100, 100) : 0;
                const nearLimit = cap > 0 && leadsThisMonth >= cap * 0.8;
                return cap > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-neutral-600">Leads this month</span>
                      <span className="text-[10px] font-semibold tabular-nums" style={{ color: nearLimit ? GEM.red : "#525252" }}>
                        {leadsThisMonth} / {cap}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneMid }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: nearLimit ? GEM.red : GEM.green }}
                      />
                    </div>
                  </div>
                ) : null;
              })()}

              {/* ZIP chip row */}
              {selectedZips.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedZips.map((z) => (
                    <span
                      key={z}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border font-medium"
                      style={{ background: `${GEM.green}12`, borderColor: `${GEM.green}28`, color: GEM.green }}
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {z}
                      <button onClick={() => removeZip(z)} className="ml-0.5 opacity-70 hover:opacity-100">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* ZIP input */}
              {selectedZips.length < zipLimit ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-600 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder={selectedZips.length === 0 ? "Enter ZIP code (e.g. 90210)" : "Add another ZIP..."}
                      value={zipInput}
                      onChange={(e) => { setZipInput(e.target.value.replace(/\D/g, "")); setZipError(""); }}
                      onKeyDown={(e) => { if (e.key === "Enter") addZip(zipInput); }}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] text-neutral-300 placeholder-neutral-600 outline-none transition-colors"
                      style={{
                        background: CAVE.surface2,
                        border: `1px solid ${zipError ? GEM.red + "50" : CAVE.stoneMid}`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => addZip(zipInput)}
                    disabled={zipInput.length !== 5}
                    className="px-3 py-2 rounded-xl text-[11px] font-semibold transition-all disabled:opacity-40"
                    style={{ background: `${GEM.green}18`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <p
                  className="text-[10px] text-neutral-600 text-center py-1.5 px-2 rounded-xl"
                  style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }}
                >
                  Max {zipLimit} ZIP{zipLimit === 1 ? "" : "s"} on {plan} plan — remove one to add more
                </p>
              )}
              {zipError && <p className="text-[10px]" style={{ color: GEM.red }}>{zipError}</p>}

              {/* Property type chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {PROPERTY_TYPES.map((type) => {
                  const active = selectedPropertyTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => togglePropertyType(type)}
                      className="text-[10px] px-2 py-1 rounded-lg border font-medium transition-all capitalize"
                      style={{
                        background:  active ? `${GEM.green}15` : CAVE.surface2,
                        borderColor: active ? `${GEM.green}35` : CAVE.stoneMid,
                        color:       active ? GEM.green : "#525252",
                      }}
                    >
                      {type.replace(/_/g, " ")}
                    </button>
                  );
                })}
              </div>

              {/* Stepper cards */}
              <div className="grid grid-cols-2 gap-2">
                {/* Min Equity stepper */}
                <div
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneMid}` }}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">Min Equity</span>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => setMinEquity(Math.max(0, minEquity - 10))}
                      disabled={minEquity === 0}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <Minus className="w-3 h-3 text-neutral-400" />
                    </button>
                    <div className="flex-1 text-center">
                      <span
                        className="text-[18px] font-black tabular-nums leading-none"
                        style={{ color: minEquity > 0 ? GEM.yellow : "#3f3f46" }}
                      >
                        {minEquity === 0 ? "Any" : `${minEquity}%`}
                      </span>
                    </div>
                    <button
                      onClick={() => setMinEquity(Math.min(80, minEquity + 10))}
                      disabled={minEquity === 80}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <Plus className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                  {/* Track */}
                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(minEquity / 80) * 100}%`, background: minEquity > 0 ? GEM.yellow : "transparent" }} />
                  </div>
                </div>

                {/* Min Years stepper */}
                <div
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneMid}` }}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-600">Min Years</span>
                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => setMinYearsOwned(Math.max(0, minYearsOwned - 5))}
                      disabled={minYearsOwned === 0}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <Minus className="w-3 h-3 text-neutral-400" />
                    </button>
                    <div className="flex-1 text-center">
                      <span
                        className="text-[18px] font-black tabular-nums leading-none"
                        style={{ color: minYearsOwned > 0 ? GEM.yellow : "#3f3f46" }}
                      >
                        {minYearsOwned === 0 ? "Any" : `${minYearsOwned}yr`}
                      </span>
                    </div>
                    <button
                      onClick={() => setMinYearsOwned(Math.min(30, minYearsOwned + 5))}
                      disabled={minYearsOwned === 30}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-25"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneMid}` }}
                    >
                      <Plus className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                  {/* Track */}
                  <div className="h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${(minYearsOwned / 30) * 100}%`, background: minYearsOwned > 0 ? GEM.yellow : "transparent" }} />
                  </div>
                </div>
              </div>

              {/* Active filter indicator */}
              {(minEquity > 0 || minYearsOwned > 0 || selectedPropertyTypes.length < PROPERTY_TYPES.length) && (
                <div
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-[10px]"
                  style={{ background: `${GEM.yellow}08`, border: `1px solid ${GEM.yellow}15`, color: GEM.yellow }}
                >
                  <span>Filters active — {filteredLeads.length} leads shown</span>
                  <button
                    onClick={() => { setMinEquity(0); setMinYearsOwned(0); setSelectedPropertyTypes(PROPERTY_TYPES); }}
                    className="underline opacity-70 hover:opacity-100"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Mine button */}
              {miningStatus === "running" ? (
                <div className="space-y-2">
                  <div
                    className="rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-[12px] font-semibold"
                    style={{ background: `${GEM.green}0E`, border: `1px solid ${GEM.green}25`, color: GEM.green }}
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span className="truncate">{miningPhase || "Mining..."}</span>
                  </div>
                  <button
                    onClick={handleStopMine}
                    className="w-full rounded-xl py-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
                  >
                    <X className="w-3 h-3" />
                    Stop Mine
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartMine}
                  disabled={selectedZips.length === 0}
                  className="w-full rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: selectedZips.length > 0 ? GEM.green : CAVE.surface2,
                    color:      selectedZips.length > 0 ? "#000" : "#525252",
                    boxShadow:  selectedZips.length > 0 ? `0 0 20px rgba(0,255,136,0.28)` : "none",
                  }}
                >
                  <Radar className="w-3.5 h-3.5" />
                  {selectedZips.length === 0
                    ? "Enter a ZIP to scan"
                    : `Start Scan — ${selectedZips.length} ZIP${selectedZips.length === 1 ? "" : "s"}`}
                </button>
              )}

              {miningStatus === "complete" && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: `${GEM.green}08`, border: `1px solid ${GEM.green}20` }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: GEM.green }} />
                  <p className="text-[10px] text-neutral-400">Done — check notifications</p>
                </div>
              )}

              {/* Auto-mining status */}
              {selectedZips.length > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.14)" }}
                >
                  <Clock className="w-3 h-3 shrink-0" style={{ color: "#60a5fa" }} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold" style={{ color: "#60a5fa" }}>Auto-mining every 6h</p>
                    <p className="text-[9px] text-neutral-600 leading-tight mt-0.5">Territory saved — scheduler will re-mine automatically</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pipeline Stages */}
          <div>
            <SectionHeader gemVariant="yellow">Pipeline Stages</SectionHeader>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedStage(null)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-colors",
                  !selectedStage ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                )}
                style={
                  !selectedStage
                    ? { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }
                    : { background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }
                }
              >
                <span>All Leads</span>
                <span className="text-[11px] font-semibold tabular-nums text-neutral-400">
                  {ALL_LEADS.length}
                </span>
              </button>

              {stageBreakdown.map((s) => {
                const color    = stageBarColor[s.stage];
                const isActive = selectedStage === s.stage.toLowerCase();
                return (
                  <button
                    key={s.stage}
                    onClick={() => setSelectedStage(isActive ? null : s.stage.toLowerCase())}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-all",
                      isActive ? "text-white" : "text-neutral-500 hover:text-neutral-300"
                    )}
                    style={
                      isActive
                        ? { background: `${color}18`, border: `1px solid ${color}35` }
                        : { background: CAVE.surface2, border: `1px solid ${CAVE.stoneMid}` }
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm rotate-45 flex-shrink-0" style={{ background: color }} />
                      <span>{s.stage}</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-neutral-400">{s.count}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex rounded-lg overflow-hidden h-1.5 gap-0.5 mt-3">
              {stageBreakdown.map((s) => (
                <div
                  key={s.stage}
                  className="rounded-sm"
                  style={{ width: `${s.pct}%`, background: stageBarColor[s.stage] }}
                />
              ))}
            </div>
          </div>

          {/* Lead Sources */}
          <div>
            <SectionHeader>Lead Sources</SectionHeader>
            <div className="space-y-2">
              {leadSources.map((src) => (
                <MiningPanel key={src.source} padding="sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-neutral-400">{src.source}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(src.count / 34) * 100}%`, background: GEM.green, opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-neutral-400 tabular-nums w-4 text-right">
                        {src.count}
                      </span>
                    </div>
                  </div>
                </MiningPanel>
              ))}
            </div>
          </div>

          {/* Follow-up Queue — clickable */}
          <div>
            <SectionHeader gemVariant="red">Follow-up Queue</SectionHeader>
            <div className="space-y-1.5">
              {followUpQueue.map((item) => {
                const urgencyGem =
                  item.urgency === "high" ? "red" : item.urgency === "medium" ? "yellow" : null;
                return (
                  <MiningPanel
                    key={item.name}
                    padding="sm"
                    status={urgencyGem ?? undefined}
                    carved={item.urgency === "high"}
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => handleQueueClick(item.name)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-medium text-neutral-300 hover:text-white transition-colors">
                            {item.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">{item.action}</p>
                        </div>
                        <span
                          className="text-[10px] font-semibold shrink-0 mt-0.5"
                          style={{
                            color:
                              item.urgency === "high"   ? GEM.red :
                              item.urgency === "medium" ? GEM.yellow : "#525252",
                          }}
                        >
                          {item.due}
                        </span>
                      </div>
                    </button>
                  </MiningPanel>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FULL-SCREEN MINING DISPLAY ────────────────────────────────── */}
        {(miningStatus === "running" || miningStatus === "complete") && (
          <MiningFullscreen
            status={miningStatus}
            phaseKey={miningPhaseKey}
            zipCodes={selectedZips}
            progress={miningProgress}
            result={miningResult}
            discoveredLeads={[...ALL_LEADS]
              .sort((a, b) => b.score - a.score)
              .slice(0, 6)
              .map((l) => ({
                id:       l.id,
                title:    l.propertyAddress || l.name || "Property",
                location: [l.city, l.state].filter(Boolean).join(", ") || "Location pending",
                score:    l.score,
                grade:    l.grade,
              }))}
            onDismiss={() => { setMiningStatus("idle"); setMiningPhase(""); setMiningPhaseKey(""); setMiningProgress({ recordsFound: 0, recordsSaved: 0, recordsEnriched: 0 }); setMiningResult(null); }}
          />
        )}

        {/* ── INITIAL LOADING — before first fetch completes ───────────── */}
        {!leadsFetched && miningStatus === "idle" && (
          <div className="flex-1 flex items-center justify-center" style={{ background: CAVE.deep }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-neutral-700 border-t-[#00FF88] animate-spin" />
              <p className="text-[11px] text-neutral-600">Loading your leads…</p>
            </div>
          </div>
        )}

        {/* ── LAUNCH SCREEN — shown when no leads after fetch + idle ───── */}
        {leadsFetched && ALL_LEADS.length === 0 && miningStatus === "idle" && (
          <MiningLaunchScreen
            selectedZips={selectedZips}
            zipInput={zipInput}
            setZipInput={setZipInput}
            zipError={zipError}
            setZipError={setZipError}
            addZip={addZip}
            removeZip={removeZip}
            zipLimit={zipLimit}
            selectedPropertyTypes={selectedPropertyTypes}
            togglePropertyType={togglePropertyType}
            minEquity={minEquity}
            setMinEquity={setMinEquity}
            minYearsOwned={minYearsOwned}
            setMinYearsOwned={setMinYearsOwned}
            absenteeOnly={absenteeOnly}
            setAbsenteeOnly={setAbsenteeOnly}
            minScore={minScore}
            setMinScore={setMinScore}
            excludeContacted={excludeContacted}
            setExcludeContacted={setExcludeContacted}
            leadType={leadType}
            buyerBudgetMin={buyerBudgetMin}
            buyerBudgetMax={buyerBudgetMax}
            buyerTimeline={buyerTimeline}
            setBuyerBudgetMin={setBuyerBudgetMin}
            setBuyerBudgetMax={setBuyerBudgetMax}
            setBuyerTimeline={setBuyerTimeline}
            onMine={handleStartMine}
          />
        )}

        {/* ── CENTER COLUMN — shown when leads exist ────────────────────── */}
        <div className={cn("flex-1 flex flex-col gap-4 p-5 overflow-y-auto min-w-0", (miningStatus === "running" || miningStatus === "complete" || !leadsFetched || (ALL_LEADS.length === 0 && miningStatus === "idle")) && "hidden")}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gem variant="green" size="xs" animated />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-neutral-100 tracking-tight">Lead Machine</h2>
                  {newLeadsCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                      style={{ background: `${GEM.green}20`, color: GEM.green, border: `1px solid ${GEM.green}30` }}
                    >
                      {newLeadsCount} new
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  AI-powered property intelligence &amp; opportunity mining
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canAccess(plan, "csvExport") && (
                <button
                  onClick={exportLeads}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 transition-colors"
                  style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
                  title="Export filtered leads as CSV"
                >
                  <Download className="w-3 h-3" />
                  Export
                </button>
              )}
              <a
                href="/dashboard/pipeline"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-neutral-400 hover:text-neutral-200 transition-colors"
                style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
              >
                Full Pipeline <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
            style={{ background: CAVE.surface2, border: `1px solid ${CAVE.stoneEdge}` }}
          >
            <Search className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, address, or county..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[12px] text-neutral-300 placeholder-neutral-600 outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[10px] text-neutral-600 hover:text-neutral-400">
                Clear
              </button>
            )}
          </div>

          {/* Grading Legend */}
          <GradeLegend />

          {/* Grade summary — clickable filters */}
          <div className="flex items-center gap-2">
            {(["elite", "refined", "rock"] as const).map((grade) => {
              const count  = ALL_LEADS.filter((l) => l.grade === grade).length;
              const config = GRADE_CONFIG[grade];
              return (
                <div
                  key={grade}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                  style={{ background: `${config.color}0A`, border: `1px solid ${config.color}20` }}
                >
                  <span className="w-1.5 h-1.5 rounded-sm rotate-45 flex-shrink-0" style={{ background: config.color }} />
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color: config.color }}>{count}</span>
                  <span className="text-[11px] text-neutral-600">{config.label}</span>
                </div>
              );
            })}
            <span className="text-[10px] text-neutral-700 ml-auto tabular-nums">
              {filteredLeads.length} shown{leadsLoading && " · loading..."}
            </span>
          </div>

          {/* Lead Cards */}
          <div className="space-y-3 pb-2">
            {filteredLeads.map((lead) => (
              <PropertyLeadCard
                key={lead.id}
                lead={lead}
                currentStage={leadStages[lead.id] ?? lead.stage}
                isHighlighted={highlightedLeadId === lead.id}
                onCall={() => { setComposeLead(null); setCallingLead(lead); }}
                onSms={() => { setCallingLead(null); setComposeLead({ lead, type: "sms" }); }}
                onEmail={() => { setCallingLead(null); setComposeLead({ lead, type: "email" }); }}
                onStageChange={(stage) => changeLeadStage(lead.id, stage)}
                onSendToAutomation={async () => {
                  // Enroll lead in follow-up sequence, then navigate to Automations tab
                  try {
                    await fetch("/api/followup/enroll", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        leadId:     lead.id,
                        realtorId:  realtorSlug,
                        sequenceId: "default-seller",
                      }),
                    });
                  } catch {
                    // non-fatal — navigate anyway
                  }
                  changeLeadStage(lead.id, "contacted");
                  onNavigate?.(3);
                }}
              />
            ))}

            {filteredLeads.length === 0 && ALL_LEADS.length > 0 && (
              <div className="py-16 text-center space-y-2">
                <p className="text-[12px] text-neutral-600">No leads match your current filters</p>
                <button
                  onClick={() => { setSelectedStage(null); setSearchQuery(""); setMinEquity(0); setMinYearsOwned(0); setSelectedPropertyTypes(PROPERTY_TYPES); }}
                  className="text-[11px] underline transition-colors"
                  style={{ color: GEM.green }}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────── */}
        <div
          className={cn("w-72 flex-shrink-0 flex flex-col gap-5 p-5 overflow-y-auto", (miningStatus === "running" || miningStatus === "complete") && "hidden")}
          style={{ borderLeft: `1px solid ${CAVE.stoneMid}` }}
        >
          {/* AI Scoring Engine */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-3.5 h-3.5" style={{ color: GEM.green }} />
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                AI Scoring Engine
              </p>
            </div>
            <div className="space-y-2">
              {aiScoreFeed.map((item) => {
                const gemKey = scoreToGem(item.score);
                return (
                  <GlowBorder key={item.name} variant={gemKey} intensity="soft">
                    <MiningPanel padding="sm" carved>
                      <div className="flex items-center justify-between mb-1 px-0.5">
                        <p className="text-[12px] font-medium text-neutral-200">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-[13px] font-semibold tabular-nums" style={{ color: GEM[gemKey] }}>
                            {item.score}
                          </span>
                          <span className="text-[10px]" style={{ color: `${GEM[gemKey]}99` }}>
                            {item.delta}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 px-0.5">{item.reason}</p>
                    </MiningPanel>
                  </GlowBorder>
                );
              })}
            </div>
          </div>

          {/* AI Miner Status */}
          <div>
            <SectionHeader gemVariant="green">AI Miner Status</SectionHeader>
            <div className="space-y-1.5">
              {agentStatus.length > 0 ? agentStatus.map((agent) => {
                const gemKey = agent.status === "calling" || agent.status === "active" ? "green" : "yellow";
                return (
                  <MiningPanel key={agent.name} padding="sm" status={gemKey}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[12px] font-medium text-neutral-300">{agent.name}</p>
                        {agent.target && (
                          <p className="text-[10px] text-neutral-600 mt-0.5">{agent.target}</p>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-lg capitalize"
                        style={{ color: GEM[gemKey as "green" | "yellow"], background: GLOW[gemKey as "green" | "yellow"].bg }}
                      >
                        {agent.status}
                      </span>
                    </div>
                  </MiningPanel>
                );
              }) : (
                <p className="text-[11px] text-neutral-600 px-1">No active agents</p>
              )}
            </div>
          </div>

          {/* Next Best Actions — from real top leads */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-3.5 h-3.5" style={{ color: GEM.yellow }} />
              <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                Next Best Actions
              </p>
            </div>
            <MiningPanel carved>
              <div className="space-y-2">
                {ALL_LEADS.length === 0 ? (
                  <p className="text-[11px] text-neutral-600">Mine leads to see recommended actions</p>
                ) : (
                  [...ALL_LEADS]
                    .filter((l: PropertyLead) => !l.last_contact_at || new Date(l.last_contact_at).getTime() < now - 48 * 60 * 60 * 1000)
                    .sort((a: PropertyLead, b: PropertyLead) => b.score - a.score)
                    .slice(0, 3)
                    .map((lead: PropertyLead) => {
                      const Icon = lead.isAbsenteeOwner ? Phone : MessageSquare;
                      const action = lead.isAbsenteeOwner ? "call" : "sms";
                      const signals = lead.flags.map((f) => FLAG_LABELS[f] ?? f).slice(0, 2).join(", ");
                      return (
                        <button
                          key={lead.id}
                          onClick={() => action === "call" ? setCallingLead(lead) : setComposeLead({ lead, type: "sms" })}
                          className="w-full flex items-start gap-2.5 text-left rounded-xl p-2 -mx-2 transition-colors hover:bg-white/[0.04] cursor-pointer"
                        >
                          <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: lead.grade === "elite" ? GEM.green : GEM.yellow }} />
                          <p className="text-[11px] text-neutral-400 leading-relaxed">
                            {action === "call" ? "Call" : "SMS"} {lead.name} — {lead.score}pt, {signals}
                          </p>
                          <ChevronRight className="w-3 h-3 text-neutral-700 mt-0.5 flex-shrink-0" />
                        </button>
                      );
                    })
                )}
              </div>
            </MiningPanel>
          </div>

          {/* Engagement This Week */}
          <div>
            <SectionHeader gemVariant="yellow">Engagement This Week</SectionHeader>
            <MiningPanel carved>
              <div className="space-y-3">
                {[
                  { label: "Leads Mined", value: analyticsStats?.leadsMinedThisWeek ?? ALL_LEADS.length, max: Math.max(analyticsStats?.leadsMinedThisWeek ?? ALL_LEADS.length, 1) },
                  { label: "Calls Made",  value: analyticsStats?.callsMade ?? 0,  max: Math.max(analyticsStats?.callsMade ?? 1, 1)  },
                  { label: "SMS Sent",    value: analyticsStats?.smsSent ?? 0,    max: Math.max(analyticsStats?.smsSent ?? 1, 1)    },
                  { label: "Responses",   value: analyticsStats?.responses ?? 0,  max: Math.max(analyticsStats?.smsSent ?? 1, 1)   },
                ].map((item) => {
                  const pct      = Math.min(Math.round((item.value / item.max) * 100), 100);
                  const barColor = PERF_COLOR(pct);
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] text-neutral-400">{item.label}</span>
                        <span className="text-[11px] font-medium text-neutral-300 tabular-nums">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 6px ${barColor}55` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </MiningPanel>
          </div>

          {/* Conversion Funnel */}
          <div>
            <SectionHeader>Conversion Funnel</SectionHeader>
            <MiningPanel carved>
              <div className="space-y-2">
                {(() => {
                  const counts = Object.fromEntries(
                    STAGE_LIST.map((s) => [s, ALL_LEADS.filter((l: PropertyLead) => (leadStages[l.id] ?? l.stage) === s).length])
                  );
                  const total      = ALL_LEADS.length || 1;
                  const contacted  = counts.contacted  + counts.qualified + counts.booked;
                  const qualified  = counts.qualified  + counts.booked;
                  const booked     = counts.booked;
                  const steps = [
                    { from: "Mined",     to: "Contacted", rate: total      > 0 ? Math.round((contacted / total)     * 100) : 0 },
                    { from: "Contacted", to: "Qualified",  rate: contacted  > 0 ? Math.round((qualified / contacted) * 100) : 0 },
                    { from: "Qualified", to: "Booked",     rate: qualified  > 0 ? Math.round((booked    / qualified) * 100) : 0 },
                  ];
                  return steps.map((step) => {
                    const rateColor = step.rate >= 60 ? GEM.green : step.rate >= 30 ? GEM.yellow : GEM.red;
                    return (
                      <div key={step.from} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-500">{step.from}</span>
                          <ChevronRight className="w-2.5 h-2.5 text-neutral-700" />
                          <span className="text-[11px] text-neutral-400">{step.to}</span>
                        </div>
                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: rateColor }}>
                          {ALL_LEADS.length === 0 ? "—" : `${step.rate}%`}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </MiningPanel>
          </div>
        </div>
      </div>
    </>
  );
}
