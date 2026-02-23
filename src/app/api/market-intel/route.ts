import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Market intelligence is public — no auth required
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const region = searchParams.get("region");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    const supabase = createServiceClient();

    let query = supabase
      .from("market_news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (region) query = query.eq("region", region);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
