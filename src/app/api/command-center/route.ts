import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    const realtorId = realtor.id;

    const [leadsResult, miningResult, outreachResult] = await Promise.all([
      supabase
        .from("leads")
        .select("stage, heat_tier, last_contact_at, created_at")
        .or(`realtor_id.eq.${realtorId},client_id.eq.${realtorId}`),

      supabase
        .from("mining_jobs")
        .select("status, elite_count, refined_count, rock_count, records_saved, completed_at, created_at")
        .eq("realtor_id", realtorId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabase
        .from("outreach_drafts")
        .select("status, created_at")
        .eq("realtor_id", realtorId)
        .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString()),
    ]);

    const leads = leadsResult.data ?? [];
    const jobs = miningResult.data ?? [];
    const drafts = outreachResult.data ?? [];

    // Pipeline stage counts
    const stageCounts = {
      new:       leads.filter((l) => l.stage === "new" || !l.stage).length,
      contacted: leads.filter((l) => l.stage === "contacted").length,
      qualified: leads.filter((l) => l.stage === "qualified").length,
      booked:    leads.filter((l) => l.stage === "booked").length,
      dead:      leads.filter((l) => l.stage === "dead").length,
    };

    // Heat tier counts
    const tierCounts = {
      diamond: leads.filter((l) => l.heat_tier === "diamond").length,
      hot:     leads.filter((l) => l.heat_tier === "hot").length,
      warm:    leads.filter((l) => l.heat_tier === "warm").length,
      cold:    leads.filter((l) => l.heat_tier === "cold").length,
      total:   leads.length,
    };

    // Mining stats (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const recentJobs = jobs.filter(
      (j) => j.completed_at && new Date(j.completed_at).getTime() > thirtyDaysAgo
    );
    const gemsMined = recentJobs.reduce((sum, j) => sum + (j.records_saved ?? 0), 0);
    const eliteMined = recentJobs.reduce((sum, j) => sum + (j.elite_count ?? 0), 0);
    const lastJob = jobs[0] ?? null;

    // Outreach stats
    const approvedDrafts = drafts.filter((d) => d.status === "approved" || d.status === "sent").length;

    // Leads needing follow-up (contacted but no touch in 48h+)
    const fortyEightH = Date.now() - 48 * 60 * 60 * 1000;
    const needsFollowUp = leads.filter((l) => {
      if (l.stage === "qualified" || l.stage === "booked" || l.stage === "dead") return false;
      if (!l.last_contact_at) return l.stage === "contacted";
      return new Date(l.last_contact_at).getTime() < fortyEightH;
    }).length;

    return NextResponse.json({
      stageCounts,
      tierCounts,
      mining: {
        gemsMined,
        eliteMined,
        totalRuns: jobs.length,
        lastRunAt: lastJob?.completed_at ?? null,
        lastRunStatus: lastJob?.status ?? null,
      },
      outreach: {
        draftsThisMonth: drafts.length,
        approvedThisMonth: approvedDrafts,
      },
      needsFollowUp,
    });
  } catch (err) {
    console.error("[command-center] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
