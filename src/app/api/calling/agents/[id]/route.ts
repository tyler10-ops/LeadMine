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

    const [assetResult, callsResult, objectionsResult] = await Promise.all([
      supabase
        .from("ai_assets")
        .select("*")
        .eq("id", id)
        .eq("realtor_id", realtorId)
        .single(),
      supabase
        .from("call_records")
        .select("*")
        .eq("agent_id", id)
        .eq("realtor_id", realtorId)
        .order("started_at", { ascending: false })
        .limit(50),
      supabase
        .from("objection_scripts")
        .select("*")
        .eq("agent_id", id)
        .eq("realtor_id", realtorId)
        .order("effectiveness_score", { ascending: false }),
    ]);

    if (assetResult.error || !assetResult.data) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const asset = assetResult.data;
    const calls = callsResult.data || [];
    const objections = objectionsResult.data || [];

    // Compute performance metrics
    const completed = calls.filter((c) => c.status === "completed");
    const appointments = calls.filter((c) => c.outcome === "appointment_set");
    const totalDuration = completed.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);

    const today = new Date().toISOString().split("T")[0];
    const todayCalls = calls.filter((c) => c.started_at?.startsWith(today));

    return NextResponse.json({
      asset,
      calls,
      objections,
      metrics: {
        total_calls: calls.length,
        calls_today: todayCalls.length,
        conversations_started: completed.length,
        appointments_booked: appointments.length,
        conversion_rate: completed.length > 0
          ? Math.round((appointments.length / completed.length) * 100)
          : 0,
        avg_duration: completed.length > 0
          ? Math.round(totalDuration / completed.length)
          : 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
