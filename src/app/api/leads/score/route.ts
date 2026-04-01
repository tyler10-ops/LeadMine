import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { calculateHeatScore } from "@/lib/scoring/heat-score";
import { enqueueFollowUpSequence } from "@/lib/followup/sequences";
import type { PropertyLead, SearchArea } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { leadId?: string; leadIds?: string[] };
    const { leadId, leadIds } = body;

    if (!leadId && (!leadIds || leadIds.length === 0)) {
      return NextResponse.json({ error: "Provide leadId or leadIds" }, { status: 400 });
    }

    // Get realtor
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) {
      return NextResponse.json({ error: "Realtor profile not found" }, { status: 404 });
    }

    // Get onboarding targeting profile
    const { data: profile } = await supabase
      .from("search_areas")
      .select("*")
      .eq("realtor_id", realtor.id)
      .eq("is_onboarding_profile", true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Targeting profile not found. Complete onboarding first." }, { status: 404 });
    }

    const idsToScore = leadId ? [leadId] : leadIds!;

    // Fetch leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .in("id", idsToScore);

    if (leadsError || !leads) {
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Score each lead and save
    const results = await Promise.allSettled(
      leads.map(async (lead) => {
        const result = await calculateHeatScore(lead as PropertyLead, profile as SearchArea);

        await supabase
          .from("leads")
          .update({
            heat_score:     result.score,
            heat_tier:      result.tier,
            heat_breakdown: result.breakdown,
            heat_reasoning: result.reasoning,
            heat_scored_at: new Date().toISOString(),
          })
          .eq("id", lead.id);

        return { leadId: lead.id, ...result };
      })
    );

    const scored = results
      .filter((r): r is PromiseFulfilledResult<ReturnType<typeof Object>> => r.status === "fulfilled")
      .map((r) => r.value);

    const failed = results
      .filter((r) => r.status === "rejected")
      .length;

    // Auto-enqueue follow-up sequences for high-value leads (fire-and-forget)
    const highValueLeads = (scored as Array<{ leadId: string; tier: string }>)
      .filter(s => s.tier === "diamond" || s.tier === "hot");

    if (highValueLeads.length > 0) {
      Promise.allSettled(
        highValueLeads.map(s =>
          enqueueFollowUpSequence(
            s.leadId,
            realtor.id,
            s.tier as "diamond" | "hot",
            supabase
          )
        )
      ).catch(err => console.error("[score] Follow-up enqueue error:", err));
    }

    return NextResponse.json({ scored, failed, total: leads.length });
  } catch (err) {
    console.error("Heat score error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
