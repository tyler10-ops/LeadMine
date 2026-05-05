import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: realtor } = await supabase
    .from("realtors").select("id").eq("user_id", user.id).single();

  if (!realtor) return NextResponse.json([]);

  const { data: activities, error } = await supabase
    .from("follow_up_activities")
    .select("id, lead_id, channel, status, scheduled_at, sequence_step, sequence_name, sequence_id, content")
    .eq("realtor_id", realtor.id)
    .in("status", ["pending", "completed"])
    .like("sequence_name", "auto-%")
    .order("scheduled_at", { ascending: true })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!activities?.length) return NextResponse.json([]);

  type Activity = typeof activities[0];
  type Lead     = { id: string; owner_name: string; property_address: string; property_city: string; property_state: string; gem_grade: string; opportunity_score: number; phone: string; email: string };

  const leadIds = [...new Set(activities.map((a: Activity) => a.lead_id).filter(Boolean))];
  const { data: leads } = await supabase
    .from("leads")
    .select("id, owner_name, property_address, property_city, property_state, gem_grade, opportunity_score, phone, email")
    .in("id", leadIds);

  const leadMap = Object.fromEntries((leads ?? []).map((l: Lead) => [l.id, l]));

  // Group by lead_id, keeping the most recent sequence per lead
  const byLead: Record<string, { lead: Lead | null; steps: Activity[] }> = {};
  for (const act of activities) {
    if (!byLead[act.lead_id]) {
      byLead[act.lead_id] = { lead: (leadMap[act.lead_id] as Lead) ?? null, steps: [] };
    }
    byLead[act.lead_id].steps.push(act);
  }

  const sequences = Object.values(byLead).map(({ lead, steps }) => ({
    leadId:       lead?.id,
    leadName:     lead?.owner_name ?? "Unknown",
    address:      [lead?.property_address, lead?.property_city, lead?.property_state].filter(Boolean).join(", "),
    grade:        lead?.gem_grade ?? "rock",
    score:        lead?.opportunity_score ?? 0,
    phone:        lead?.phone ?? null,
    email:        lead?.email ?? null,
    sequenceName: steps[0]?.sequence_name ?? "auto",
    steps:        steps.sort((a: Activity, b: Activity) => a.sequence_step - b.sequence_step),
    nextPending:  steps.find((s: Activity) => s.status === "pending") ?? null,
  }));

  return NextResponse.json(sequences);
}

// POST /api/sequences/complete — mark a step done
export async function POST(request: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { activityId } = await request.json();
  if (!activityId) return NextResponse.json({ error: "activityId required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("follow_up_activities")
    .update({ status: "completed" })
    .eq("id", activityId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity_log").insert({
    user_id:    user.id,
    event_type: "sequence_step_completed",
    title:      "Sequence step marked complete",
    severity:   "success",
    icon:       "zap",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}
