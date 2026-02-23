import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

/**
 * GET /api/alerts/preferences — Get current user's alert preferences.
 * POST /api/alerts/preferences — Create or update alert preferences.
 */
export async function GET() {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("alert_preferences")
      .select("*")
      .eq("realtor_id", realtorId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return defaults if no preferences exist
    if (!data) {
      return NextResponse.json({
        realtor_id: realtorId,
        categories: ["rates", "inventory", "demand", "policy", "local_market", "macro"],
        geographies: ["national", "state", "local"],
        regions: ["US"],
        min_impact_score: 70,
        signal_directions: ["bullish", "bearish"],
        alert_enabled: true,
        alert_channel: "in_app",
        max_alerts_per_day: 5,
      });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("alert_preferences")
      .upsert(
        {
          realtor_id: realtorId,
          categories: body.categories,
          geographies: body.geographies,
          regions: body.regions,
          min_impact_score: body.min_impact_score,
          signal_directions: body.signal_directions,
          alert_enabled: body.alert_enabled,
          alert_channel: body.alert_channel,
          max_alerts_per_day: body.max_alerts_per_day,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "realtor_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
