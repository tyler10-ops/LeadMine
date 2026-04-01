import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit    = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
    const source   = searchParams.get("source") ?? "county_assessor";
    const clientId = searchParams.get("clientId");
    const grade    = searchParams.get("grade");
    const stage    = searchParams.get("stage");

    let query = supabase
      .from("leads")
      .select(`
        id,
        owner_name,
        property_address,
        property_city,
        property_county,
        property_state,
        property_type,
        years_owned,
        equity_percent,
        is_absentee_owner,
        opportunity_score,
        gem_grade,
        signal_flags,
        stage,
        created_at
      `)
      .eq("data_source", source)
      .order("opportunity_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (clientId) query = query.eq("client_id", clientId);
    if (grade)    query = query.eq("gem_grade", grade);
    if (stage)    query = query.eq("stage", stage);

    const { data, error } = await query;

    if (error) {
      console.error("[leads/property] Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[leads/property] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
