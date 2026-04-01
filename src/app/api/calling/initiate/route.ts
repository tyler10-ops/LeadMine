/**
 * POST /api/calling/initiate
 *
 * Starts a real outbound AI call via Vapi.ai for a given lead.
 * Creates a call_record in "initiated" state, then fires the Vapi call.
 * Vapi sends updates back via /api/calling/webhook.
 *
 * Body: { lead_id: string, agent_id?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";
import { initiateVapiCall, normalizePhone } from "@/lib/calling/vapi";

export async function POST(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lead_id, agent_id } = await request.json();
    if (!lead_id) {
      return NextResponse.json({ error: "lead_id is required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Fetch lead + realtor info in parallel
    const [leadResult, realtorResult] = await Promise.all([
      supabase
        .from("leads")
        .select("id, company_name, owner_name, phone, intent, stage")
        .eq("id", lead_id)
        .single(),
      supabase
        .from("realtors")
        .select("id, name")
        .eq("id", realtorId)
        .single(),
    ]);

    if (leadResult.error || !leadResult.data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = leadResult.data;
    const realtor = realtorResult.data;

    if (!lead.phone) {
      return NextResponse.json(
        { error: "Lead has no phone number on file" },
        { status: 422 }
      );
    }

    // Validate phone format
    const normalized = normalizePhone(lead.phone);
    if (!normalized.match(/^\+\d{10,15}$/)) {
      return NextResponse.json(
        { error: `Invalid phone number: ${lead.phone}` },
        { status: 422 }
      );
    }

    // Create call record in initiated state before firing the call
    const { data: callRecord, error: insertError } = await supabase
      .from("call_records")
      .insert({
        realtor_id: realtorId,
        lead_id,
        agent_id: agent_id ?? null,
        direction: "outbound",
        status: "initiated",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !callRecord) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create call record" },
        { status: 500 }
      );
    }

    // Build webhook URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const webhookUrl = `${appUrl}/api/calling/webhook`;

    // Fire the Vapi call
    let vapiCall;
    try {
      vapiCall = await initiateVapiCall({
        leadPhone: normalized,
        leadName: lead.owner_name ?? lead.company_name ?? "",
        leadIntent: lead.intent ?? "unknown",
        realtorName: realtor?.name ?? "your agent",
        realtorBusiness: "LeadMine Realty",
        callRecordId: callRecord.id,
        webhookUrl,
      });
    } catch (vapiErr) {
      // Mark the record as failed so the UI reflects this
      await supabase
        .from("call_records")
        .update({
          status: "failed",
          ai_summary: `Call failed to initiate: ${vapiErr instanceof Error ? vapiErr.message : String(vapiErr)}`,
        })
        .eq("id", callRecord.id);

      return NextResponse.json(
        { error: `Vapi call failed: ${vapiErr instanceof Error ? vapiErr.message : String(vapiErr)}` },
        { status: 502 }
      );
    }

    // Store the Vapi call ID on the record
    await supabase
      .from("call_records")
      .update({
        status: "ringing",
        vapi_call_id: vapiCall.id,
      })
      .eq("id", callRecord.id);

    // Update lead stage to "contacted"
    await supabase
      .from("leads")
      .update({
        stage: "contacted",
        stage_changed_at: new Date().toISOString(),
        last_contact_at: new Date().toISOString(),
      })
      .eq("id", lead_id);

    return NextResponse.json({
      call_record_id: callRecord.id,
      vapi_call_id: vapiCall.id,
      status: "ringing",
      message: `Calling ${lead.owner_name ?? lead.company_name ?? lead.phone}…`,
    });
  } catch (err) {
    console.error("[calling/initiate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
