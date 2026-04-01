"use client";

import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { Mail, Phone, MapPin, DollarSign, MessageSquare, Gem } from "lucide-react";
import type { PropertyLead, HeatTier } from "@/types";

// ── Tier config ────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<HeatTier, { color: string; glow: (typeof GLOW)[keyof typeof GLOW]; label: string }> = {
  diamond: { color: GEM.diamond, glow: GLOW.diamond, label: "Diamond Lead" },
  hot:     { color: GEM.green,   glow: GLOW.green,   label: "Hot Lead" },
  warm:    { color: GEM.yellow,  glow: GLOW.yellow,  label: "Warm Lead" },
  cold:    { color: GEM.red,     glow: GLOW.red,     label: "Cold Lead" },
};

// ── Gem icon ───────────────────────────────────────────────────────────────────

function TierGem({ tier, size = 16 }: { tier: HeatTier; size?: number }) {
  const config = TIER_CONFIG[tier];
  return (
    <Gem
      style={{ color: config.color, filter: `drop-shadow(${config.glow.soft})` }}
      size={size}
    />
  );
}

// ── Signal pill ────────────────────────────────────────────────────────────────

function SignalPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}33`,
        color,
      }}
    >
      {label}
    </span>
  );
}

// ── Format helpers ────────────────────────────────────────────────────────────

function formatCurrency(n: number | null | undefined): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

function formatSignalLabel(flag: string): string {
  return flag
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface HeatLeadCardProps {
  lead: PropertyLead;
  onDraftMessage?: (lead: PropertyLead) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HeatLeadCard({ lead, onDraftMessage }: HeatLeadCardProps) {
  const tier   = (lead.heat_tier ?? "cold") as HeatTier;
  const score  = lead.heat_score ?? 0;
  const config = TIER_CONFIG[tier];

  const location = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "—";
  const value    = lead.estimated_value ?? lead.assessed_value;
  const name     = lead.owner_name || lead.business_name || "Unknown Owner";
  const signals  = (lead.signal_flags ?? []).slice(0, 4);

  // Heat breakdown bar total
  const breakdown = lead.heat_breakdown;

  return (
    <div
      className="rounded-xl p-4 transition-all hover:scale-[1.002]"
      style={{
        background: CAVE.surface1,
        border: `1px solid ${config.glow.border}`,
        boxShadow: config.glow.soft,
      }}
    >
      <div className="flex items-start gap-4">
        {/* Score circle */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center"
          style={{
            background: `${config.color}12`,
            border: `1px solid ${config.glow.border}`,
            boxShadow: config.glow.soft,
          }}
        >
          <span
            className="text-2xl font-black leading-none"
            style={{ color: config.color }}
          >
            {score}
          </span>
          <span className="text-[8px] text-neutral-500 uppercase tracking-wider mt-0.5">
            heat
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            {/* Tier badge + lead type */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <TierGem tier={tier} size={14} />
                <span
                  className="text-xs font-bold"
                  style={{ color: config.color }}
                >
                  {config.label}
                </span>
              </div>
              {lead.opportunity_type && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-md font-medium capitalize"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${CAVE.stoneEdge}`,
                    color: "#a3a3a3",
                  }}
                >
                  {lead.opportunity_type}
                </span>
              )}
            </div>

            {/* Draft button */}
            <button
              type="button"
              onClick={() => onDraftMessage?.(lead)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: `${GEM.green}14`,
                border: `1px solid ${GLOW.green.border}`,
                color: GEM.green,
              }}
            >
              <MessageSquare className="w-3 h-3" />
              Draft Message
            </button>
          </div>

          {/* Name + location */}
          <div className="mt-2 space-y-0.5">
            <p className="text-sm font-semibold text-neutral-200 truncate">{name}</p>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {location}
              {lead.property_zip && <span className="text-neutral-600">· {lead.property_zip}</span>}
            </div>
          </div>

          {/* Property value + contact */}
          <div className="flex items-center gap-4 mt-2.5">
            {value && (
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                <DollarSign className="w-3 h-3" style={{ color: GEM.yellow }} />
                {formatCurrency(value)}
              </div>
            )}
            {lead.email && lead.email !== "unknown@unknown.com" && (
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Mail className="w-3 h-3" />
                <span className="truncate max-w-[140px]">{lead.email}</span>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-neutral-500">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </div>
            )}
          </div>

          {/* Signal pills */}
          {signals.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {signals.map((flag) => (
                <SignalPill
                  key={flag}
                  label={formatSignalLabel(flag)}
                  color={config.color}
                />
              ))}
            </div>
          )}

          {/* Heat reasoning */}
          {lead.heat_reasoning && (
            <p className="text-[11px] text-neutral-500 mt-2.5 leading-relaxed line-clamp-2">
              {lead.heat_reasoning}
            </p>
          )}

          {/* Breakdown mini-bars */}
          {breakdown && (
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {[
                { label: "Location",  value: breakdown.location_match,  max: 20 },
                { label: "Intent",    value: breakdown.property_intent,  max: 25 },
                { label: "Activity",  value: breakdown.recent_activity,  max: 20 },
                { label: "Contact",   value: breakdown.contact_completeness, max: 10 },
              ].map(({ label, value: v, max }) => (
                <div key={label}>
                  <p className="text-[9px] text-neutral-600 mb-0.5 uppercase tracking-wider">{label}</p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: CAVE.stoneEdge }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((v / max) * 100)}%`,
                        background: config.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
