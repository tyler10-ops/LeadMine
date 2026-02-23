import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/signals/history — Aggregated signal history for trend analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const geography = searchParams.get("geography");
    const periodType = searchParams.get("period_type") || "daily";
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 90);

    const supabase = createServiceClient();

    let query = supabase
      .from("signal_history")
      .select("*")
      .eq("period_type", periodType)
      .order("period_start", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (geography) query = query.eq("geography", geography);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
