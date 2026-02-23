import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function GET(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const supabase = await createServerSupabase();

    const [snapshotsResult, assetsResult, automationsResult] = await Promise.all([
      supabase
        .from("analytics_snapshots")
        .select("*")
        .eq("realtor_id", realtorId)
        .gte("date", since)
        .order("date", { ascending: true }),
      supabase
        .from("ai_assets")
        .select("*")
        .eq("realtor_id", realtorId)
        .order("performance_score", { ascending: false }),
      supabase
        .from("automations")
        .select("*")
        .eq("realtor_id", realtorId)
        .order("success_rate", { ascending: false }),
    ]);

    const snapshots = snapshotsResult.data || [];

    // Compute totals from snapshots
    const totals = snapshots.reduce(
      (acc, s) => ({
        aiHandledLeads: acc.aiHandledLeads + s.ai_handled_leads,
        appointmentsBooked: acc.appointmentsBooked + s.appointments_booked,
        estimatedCommission: acc.estimatedCommission + Number(s.estimated_commission),
        avgResponseTime: acc.avgResponseTime + s.avg_response_time_ms,
        totalRuns: acc.totalRuns + s.total_automations_run,
        successCount: acc.successCount + s.success_count,
      }),
      {
        aiHandledLeads: 0,
        appointmentsBooked: 0,
        estimatedCommission: 0,
        avgResponseTime: 0,
        totalRuns: 0,
        successCount: 0,
      }
    );

    const avgResponse = snapshots.length > 0
      ? Math.round(totals.avgResponseTime / snapshots.length)
      : 0;

    const successRate = totals.totalRuns > 0
      ? Math.round((totals.successCount / totals.totalRuns) * 100)
      : 0;

    return NextResponse.json({
      totals: {
        aiHandledLeads: totals.aiHandledLeads,
        appointmentsBooked: totals.appointmentsBooked,
        estimatedCommission: totals.estimatedCommission,
        avgResponseTime: avgResponse,
        totalRuns: totals.totalRuns,
        successRate,
      },
      daily: snapshots,
      assets: assetsResult.data || [],
      automations: automationsResult.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
