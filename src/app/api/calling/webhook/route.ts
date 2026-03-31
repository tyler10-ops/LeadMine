/**
 * POST /api/calling/webhook
 *
 * Receives real-time events from Vapi.ai during and after calls.
 * Updates call_records in Supabase as the call progresses.
 *
 * Events handled:
 *   status-update     → call started / ringing / ended
 *   end-of-call-report → final transcript, summary, structured data
 *   transcript        → real-time transcript (ignored, we save the full one at end)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  type VapiWebhookEvent,
  type VapiEndOfCallReport,
  type VapiStatusUpdate,
  type VapiStructuredData,
  mapVapiOutcome,
} from "@/lib/calling/vapi";

export async function POST(request: NextRequest) {
  let body: VapiWebhookEvent;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = body;
  if (!message?.type) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  try {
    switch (message.type) {
      case "status-update":
        await handleStatusUpdate(supabase, message as VapiStatusUpdate);
        break;

      case "end-of-call-report":
        await handleEndOfCall(supabase, message as VapiEndOfCallReport);
        break;

      // transcript messages are high-frequency partials — skip to keep costs down
      case "transcript":
        break;

      default:
        // Unknown event type — safe to ignore
        break;
    }
  } catch (err) {
    // Log but don't return 500 — Vapi retries on non-2xx
    console.error("[calling/webhook]", message.type, err);
  }

  return NextResponse.json({ received: true });
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handleStatusUpdate(
  supabase: ReturnType<typeof createServiceClient>,
  message: VapiStatusUpdate
) {
  const vapiCallId = message.call?.id;
  if (!vapiCallId) return;

  const statusMap: Record<string, string> = {
    started: "in-progress",
    ended: "completed",
    forwarding: "forwarded",
  };
  const status = statusMap[message.status] ?? message.status;

  await supabase
    .from("call_records")
    .update({ status })
    .eq("vapi_call_id", vapiCallId);
}

async function handleEndOfCall(
  supabase: ReturnType<typeof createServiceClient>,
  message: VapiEndOfCallReport
) {
  const vapiCallId = message.call?.id;
  if (!vapiCallId) return;

  const structured = message.analysis?.structuredData as VapiStructuredData | undefined;
  const outcome = mapVapiOutcome(structured, message.endedReason ?? "");

  // Build transcript in our format from Vapi messages array
  const transcript = (message.messages ?? [])
    .filter((m) => m.role === "assistant" || m.role === "user")
    .map((m) => ({
      speaker: m.role === "assistant" ? ("ai" as const) : ("lead" as const),
      text: m.message,
      timestamp_ms: Math.round(m.time * 1000),
    }));

  // Calculate duration
  const startedAt = message.call?.startedAt;
  const endedAt = message.call?.endedAt;
  const durationSeconds =
    startedAt && endedAt
      ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
      : message.call?.duration ?? 0;

  // Derive sentiment from success evaluation
  const successEval = message.analysis?.successEvaluation ?? "";
  const sentiment =
    successEval.toLowerCase().includes("perfect") || successEval.toLowerCase().includes("good")
      ? "positive"
      : successEval.toLowerCase().includes("poor")
      ? "negative"
      : "neutral";

  const updatePayload: Record<string, unknown> = {
    status: "completed",
    outcome,
    duration_seconds: durationSeconds,
    transcript: transcript.length > 0 ? transcript : null,
    ai_summary: message.analysis?.summary ?? message.summary ?? null,
    sentiment,
    objections_raised: structured?.objections ?? [],
    ended_at: message.call?.endedAt ?? new Date().toISOString(),
    vapi_recording_url: message.recordingUrl ?? null,
    vapi_cost: message.call?.cost ?? null,
    raw_analysis: message.analysis ?? null,
  };

  const { data: callRecord } = await supabase
    .from("call_records")
    .update(updatePayload)
    .eq("vapi_call_id", vapiCallId)
    .select("id, lead_id, realtor_id")
    .single();

  if (!callRecord?.lead_id) return;

  // Update lead stage based on outcome
  const stageUpdate: Record<string, unknown> = {
    last_contact_at: new Date().toISOString(),
  };

  if (outcome === "appointment_set") {
    stageUpdate.stage = "booked";
    stageUpdate.stage_changed_at = new Date().toISOString();
  } else if (outcome === "follow_up_needed") {
    stageUpdate.stage = "contacted";
    stageUpdate.stage_changed_at = new Date().toISOString();
  } else if (outcome === "not_interested") {
    stageUpdate.stage = "dead";
    stageUpdate.stage_changed_at = new Date().toISOString();
  }

  // Enrich lead intent if the call confirmed it
  if (structured?.intent_confirmed && structured.intent_confirmed !== "unknown") {
    stageUpdate.intent = structured.intent_confirmed;
  }

  await supabase
    .from("leads")
    .update(stageUpdate)
    .eq("id", callRecord.lead_id);
}
