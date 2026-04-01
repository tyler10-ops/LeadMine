"use client";

import { useEffect, useState, useCallback } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { MiningPanel } from "@/components/ui/mining-panel";
import { HeatLeadCard } from "@/components/leads/heat-lead-card";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Loader2,
  Flame,
  Gem,
  Zap,
  Snowflake,
  RefreshCw,
} from "lucide-react";
import type { PropertyLead, HeatTier } from "@/types";
import { OutreachModal } from "@/components/outreach/outreach-modal";

// ── Tier filter config ────────────────────────────────────────────────────────

const TIER_FILTERS: {
  value: HeatTier | "all";
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  { value: "all",     label: "All",     color: "#a3a3a3",  icon: null },
  { value: "diamond", label: "Diamond", color: GEM.diamond, icon: <Gem className="w-3 h-3" /> },
  { value: "hot",     label: "Hot",     color: GEM.green,  icon: <Flame className="w-3 h-3" /> },
  { value: "warm",    label: "Warm",    color: GEM.yellow, icon: <Zap className="w-3 h-3" /> },
  { value: "cold",    label: "Cold",    color: GEM.red,    icon: <Snowflake className="w-3 h-3" /> },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,       setLeads]       = useState<PropertyLead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [tierFilter,  setTierFilter]  = useState<HeatTier | "all">("all");
  const [typeFilter,  setTypeFilter]  = useState<string>("all");
  const [scoring,     setScoring]     = useState(false);
  const [realtorId,   setRealtorId]   = useState<string | null>(null);

  // Outreach modal
  const [outreachLead, setOutreachLead] = useState<PropertyLead | null>(null);

  const fetchLeads = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Try realtor-based fetch first (heat-scored leads via search_areas)
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (realtor) {
      setRealtorId(realtor.id);

      // Get all search_area IDs for this realtor
      const { data: areas } = await supabase
        .from("search_areas")
        .select("id")
        .eq("realtor_id", realtor.id);

      const areaIds = (areas ?? []).map((a: { id: string }) => a.id);

      if (areaIds.length > 0) {
        const { data } = await supabase
          .from("leads")
          .select("*")
          .in("search_area_id", areaIds)
          .order("heat_score", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(200);

        if (data && data.length > 0) {
          setLeads(data as PropertyLead[]);
          setLoading(false);
          return;
        }
      }
    }

    // Fallback: fetch by realtor id (mined leads use realtor.id as client_id)
    const realtorId2 = realtor?.id ?? null;
    if (!realtorId2) { setLoading(false); return; }

    const { data } = await supabase
      .from("leads")
      .select("*")
      .eq("client_id", realtorId2)
      .order("heat_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);

    setLeads((data as PropertyLead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Score all unscored leads
  const handleScoreAll = async () => {
    const unscored = leads.filter((l) => !l.heat_scored_at).map((l) => l.id);
    if (unscored.length === 0) return;

    setScoring(true);
    try {
      await fetch("/api/leads/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: unscored.slice(0, 20) }), // batch cap
      });
      await fetchLeads();
    } catch {
      // Silently fail — re-try available
    } finally {
      setScoring(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const tierStats = {
    diamond: leads.filter((l) => l.heat_tier === "diamond").length,
    hot:     leads.filter((l) => l.heat_tier === "hot").length,
    warm:    leads.filter((l) => l.heat_tier === "warm").length,
    cold:    leads.filter((l) => l.heat_tier === "cold").length,
  };

  const filtered = leads.filter((lead) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      lead.owner_name?.toLowerCase().includes(searchLower) ||
      lead.business_name?.toLowerCase().includes(searchLower) ||
      lead.email?.toLowerCase().includes(searchLower) ||
      lead.property_city?.toLowerCase().includes(searchLower) ||
      lead.property_zip?.includes(search);

    const matchesTier =
      tierFilter === "all" || lead.heat_tier === tierFilter;

    const matchesType =
      typeFilter === "all" || lead.opportunity_type === typeFilter;

    return matchesSearch && matchesTier && matchesType;
  });

  const unscoredCount = leads.filter((l) => !l.heat_scored_at).length;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-neutral-200">
              Lead Intelligence
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              {leads.length} leads ranked by heat score
            </p>
          </div>

          {unscoredCount > 0 && (
            <button
              onClick={handleScoreAll}
              disabled={scoring}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: `${GEM.green}14`,
                border: `1px solid ${GLOW.green.border}`,
                color: GEM.green,
              }}
            >
              {scoring
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <RefreshCw className="w-4 h-4" />
              }
              {scoring ? "Scoring..." : `Score ${unscoredCount} leads`}
            </button>
          )}
        </div>

        {/* Tier stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { tier: "diamond" as HeatTier, label: "Diamond", color: GEM.diamond, glow: GLOW.diamond, icon: <Gem className="w-3.5 h-3.5" /> },
              { tier: "hot"     as HeatTier, label: "Hot",     color: GEM.green,   glow: GLOW.green,   icon: <Flame className="w-3.5 h-3.5" /> },
              { tier: "warm"    as HeatTier, label: "Warm",    color: GEM.yellow,  glow: GLOW.yellow,  icon: <Zap className="w-3.5 h-3.5" /> },
              { tier: "cold"    as HeatTier, label: "Cold",    color: GEM.red,     glow: GLOW.red,     icon: <Snowflake className="w-3.5 h-3.5" /> },
            ] as const
          ).map(({ tier, label, color, glow, icon }) => (
            <button
              key={tier}
              onClick={() => setTierFilter(tierFilter === tier ? "all" : tier)}
              className="text-left rounded-xl p-3 transition-all"
              style={{
                background: CAVE.surface2,
                border: `1px solid ${tierFilter === tier ? color : CAVE.stoneEdge}`,
                boxShadow: tierFilter === tier ? glow.soft : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
                {icon}
                <p className="text-[10px] uppercase tracking-wider font-medium">{label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color }}>
                {tierStats[tier]}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none transition-colors"
              style={{
                background: CAVE.surface1,
                borderColor: CAVE.stoneEdge,
              }}
            />
          </div>

          {/* Tier pill filters */}
          <div className="flex gap-1">
            {TIER_FILTERS.map((f) => {
              const active = tierFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setTierFilter(f.value as typeof tierFilter)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  style={{
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    color: active ? f.color : "#737373",
                    border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "transparent"}`,
                  }}
                >
                  {f.icon}
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Lead type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg px-3 py-2 text-xs text-neutral-300 border focus:outline-none appearance-none cursor-pointer"
            style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}
          >
            <option value="all">All Types</option>
            <option value="seller">Sellers</option>
            <option value="buyer">Buyers</option>
            <option value="investor">Investors</option>
          </select>
        </div>

        {/* Lead cards */}
        {filtered.length === 0 ? (
          <MiningPanel padding="lg">
            <p className="text-sm text-neutral-600 text-center py-8">
              {leads.length === 0
                ? "No leads yet. Run a mining job to populate this list."
                : "No leads match your filters."}
            </p>
          </MiningPanel>
        ) : (
          <div className="space-y-3">
            {filtered.map((lead) => (
              <HeatLeadCard
                key={lead.id}
                lead={lead}
                onDraftMessage={setOutreachLead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Outreach modal */}
      {outreachLead && (
        <OutreachModal
          lead={outreachLead}
          realtorId={realtorId}
          onClose={() => setOutreachLead(null)}
        />
      )}
    </>
  );
}
