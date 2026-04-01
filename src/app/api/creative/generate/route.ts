import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateCreativeSet } from "@/lib/creative/generator";
import type { CreativeGenerateRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as CreativeGenerateRequest;
    const { county, state, leadType, equityBand, propertyType, leadCount, avgYearsOwned } = body;

    if (!county || !state || !leadType || !equityBand || !propertyType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
    }

    const { copy, images } = await generateCreativeSet({
      county,
      state,
      leadType,
      equityBand,
      propertyType,
      leadCount: leadCount ?? 0,
      avgYearsOwned,
    });

    // Persist to Supabase (table: ad_creatives — migration in supabase/migrations/)
    const { data: creative, error: dbError } = await supabase
      .from("ad_creatives")
      .insert({
        client_id: client.id,
        county,
        state,
        lead_type: leadType,
        equity_band: equityBand,
        property_type: propertyType,
        lead_count: leadCount ?? 0,
        copy,
        images,
        platforms: ["meta", "instagram"],
        status: "complete",
      })
      .select()
      .single();

    if (dbError) {
      // Table may not exist yet — return the generated creative without persisting
      console.warn("ad_creatives table not found, returning without saving:", dbError.message);
      return NextResponse.json({
        id: `temp_${Date.now()}`,
        client_id: client.id,
        county,
        state,
        lead_type: leadType,
        equity_band: equityBand,
        property_type: propertyType,
        lead_count: leadCount ?? 0,
        copy,
        images,
        platforms: ["meta", "instagram"],
        status: "complete",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(creative);
  } catch (err) {
    console.error("Creative generation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
