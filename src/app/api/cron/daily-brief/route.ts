import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendDailyBriefEmail } from "@/lib/notifications/email";
import { sendDailyBriefPush, type PushSubscriptionRecord } from "@/lib/notifications/push";
import type { PropertyLead } from "@/types";
import type { BriefData } from "@/app/api/brief/route";

// Called by Vercel Cron at 8:00 AM UTC daily (or your chosen schedule in vercel.json).
// Also callable manually with the CRON_SECRET header for testing.

export async function GET(request: NextRequest) {
  // Verify secret to prevent unauthorized invocations
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Fetch all realtors with notifications enabled
  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("realtor_id, email_enabled, push_enabled, last_sent_at");

  if (prefsError) {
    console.error("[cron/daily-brief] Failed to fetch prefs:", prefsError.message);
    return NextResponse.json({ error: prefsError.message }, { status: 500 });
  }

  const results: { realtorId: string; email?: string; push?: string }[] = [];

  for (const pref of prefs ?? []) {
    if (!pref.email_enabled && !pref.push_enabled) continue;

    try {
      const brief = await buildBriefForRealtor(supabase, pref.realtor_id, pref.last_sent_at ?? undefined);
      if (!brief) continue;

      // Send email
      if (pref.email_enabled) {
        const { data: realtorUser } = await supabase
          .from("realtors")
          .select("user_id")
          .eq("id", pref.realtor_id)
          .single();

        if (realtorUser) {
          const { data: authUser } = await supabase.auth.admin.getUserById(realtorUser.user_id);
          const email = authUser?.user?.email;

          if (email) {
            const result = await sendDailyBriefEmail(email, brief);
            results.push({ realtorId: pref.realtor_id, email: result.success ? "sent" : result.error });
          }
        }
      }

      // Send push
      if (pref.push_enabled) {
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("realtor_id", pref.realtor_id);

        for (const sub of subs ?? []) {
          const pushResult = await sendDailyBriefPush(sub as PushSubscriptionRecord, brief);

          if (pushResult.gone) {
            // Remove expired subscription
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }

          results.push({ realtorId: pref.realtor_id, push: pushResult.success ? "sent" : pushResult.error });
        }
      }

      // Update last_sent_at
      await supabase
        .from("notification_preferences")
        .update({ last_sent_at: new Date().toISOString() })
        .eq("realtor_id", pref.realtor_id);
    } catch (err) {
      console.error(`[cron/daily-brief] Error for realtor ${pref.realtor_id}:`, err);
    }
  }

  return NextResponse.json({ processed: results.length, results });
}

// ── Brief builder (mirrors /api/brief but uses service client) ────────────────

async function buildBriefForRealtor(
  supabase: ReturnType<typeof createServiceClient>,
  realtorId: string,
  lastSentAt?: string
): Promise<BriefData | null> {
  const { data: realtor } = await supabase
    .from("realtors")
    .select("id, name, city, state")
    .eq("id", realtorId)
    .single();

  if (!realtor) return null;

  const { data: profile } = await supabase
    .from("search_areas")
    .select("deal_goal")
    .eq("realtor_id", realtorId)
    .eq("is_onboarding_profile", true)
    .single();

  const dealGoal = profile?.deal_goal ?? "1-2";

  // Leads
  const { data: areas } = await supabase
    .from("search_areas")
    .select("id")
    .eq("realtor_id", realtorId);

  const areaIds = (areas ?? []).map((a: { id: string }) => a.id);

  let leadsData: PropertyLead[] = [];
  if (areaIds.length > 0) {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .in("search_area_id", areaIds)
      .order("heat_score", { ascending: false })
      .limit(200);
    leadsData = (data ?? []) as PropertyLead[];
  }

  const now = Date.now();
  const fortyEightH = now - 48 * 60 * 60 * 1000;
  const sevenDays   = now - 7  * 24 * 60 * 60 * 1000;

  const tierCounts = {
    diamond: leadsData.filter((l) => l.heat_tier === "diamond").length,
    hot:     leadsData.filter((l) => l.heat_tier === "hot").length,
    warm:    leadsData.filter((l) => l.heat_tier === "warm").length,
    cold:    leadsData.filter((l) => l.heat_tier === "cold").length,
    total:   leadsData.length,
  };

  const priorityLeads = leadsData
    .filter((l) => l.heat_score > 0)
    .filter((l) => !l.last_contact_at || new Date(l.last_contact_at).getTime() < fortyEightH)
    .slice(0, 5);

  const followUpLeads = leadsData
    .filter((l) => {
      if (!l.last_contact_at) return false;
      const t = new Date(l.last_contact_at).getTime();
      return t >= sevenDays && t < fortyEightH;
    })
    .filter((l) => l.stage !== "qualified" && l.stage !== "booked")
    .slice(0, 4);

  const { data: lastJob } = await supabase
    .from("mining_jobs")
    .select("completed_at")
    .eq("realtor_id", realtorId)
    .eq("status", "complete")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  const daysSinceLastMine = lastJob?.completed_at
    ? Math.floor((now - new Date(lastJob.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // New leads since last brief
  let newLeadsCount = 0;
  let topNewGems: PropertyLead[] = [];
  if (lastSentAt && areaIds.length > 0) {
    const { data: newLeads } = await supabase
      .from("leads")
      .select("*")
      .in("search_area_id", areaIds)
      .gt("created_at", lastSentAt)
      .order("opportunity_score", { ascending: false })
      .limit(50);

    const fresh = (newLeads ?? []) as PropertyLead[];
    newLeadsCount = fresh.length;
    topNewGems = fresh.filter((l) => l.gem_grade === "elite").slice(0, 3);
    if (topNewGems.length < 3) {
      const refined = fresh.filter((l) => l.gem_grade === "refined").slice(0, 3 - topNewGems.length);
      topNewGems = [...topNewGems, ...refined];
    }
  }

  const highValue = tierCounts.diamond + tierCounts.hot;
  const newLeadsNote = newLeadsCount > 0 ? `${newLeadsCount} new lead${newLeadsCount !== 1 ? "s" : ""} were found overnight. ` : "";
  const aiSummary = priorityLeads.length > 0
    ? `${newLeadsNote}You have ${priorityLeads.length} lead${priorityLeads.length !== 1 ? "s" : ""} waiting for first contact and ${highValue} high-value opportunities in your pipeline. ${daysSinceLastMine && daysSinceLastMine > 7 ? `Your last mining run was ${daysSinceLastMine} days ago — time for a fresh batch.` : "Open your War Room to take action."}`
    : `${newLeadsNote}Your pipeline has ${tierCounts.total} leads${highValue > 0 ? ` — ${highValue} are high-value` : ""}. All priority contacts are up to date. ${daysSinceLastMine && daysSinceLastMine > 7 ? "Consider running a new mining job to find fresh leads." : "Keep up the momentum."}`;

  return {
    realtorName: realtor.name ?? "there",
    dealGoal,
    tierCounts,
    priorityLeads,
    followUpLeads,
    daysSinceLastMine,
    aiSummary,
    generatedAt: new Date().toISOString(),
    newLeadsCount,
    topNewGems,
  };
}
