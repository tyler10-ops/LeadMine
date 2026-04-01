import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PropertyLead } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface BriefData {
  realtorName: string;
  dealGoal: string;
  tierCounts: { diamond: number; hot: number; warm: number; cold: number; total: number };
  priorityLeads: PropertyLead[];
  followUpLeads: PropertyLead[];
  daysSinceLastMine: number | null;
  aiSummary: string;
  generatedAt: string;
}

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get realtor + targeting profile
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id, name, city, state")
      .eq("user_id", user.id)
      .single();

    // Fallback: client-based
    let clientId: string | null = null;
    if (!realtor) {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      clientId = client?.id ?? null;
    }

    const realtorName = realtor?.name ?? "there";
    let dealGoal = "1-2";

    if (realtor) {
      const { data: profile } = await supabase
        .from("search_areas")
        .select("deal_goal")
        .eq("realtor_id", realtor.id)
        .eq("is_onboarding_profile", true)
        .single();
      if (profile?.deal_goal) dealGoal = profile.deal_goal;
    }

    // Fetch leads (limit 200, heat-score sorted)
    let leadsQuery = supabase
      .from("leads")
      .select("*")
      .order("heat_score", { ascending: false })
      .limit(200);

    if (realtor) {
      const { data: areas } = await supabase
        .from("search_areas")
        .select("id")
        .eq("realtor_id", realtor.id);
      const areaIds = (areas ?? []).map((a: { id: string }) => a.id);
      if (areaIds.length > 0) {
        leadsQuery = leadsQuery.in("search_area_id", areaIds);
      } else {
        leadsQuery = leadsQuery.eq("client_id", "no-match");
      }
    } else if (clientId) {
      leadsQuery = leadsQuery.eq("client_id", clientId);
    } else {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const { data: leads } = await leadsQuery;
    const allLeads = (leads ?? []) as PropertyLead[];

    // Tier counts
    const tierCounts = {
      diamond: allLeads.filter((l) => l.heat_tier === "diamond").length,
      hot:     allLeads.filter((l) => l.heat_tier === "hot").length,
      warm:    allLeads.filter((l) => l.heat_tier === "warm").length,
      cold:    allLeads.filter((l) => l.heat_tier === "cold").length,
      total:   allLeads.length,
    };

    // Priority leads — top heat-scored, not yet contacted (or not contacted in 48h+)
    const now = Date.now();
    const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;

    const priorityLeads = allLeads
      .filter((l) => l.heat_score > 0)
      .filter((l) => {
        if (!l.last_contact_at) return true;
        return new Date(l.last_contact_at).getTime() < fortyEightHoursAgo;
      })
      .slice(0, 5);

    // Follow-up leads — contacted in the last 7 days, not yet qualified
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const followUpLeads = allLeads
      .filter((l) => {
        if (!l.last_contact_at) return false;
        const t = new Date(l.last_contact_at).getTime();
        return t >= sevenDaysAgo && t < fortyEightHoursAgo;
      })
      .filter((l) => l.stage !== "qualified" && l.stage !== "booked")
      .slice(0, 4);

    // Days since last mine
    let daysSinceLastMine: number | null = null;
    if (realtor) {
      const { data: lastJob } = await supabase
        .from("mining_jobs")
        .select("completed_at")
        .eq("realtor_id", realtor.id)
        .eq("status", "complete")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (lastJob?.completed_at) {
        daysSinceLastMine = Math.floor(
          (now - new Date(lastJob.completed_at).getTime()) / (1000 * 60 * 60 * 24)
        );
      }
    }

    // AI summary
    const aiSummary = await generateBriefSummary(
      realtorName,
      tierCounts,
      priorityLeads,
      followUpLeads,
      dealGoal,
      daysSinceLastMine
    );

    const brief: BriefData = {
      realtorName,
      dealGoal,
      tierCounts,
      priorityLeads,
      followUpLeads,
      daysSinceLastMine,
      aiSummary,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(brief);
  } catch (err) {
    console.error("Brief API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function generateBriefSummary(
  name: string,
  tiers: { diamond: number; hot: number; warm: number; cold: number; total: number },
  priority: PropertyLead[],
  followUp: PropertyLead[],
  dealGoal: string,
  daysSinceLastMine: number | null
): Promise<string> {
  const topLead = priority[0];
  const topLeadStr = topLead
    ? `Your top lead is ${topLead.owner_name || topLead.business_name || "a contact"} in ${topLead.property_city || "unknown city"} with a heat score of ${topLead.heat_score}.`
    : "You have no priority leads yet — time to run a mining job.";

  const minePrompt = daysSinceLastMine !== null && daysSinceLastMine > 7
    ? ` Your last mining run was ${daysSinceLastMine} days ago — consider running a new one.`
    : "";

  const prompt = `You are a real estate AI assistant giving ${name} their daily morning brief. Write exactly 2-3 sentences summarizing their pipeline state and most important action today. Be specific, direct, and motivating — like a sharp business partner. No filler words.

Data:
- Total leads: ${tiers.total} (${tiers.diamond} diamond, ${tiers.hot} hot, ${tiers.warm} warm, ${tiers.cold} cold)
- Priority leads needing contact: ${priority.length}
- Leads needing follow-up: ${followUp.length}
- Deal goal: ${dealGoal} deals/month
- ${topLeadStr}${minePrompt}

Write the brief now. Do not address the agent by name — start directly with an insight.`;

  try {
    const res = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });
    return res.content[0].type === "text" ? res.content[0].text : fallbackSummary(tiers, priority.length);
  } catch {
    return fallbackSummary(tiers, priority.length);
  }
}

function fallbackSummary(
  tiers: { diamond: number; hot: number; total: number },
  priorityCount: number
): string {
  if (tiers.total === 0) {
    return "Your pipeline is empty. Run a mining job to start finding leads.";
  }
  const highValue = tiers.diamond + tiers.hot;
  return `You have ${tiers.total} leads in your pipeline — ${highValue} are high-priority. ${priorityCount > 0 ? `${priorityCount} need your attention today.` : "All priority leads have been recently contacted."}`;
}
