import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export interface SignalLead {
  id: string;
  signal_source: "property" | "reddit" | "craigslist";
  // Shared
  property_city: string | null;
  property_state: string | null;
  stage: string | null;
  last_contact_at: string | null;
  signal_flags: string[];
  seller_probability: number;
  // Property-specific
  owner_name: string | null;
  property_address: string | null;
  property_zip: string | null;
  property_type: string | null;
  estimated_value: number | null;
  equity_percent: number | null;
  estimated_equity: number | null;
  years_owned: number | null;
  is_absentee_owner: boolean;
  heat_score: number;
  heat_tier: string;
  // Social-specific
  post_title: string | null;
  post_body: string | null;
  post_url: string | null;
  post_author: string | null;
  intent: string | null;
  raw_score: number;
}

// Keep old name exported for any existing consumers
export type RadarLead = SignalLead;

function computeSellerProbability(
  lead: Pick<
    SignalLead,
    "equity_percent" | "years_owned" | "is_absentee_owner" | "heat_tier" | "signal_flags"
  >
): number {
  let score = 30;

  const eq = lead.equity_percent ?? 0;
  if (eq >= 70) score += 25;
  else if (eq >= 50) score += 18;
  else if (eq >= 30) score += 10;
  else if (eq >= 15) score += 4;

  const yrs = lead.years_owned ?? 0;
  if (yrs >= 12) score += 22;
  else if (yrs >= 8) score += 16;
  else if (yrs >= 5) score += 10;
  else if (yrs >= 3) score += 4;

  if (lead.is_absentee_owner) score += 12;

  const ht = lead.heat_tier;
  if (ht === "diamond") score += 8;
  else if (ht === "hot") score += 5;
  else if (ht === "warm") score += 2;

  const flags = lead.signal_flags ?? [];
  if (flags.includes("pre_foreclosure")) score += 8;
  if (flags.includes("tax_delinquent")) score += 6;
  if (flags.includes("divorce") || flags.includes("life_event")) score += 5;
  if (flags.includes("price_reduction")) score += 3;

  return Math.min(97, Math.max(18, score));
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve client ID (supports both realtors and clients tables)
    let clientId: string | null = null;
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (realtor) {
      clientId = realtor.id;
    } else {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (client) clientId = client.id;
    }

    if (!clientId) return NextResponse.json({ error: "No profile found" }, { status: 404 });

    // ── Property leads (via search_areas) ────────────────────────────────────
    const { data: searchAreas } = await supabase
      .from("search_areas")
      .select("id")
      .eq("realtor_id", clientId);

    const areaIds = searchAreas?.map((a: { id: string }) => a.id) ?? [];

    let propertySignals: SignalLead[] = [];
    if (areaIds.length > 0) {
      const { data: propLeads } = await supabase
        .from("leads")
        .select(
          "id, owner_name, property_address, property_city, property_state, property_zip, property_type, estimated_value, equity_percent, estimated_equity, years_owned, is_absentee_owner, heat_score, heat_tier, signal_flags, last_contact_at, stage"
        )
        .in("search_area_id", areaIds)
        .order("heat_score", { ascending: false })
        .limit(80);

      propertySignals = (propLeads ?? []).map((l) => ({
        ...l,
        signal_source: "property" as const,
        post_title: null,
        post_body: null,
        post_url: null,
        post_author: null,
        intent: null,
        raw_score: l.heat_score ?? 0,
        signal_flags: l.signal_flags ?? [],
        seller_probability: computeSellerProbability({ ...l, signal_flags: l.signal_flags ?? [] }),
      }));
    }

    // ── Social signal leads (Reddit + Craigslist) ─────────────────────────────
    const { data: socialLeads } = await supabase
      .from("leads")
      .select(
        "id, business_name, property_city, property_state, score, data_source, intent, signal_flags, enrichment_data, stage, last_contact_at"
      )
      .eq("client_id", clientId)
      .in("data_source", ["reddit", "craigslist"])
      .order("score", { ascending: false })
      .limit(40);

    const socialSignals: SignalLead[] = (socialLeads ?? []).map((l) => {
      const ed = (l.enrichment_data ?? {}) as Record<string, unknown>;
      return {
        id: l.id,
        signal_source: (l.data_source ?? "reddit") as "reddit" | "craigslist",
        owner_name: null,
        property_city: l.property_city ?? null,
        property_state: l.property_state ?? null,
        property_address: null,
        property_zip: null,
        property_type: null,
        estimated_value: null,
        equity_percent: null,
        estimated_equity: null,
        years_owned: null,
        is_absentee_owner: false,
        heat_score: 0,
        heat_tier: "none",
        signal_flags: l.signal_flags ?? [],
        stage: l.stage ?? null,
        last_contact_at: l.last_contact_at ?? null,
        post_title: l.business_name ?? null,
        post_body: typeof ed.body === "string" ? ed.body : null,
        post_url: typeof ed.url === "string" ? ed.url : null,
        post_author: typeof ed.author === "string" ? ed.author : null,
        intent: l.intent ?? null,
        raw_score: l.score ?? 30,
        seller_probability: l.score ?? 30,
      };
    });

    // ── Merge + sort by probability ───────────────────────────────────────────
    const all: SignalLead[] = [...propertySignals, ...socialSignals].sort(
      (a, b) => b.seller_probability - a.seller_probability
    );

    return NextResponse.json({ leads: all, total: all.length });
  } catch (err) {
    console.error("Signals error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
