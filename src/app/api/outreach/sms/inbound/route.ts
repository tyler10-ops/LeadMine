/**
 * Twilio inbound SMS webhook
 *
 * Configure in Twilio Console:
 *   Messaging Service → Integration → Send a webhook
 *   URL: https://leadmineapp.com/api/outreach/sms/inbound
 *   Method: POST
 *
 * Handles:
 *  - STOP / STOPALL / UNSUBSCRIBE / END / QUIT / CANCEL — opt-out (TCPA)
 *  - START / UNSTOP / YES — opt-in
 *  - HELP / INFO — auto-reply with support contact
 *  - everything else — logged as inbound message on the lead
 *
 * Twilio sends application/x-www-form-urlencoded body. We respond with
 * TwiML (XML) so Twilio can deliver any auto-reply in the same SMS turn.
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const OPT_OUT_KEYWORDS = new Set(["STOP", "STOPALL", "UNSUBSCRIBE", "END", "QUIT", "CANCEL", "REVOKE", "OPTOUT"]);
const OPT_IN_KEYWORDS  = new Set(["START", "UNSTOP", "YES", "OPTIN"]);
const HELP_KEYWORDS    = new Set(["HELP", "INFO"]);

function twiml(replyBody?: string): NextResponse {
  const reply = replyBody
    ? `<Message>${replyBody.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>`
    : "";
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${reply}</Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const from = String(form.get("From") ?? "");
    const body = String(form.get("Body") ?? "").trim();
    const messageSid = String(form.get("MessageSid") ?? "");
    const keyword = body.split(/\s+/)[0]?.toUpperCase() ?? "";

    const supabase = createServiceClient();

    // Find lead by phone (E.164 match)
    const { data: lead } = await supabase
      .from("leads")
      .select("id, client_id, owner_name")
      .eq("phone", from)
      .maybeSingle();

    // Log the inbound message
    await supabase.from("activity_log").insert({
      user_id:     null,
      event_type:  "sms_received",
      title:       lead?.owner_name ? `SMS from ${lead.owner_name}` : `SMS from ${from}`,
      description: body.slice(0, 200),
      icon:        "message",
      severity:    "info",
      metadata:    { from, leadId: lead?.id ?? null, sid: messageSid, body },
    }).catch(() => {});

    // STOP — record opt-out, suppress all future sends
    if (OPT_OUT_KEYWORDS.has(keyword)) {
      if (lead) {
        await supabase.from("leads").update({
          sms_opt_out: true,
          stage: "do_not_contact",
        }).eq("id", lead.id).catch(() => {});
      }
      // Twilio auto-sends the carrier opt-out confirmation; don't reply manually
      return twiml();
    }

    // START — clear opt-out
    if (OPT_IN_KEYWORDS.has(keyword)) {
      if (lead) {
        await supabase.from("leads").update({ sms_opt_out: false }).eq("id", lead.id).catch(() => {});
      }
      return twiml("You're re-subscribed to LeadMine outreach. Reply STOP to opt out at any time.");
    }

    // HELP
    if (HELP_KEYWORDS.has(keyword)) {
      return twiml("LeadMine: Real estate outreach. Reply STOP to opt out. Help: support@leadmineapp.com");
    }

    // Generic reply — log only, no auto-response (a human or AI follow-up handles it)
    return twiml();
  } catch (err) {
    console.error("[sms/inbound] Error:", err);
    return twiml();
  }
}