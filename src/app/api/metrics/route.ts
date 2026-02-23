import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { estimateCommission } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get realtor profile
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) {
      return NextResponse.json(
        { error: "Realtor profile not found" },
        { status: 404 }
      );
    }

    const realtorId = realtor.id;

    // Run all queries in parallel
    const [
      leadsResult,
      conversationsResult,
      eventsResult,
      dailyMetricsResult,
      recentLeadsResult,
    ] = await Promise.all([
      // Total leads by intent
      supabase
        .from("leads")
        .select("intent")
        .eq("realtor_id", realtorId),

      // Total conversations
      supabase
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("realtor_id", realtorId),

      // Total page views
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("realtor_id", realtorId)
        .eq("type", "page_view"),

      // Daily metrics for last 30 days
      supabase
        .from("daily_metrics")
        .select("*")
        .eq("realtor_id", realtorId)
        .gte("date", new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0])
        .order("date", { ascending: true }),

      // Recent leads
      supabase
        .from("leads")
        .select("*")
        .eq("realtor_id", realtorId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const leads = leadsResult.data || [];
    const totalLeads = leads.length;
    const buyerLeads = leads.filter((l) => l.intent === "buyer").length;
    const sellerLeads = leads.filter((l) => l.intent === "seller").length;
    const investorLeads = leads.filter((l) => l.intent === "investor").length;

    // Calculate weekly growth
    const dailyMetrics = dailyMetricsResult.data || [];
    const thisWeek = dailyMetrics.slice(-7);
    const lastWeek = dailyMetrics.slice(-14, -7);

    const thisWeekLeads = thisWeek.reduce(
      (sum, d) => sum + d.leads_captured,
      0
    );
    const lastWeekLeads = lastWeek.reduce(
      (sum, d) => sum + d.leads_captured,
      0
    );

    const weeklyGrowth =
      lastWeekLeads === 0
        ? thisWeekLeads > 0
          ? 100
          : 0
        : Math.round(
            ((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100
          );

    const metrics: DashboardMetrics = {
      totalLeads,
      buyerLeads,
      sellerLeads,
      investorLeads,
      totalConversations: conversationsResult.count || 0,
      totalPageViews: eventsResult.count || 0,
      weeklyGrowth,
      estimatedPipeline: estimateCommission(sellerLeads + buyerLeads),
      dailyMetrics,
      recentLeads: recentLeadsResult.data || [],
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
