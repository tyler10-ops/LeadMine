/**
 * POST /api/followup
 * Manually trigger a follow-up sequence for a specific lead.
 * Body: { leadId: string, tier?: "diamond" | "hot" }
 *
 * GET /api/followup?leadId=xxx
 * Returns the current sequence status for a lead.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { enqueueFollowUpSequence, cancelFollowUpSequence } from "@/lib/followup/sequences";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      leadId:   string;
      tier?:    "diamond" | "hot";
      cancel?:  boolean;
    };
    const { leadId, tier = "hot", cancel = false } = body;

    if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor profile not found" }, { status: 404 });

    if (cancel) {
      await cancelFollowUpSequence(leadId, supabase);
      return NextResponse.json({ cancelled: true });
    }

    const result = await enqueueFollowUpSequence(leadId, realtor.id, tier, supabase);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[followup] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const leadId = request.nextUrl.searchParams.get("leadId");
    if (!leadId) return NextResponse.json({ error: "leadId is required" }, { status: 400 });

    const { data: activities } = await supabase
      .from("follow_up_activities")
      .select("id, channel, status, scheduled_at, completed_at, sequence_step, sequence_name, sequence_id, content")
      .eq("lead_id", leadId)
      .like("sequence_name", "auto-%")
      .order("sequence_step", { ascending: true });

    const hasActive = activities?.some(a => a.status === "pending") ?? false;

    return NextResponse.json({ activities: activities ?? [], hasActiveSequence: hasActive });
  } catch (err) {
    console.error("[followup] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
