import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";
import type { LeadStage } from "@/types";

export async function GET() {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createServerSupabase();

    const { data: leads, error } = await supabase
      .from("leads")
      .select("stage, last_contact_at")
      .eq("realtor_id", realtorId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allLeads = leads || [];
    const total = allLeads.length;

    const byStage: Record<LeadStage, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      booked: 0,
      dead: 0,
    };

    const staleThreshold = Date.now() - 48 * 60 * 60 * 1000;
    let staleCount = 0;

    for (const lead of allLeads) {
      const stage = (lead.stage || "new") as LeadStage;
      byStage[stage] = (byStage[stage] || 0) + 1;

      if (
        stage !== "dead" &&
        stage !== "booked" &&
        (!lead.last_contact_at || new Date(lead.last_contact_at).getTime() < staleThreshold)
      ) {
        staleCount++;
      }
    }

    const bookedCount = byStage.booked || 0;
    const newCount = byStage.new || 0;
    const totalExcludingDead = total - (byStage.dead || 0);
    const conversionRate = totalExcludingDead > 0
      ? Math.round((bookedCount / totalExcludingDead) * 100)
      : 0;

    return NextResponse.json({
      total,
      byStage,
      conversionRate,
      staleCount,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
