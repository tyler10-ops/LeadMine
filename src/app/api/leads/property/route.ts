import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerSupabase();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve all client IDs for this user (clients + realtors tables)
    const supabase = createServiceClient();
    const [{ data: clientRow }, { data: realtorRow }] = await Promise.all([
      supabase.from("clients").select("id").eq("user_id", user.id).single(),
      supabase.from("realtors").select("id").eq("user_id", user.id).single(),
    ]);
    const allowedIds = [clientRow?.id, realtorRow?.id, user.id].filter(Boolean) as string[];

    const { searchParams } = new URL(request.url);
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "200"), 500);
    const source = searchParams.get("source") ?? "county_assessor";
    const grade  = searchParams.get("grade");
    const stage  = searchParams.get("stage");

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
        phone,
        email,
        created_at
      `)
      .eq("data_source", source)
      .in("client_id", allowedIds)
      .order("opportunity_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (grade) query = query.eq("gem_grade", grade);
    if (stage) query = query.eq("stage", stage);

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