import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerSupabase();

    // Fetch lead, calls, follow-ups, appointments in parallel
    const [leadResult, callsResult, followUpsResult, appointmentsResult, agentResult] =
      await Promise.all([
        supabase
          .from("leads")
          .select("*")
          .eq("id", id)
          .eq("realtor_id", realtorId)
          .single(),
        supabase
          .from("call_records")
          .select("*")
          .eq("lead_id", id)
          .eq("realtor_id", realtorId)
          .order("started_at", { ascending: false }),
        supabase
          .from("follow_up_activities")
          .select("*")
          .eq("lead_id", id)
          .eq("realtor_id", realtorId)
          .order("scheduled_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("lead_id", id)
          .eq("realtor_id", realtorId)
          .order("scheduled_at", { ascending: false }),
        // We'll resolve the agent after getting the lead
        Promise.resolve(null),
      ]);

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadResult.data;
    const calls = callsResult.data || [];
    const followUps = followUpsResult.data || [];
    const appointments = appointmentsResult.data || [];

    // Fetch assigned agent if exists
    let assignedAgent = null;
    if (lead.assigned_agent_id) {
      const { data: agent } = await supabase
        .from("ai_assets")
        .select("*")
        .eq("id", lead.assigned_agent_id)
        .single();
      assignedAgent = agent;
    }

    // Build timeline
    const timeline = [];

    for (const call of calls) {
      timeline.push({
        type: "call",
        title: `${call.direction === "outbound" ? "Outbound" : "Inbound"} call — ${call.status}`,
        description: call.ai_summary || `Duration: ${call.duration_seconds}s`,
        timestamp: call.started_at,
        metadata: { callId: call.id, outcome: call.outcome, sentiment: call.sentiment },
      });
    }

    for (const fu of followUps) {
      timeline.push({
        type: fu.channel,
        title: `${fu.channel.toUpperCase()} ${fu.status === "replied" ? "reply received" : fu.status}`,
        description: fu.content?.slice(0, 120) || null,
        timestamp: fu.completed_at || fu.scheduled_at,
        metadata: { followUpId: fu.id, status: fu.status },
      });
    }

    for (const apt of appointments) {
      timeline.push({
        type: "appointment",
        title: `${apt.meeting_type.replace("_", " ")} — ${apt.status}`,
        description: apt.conversation_summary?.slice(0, 120) || null,
        timestamp: apt.scheduled_at,
        metadata: { appointmentId: apt.id, status: apt.status },
      });
    }

    // Sort timeline by timestamp descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      lead,
      calls,
      followUps,
      appointments,
      timeline,
      assignedAgent,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabase();

    const updates: Record<string, unknown> = {};

    if (body.stage !== undefined) {
      updates.stage = body.stage;
      updates.stage_changed_at = new Date().toISOString();
    }
    if (body.qualification !== undefined) updates.qualification = body.qualification;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.assigned_agent_id !== undefined) updates.assigned_agent_id = body.assigned_agent_id;
    if (body.notes !== undefined) updates.notes = body.notes;

    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .eq("realtor_id", realtorId)
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
