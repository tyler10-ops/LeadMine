/**
 * GET /api/automation/status
 *
 * Returns a live snapshot of all automation activity:
 * - Follow-up sequences (active count, pending steps, next fire time)
 * - Outreach drafts queued to send
 * - Calls placed today
 * - Recent activity feed (last 12 events)
 */

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

    // Fall back to client row if no realtor
    const { data: client } = !realtor
      ? await supabase.from("clients").select("id").eq("user_id", user.id).single()
      : { data: null };

    const realtorId = realtor?.id ?? null;
    const clientId  = client?.id ?? null;

    if (!realtorId && !clientId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Run all queries in parallel
    const [
      sequencesPending,
      sequencesNext,
      emailQueued,
      smsQueued,
      callsToday,
      callsWeek,
      recentActivity,
      recentDrafts,
    ] = await Promise.all([
      // Pending follow-up steps
      realtorId
        ? supabase
            .from("follow_up_activities")
            .select("id", { count: "exact", head: true })
            .eq("realtor_id", realtorId)
            .eq("status", "pending")
            .like("sequence_name", "auto-%")
        : Promise.resolve({ count: 0 }),

      // Next scheduled step
      realtorId
        ? supabase
            .from("follow_up_activities")
            .select("scheduled_at, channel, sequence_name")
            .eq("realtor_id", realtorId)
            .eq("status", "pending")
            .like("sequence_name", "auto-%")
            .order("scheduled_at", { ascending: true })
            .limit(1)
        : Promise.resolve({ data: [] }),

      // Email drafts queued to send
      realtorId
        ? supabase
            .from("outreach_drafts")
            .select("id", { count: "exact", head: true })
            .eq("realtor_id", realtorId)
            .eq("channel", "email")
            .eq("status", "queued_to_send")
        : Promise.resolve({ count: 0 }),

      // SMS drafts queued to send
      realtorId
        ? supabase
            .from("outreach_drafts")
            .select("id", { count: "exact", head: true })
            .eq("realtor_id", realtorId)
            .eq("channel", "sms")
            .eq("status", "queued_to_send")
        : Promise.resolve({ count: 0 }),

      // Calls today
      realtorId
        ? supabase
            .from("call_records")
            .select("id", { count: "exact", head: true })
            .eq("realtor_id", realtorId)
            .gte("created_at", todayStart.toISOString())
        : Promise.resolve({ count: 0 }),

      // Calls this week
      realtorId
        ? supabase
            .from("call_records")
            .select("id, outcome", { count: "exact" })
            .eq("realtor_id", realtorId)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString())
        : Promise.resolve({ data: [], count: 0 }),

      // Recent activity log
      supabase
        .from("activity_log")
        .select("id, event_type, title, description, icon, severity, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12),

      // Recent outreach drafts (last 5)
      realtorId
        ? supabase
            .from("outreach_drafts")
            .select("id, channel, tone, status, subject, created_at")
            .eq("realtor_id", realtorId)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

    // Calculate call appointment rate
    const weekCalls = (callsWeek as { data: Array<{ outcome: string }> | null }).data ?? [];
    const weekTotal = (callsWeek as { count: number }).count ?? weekCalls.length;
    const appointments = weekCalls.filter(c => c.outcome === "appointment_set").length;
    const appointmentRate = weekTotal > 0 ? Math.round((appointments / weekTotal) * 100) : 0;

    // Distinct leads with active sequences
    let activeSequenceLeads = 0;
    if (realtorId) {
      const { data: seqLeads } = await supabase
        .from("follow_up_activities")
        .select("lead_id")
        .eq("realtor_id", realtorId)
        .eq("status", "pending")
        .like("sequence_name", "auto-%");
      activeSequenceLeads = new Set((seqLeads ?? []).map(r => r.lead_id)).size;
    }

    return NextResponse.json({
      sequences: {
        activeLeads:    activeSequenceLeads,
        pendingSteps:   (sequencesPending as { count: number }).count ?? 0,
        nextFiresAt:    ((sequencesNext as { data: Array<{ scheduled_at: string; channel: string }> }).data ?? [])[0]?.scheduled_at ?? null,
        nextChannel:    ((sequencesNext as { data: Array<{ channel: string }> }).data ?? [])[0]?.channel ?? null,
      },
      outreach: {
        emailQueued:    (emailQueued as { count: number }).count ?? 0,
        smsQueued:      (smsQueued as { count: number }).count ?? 0,
        recentDrafts:   (recentDrafts as { data: unknown[] }).data ?? [],
      },
      calls: {
        today:          (callsToday as { count: number }).count ?? 0,
        thisWeek:       weekTotal,
        appointmentRate,
      },
      activity:         (recentActivity.data ?? []),
    });
  } catch (err) {
    console.error("[automation/status]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
