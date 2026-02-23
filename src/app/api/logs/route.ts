import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

// Global logs endpoint — filterable, searchable, paginated
export async function GET(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const outcome = searchParams.get("outcome");
    const assetId = searchParams.get("asset_id");
    const automationId = searchParams.get("automation_id");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = await createServerSupabase();

    let query = supabase
      .from("automation_logs")
      .select("*", { count: "exact" })
      .eq("realtor_id", realtorId)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (outcome) query = query.eq("outcome", outcome);
    if (assetId) query = query.eq("asset_id", assetId);
    if (automationId) query = query.eq("automation_id", automationId);
    if (search) query = query.or(
      `trigger_source.ilike.%${search}%,action_executed.ilike.%${search}%,ai_decision_summary.ilike.%${search}%,reason.ilike.%${search}%`
    );

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
