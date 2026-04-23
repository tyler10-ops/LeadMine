import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const clientId = client?.id ?? null;

    // Stage counts
    const stageCounts = { new: 0, contacted: 0, qualified: 0, booked: 0, dead: 0 };
    if (clientId) {
      const { data: stageRows } = await supabase
        .from("leads").select("stage").eq("client_id", clientId);
      for (const row of stageRows ?? []) {
        const s = (row.stage ?? "new") as keyof typeof stageCounts;
        if (s in stageCounts) stageCounts[s]++;
      }
    }

    // Tier counts
    const tierCounts = { diamond: 0, hot: 0, warm: 0, cold: 0, total: 0 };
    if (clientId) {
      const { data: tierRows } = await supabase
        .from("leads").select("gem_grade").eq("client_id", clientId);
      for (const row of tierRows ?? []) {
        tierCounts.total++;
        const grade = row.gem_grade ?? "rock";
        if (grade === "elite")        tierCounts.diamond++;
        else if (grade === "refined") tierCounts.hot++;
        else if (grade === "rock")    tierCounts.warm++;
        else                          tierCounts.cold++;
      }
    }

    // Mining stats
    const mining = { gemsMined: tierCounts.total, eliteMined: tierCounts.diamond, totalRuns: 0, lastRunAt: null as string | null, lastRunStatus: null as string | null };
    if (clientId) {
      const { data: lastRun } = await supabase
        .from("activity_log").select("created_at, severity")
        .eq("client_id", clientId).eq("event_type", "mine_completed")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (lastRun) { mining.lastRunAt = lastRun.created_at; mining.lastRunStatus = lastRun.severity; }
      const { count } = await supabase
        .from("activity_log").select("id", { count: "exact", head: true })
        .eq("client_id", clientId).eq("event_type", "mine_completed");
      mining.totalRuns = count ?? 0;
    }

    // Outreach stats
    const outreach = { draftsThisMonth: 0, approvedThisMonth: 0 };
    if (clientId) {
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { count: drafts } = await supabase
        .from("follow_up_activities").select("id", { count: "exact", head: true })
        .eq("realtor_id", clientId).gte("created_at", startOfMonth.toISOString());
      const { count: approved } = await supabase
        .from("follow_up_activities").select("id", { count: "exact", head: true })
        .eq("realtor_id", clientId).eq("status", "sent").gte("created_at", startOfMonth.toISOString());
      outreach.draftsThisMonth = drafts ?? 0;
      outreach.approvedThisMonth = approved ?? 0;
    }

    // Needs follow-up
    let needsFollowUp = 0;
    if (clientId) {
      const { count } = await supabase
        .from("leads").select("id", { count: "exact", head: true })
        .eq("client_id", clientId).eq("stage", "new");
      needsFollowUp = count ?? 0;
    }

    return NextResponse.json({ stageCounts, tierCounts, mining, outreach, needsFollowUp });

  } catch (err) {
    console.error("[command-center] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
