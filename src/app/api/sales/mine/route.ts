/**
 * POST /api/sales/mine
 * Mines realtors from Google Places and saves them as prospects.
 * Body: { city: string, state: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { mineProspects } from "@/lib/sales/prospect-miner";
import { enrollProspect } from "@/lib/sales/outreach-sender";
import { createServiceClient, createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { city, state, limit = 50, autoEnroll = true } = await request.json();
  if (!city || !state) {
    return NextResponse.json({ error: "city and state are required" }, { status: 400 });
  }

  const result = await mineProspects({ city, state, limit });

  // Auto-enroll newly discovered prospects that have emails
  if (autoEnroll && result.saved > 0) {
    const supabase = createServiceClient();
    const { data: newProspects } = await supabase
      .from("prospects")
      .select("id")
      .eq("stage", "discovered")
      .not("email", "is", null)
      .is("sequence_id", null)
      .order("created_at", { ascending: false })
      .limit(result.saved);

    for (const p of newProspects ?? []) {
      await enrollProspect(p.id);
    }
  }

  return NextResponse.json({
    city, state,
    ...result,
    message: `Found ${result.found}, saved ${result.saved} new prospects in ${city}, ${state}`,
  });
}
