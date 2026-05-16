import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { lookupZipsBatch } from "@/lib/zip-lookup";

export interface MapLead {
  id: string;
  owner_name: string | null;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_type: string | null;
  years_owned: number | null;
  equity_percent: number | null;
  is_absentee_owner: boolean | null;
  opportunity_score: number;
  gem_grade: "elite" | "refined" | "rock" | "ungraded";
  signal_flags: string[] | null;
  stage: string | null;
  phone: string | null;
  email: string | null;
  enrichment_data: { phones?: string[]; emails?: string[] } | null;
  created_at: string;
}

export interface ZipCluster {
  zip: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  count: number;
  elite: number;
  refined: number;
  rock: number;
  avgScore: number;
  totalEquity: number;
  topGrade: "elite" | "refined" | "rock" | "ungraded";
  leadIds: string[];
}

export interface MapResponse {
  leads: MapLead[];
  clusters: ZipCluster[];
  totalLeads: number;
  zipsCovered: number;
}

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createServiceClient();
    const [{ data: clientRow }, { data: realtorRow }] = await Promise.all([
      supabase.from("clients").select("id").eq("user_id", user.id).single(),
      supabase.from("realtors").select("id").eq("user_id", user.id).single(),
    ]);
    const allowedIds = [clientRow?.id, realtorRow?.id, user.id].filter(Boolean) as string[];

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "1000"), 2000);

    const { data, error } = await supabase
      .from("leads")
      .select(`
        id,
        owner_name,
        property_address,
        property_city,
        property_state,
        property_zip,
        property_type,
        years_owned,
        equity_percent,
        is_absentee_owner,
        opportunity_score,
        gem_grade,
        signal_flags,
        stage,
        phone,
        email,
        enrichment_data,
        created_at
      `)
      .eq("data_source", "county_assessor")
      .in("client_id", allowedIds)
      .not("property_zip", "is", null)
      .order("opportunity_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[leads/map] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const leads = (data ?? []) as MapLead[];

    // Group by zip
    const byZip = new Map<string, MapLead[]>();
    for (const lead of leads) {
      const zip = lead.property_zip?.trim().slice(0, 5);
      if (!zip) continue;
      if (!byZip.has(zip)) byZip.set(zip, []);
      byZip.get(zip)!.push(lead);
    }

    // Resolve centroids
    const centroids = await lookupZipsBatch(Array.from(byZip.keys()));

    const clusters: ZipCluster[] = [];
    for (const [zip, zipLeads] of byZip.entries()) {
      const centroid = centroids.get(zip);
      if (!centroid) continue;
      const elite   = zipLeads.filter(l => l.gem_grade === "elite").length;
      const refined = zipLeads.filter(l => l.gem_grade === "refined").length;
      const rock    = zipLeads.filter(l => l.gem_grade === "rock").length;
      const avgScore = Math.round(
        zipLeads.reduce((sum, l) => sum + (l.opportunity_score ?? 0), 0) / zipLeads.length
      );
      const totalEquity = zipLeads.reduce((sum, l) => sum + (l.equity_percent ?? 0), 0);
      const topGrade: ZipCluster["topGrade"] =
        elite > 0 ? "elite" : refined > 0 ? "refined" : rock > 0 ? "rock" : "ungraded";

      clusters.push({
        zip,
        city: centroid.city ?? null,
        state: centroid.state ?? null,
        lat: centroid.lat,
        lng: centroid.lng,
        count: zipLeads.length,
        elite, refined, rock,
        avgScore,
        totalEquity,
        topGrade,
        leadIds: zipLeads.map(l => l.id),
      });
    }

    const response: MapResponse = {
      leads,
      clusters,
      totalLeads: leads.length,
      zipsCovered: clusters.length,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("[leads/map] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}