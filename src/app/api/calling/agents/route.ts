import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function GET() {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();

    // Get voice/sms assets (calling agents)
    const { data: assets, error: assetsError } = await supabase
      .from("ai_assets")
      .select("*")
      .eq("realtor_id", realtorId)
      .in("type", ["voice", "sms"])
      .order("created_at", { ascending: false });

    if (assetsError) {
      return NextResponse.json({ error: assetsError.message }, { status: 500 });
    }

    const agentIds = (assets || []).map((a) => a.id);

    if (agentIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get calling metrics for each agent
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const { data: callRecords } = await supabase
      .from("call_records")
      .select("agent_id, status, outcome, duration_seconds, started_at")
      .eq("realtor_id", realtorId)
      .in("agent_id", agentIds)
      .gte("started_at", `${weekAgo}T00:00:00Z`);

    const allCalls = callRecords || [];

    const metrics = (assets || []).map((asset) => {
      const agentCalls = allCalls.filter((c) => c.agent_id === asset.id);
      const todayCalls = agentCalls.filter((c) => c.started_at?.startsWith(today));
      const completed = agentCalls.filter((c) => c.status === "completed");
      const appointments = agentCalls.filter((c) => c.outcome === "appointment_set");
      const totalDuration = completed.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
      const lastCall = agentCalls.sort((a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      )[0];

      return {
        asset,
        calls_today: todayCalls.length,
        calls_this_week: agentCalls.length,
        conversations_started: completed.length,
        appointments_booked: appointments.length,
        conversion_rate: completed.length > 0
          ? Math.round((appointments.length / completed.length) * 100)
          : 0,
        avg_duration: completed.length > 0
          ? Math.round(totalDuration / completed.length)
          : 0,
        last_call_at: lastCall?.started_at || null,
      };
    });

    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
