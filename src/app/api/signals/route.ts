import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/signals — Paginated signal feed with filters.
 * Public read access (matches RLS policy).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const geography = searchParams.get("geography");
    const region = searchParams.get("region");
    const direction = searchParams.get("direction");
    const highImpactOnly = searchParams.get("highImpactOnly") === "true";
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = createServiceClient();

    // Build query with current interpretation joined
    let query = supabase
      .from("market_signals")
      .select(
        `*, interpretation:signal_interpretations!inner(
          id, ai_summary, ai_realtor_impact, ai_suggested_implication,
          affected_asset_types, asset_recommendations, model_used,
          prompt_version, generated_at, is_current
        )`,
        { count: "exact" }
      )
      .eq("signal_interpretations.is_current", true)
      .eq("status", "active")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (geography) query = query.eq("geography", geography);
    if (region) query = query.eq("region", region);
    if (direction) query = query.eq("signal_direction", direction);
    if (highImpactOnly) query = query.eq("is_high_impact", true);
    if (search) query = query.or(`headline.ilike.%${search}%,summary.ilike.%${search}%`);

    const { data, count, error } = await query;

    if (error) {
      // Fallback: query without inner join (signals without interpretations)
      const fallbackQuery = supabase
        .from("market_signals")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .order("published_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) fallbackQuery.eq("category", category);
      if (geography) fallbackQuery.eq("geography", geography);
      if (region) fallbackQuery.eq("region", region);
      if (direction) fallbackQuery.eq("signal_direction", direction);
      if (highImpactOnly) fallbackQuery.eq("is_high_impact", true);
      if (search) fallbackQuery.or(`headline.ilike.%${search}%,summary.ilike.%${search}%`);

      const fallback = await fallbackQuery;

      return NextResponse.json({
        signals: fallback.data || [],
        total: fallback.count || 0,
        filters: { category, geography, region, direction, highImpactOnly, search, limit, offset },
      });
    }

    // Flatten interpretation from array to single object
    const signals = (data || []).map((s: Record<string, unknown>) => ({
      ...s,
      interpretation: Array.isArray(s.interpretation) ? s.interpretation[0] : s.interpretation,
    }));

    return NextResponse.json({
      signals,
      total: count || 0,
      filters: { category, geography, region, direction, highImpactOnly, search, limit, offset },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
