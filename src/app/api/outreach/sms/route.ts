import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID ?? "";
const AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN  ?? "";
const FROM_NUMBER = process.env.TWILIO_FROM_NUMBER ?? "";

export async function POST(request: Request) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!ACCOUNT_SID || !AUTH_TOKEN || !FROM_NUMBER) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 503 });
  }

  let body: { to: string; message: string; leadId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { to, message, leadId } = body;
  if (!to || !message) {
    return NextResponse.json({ error: "to and message are required" }, { status: 400 });
  }

  // Normalize phone number to E.164
  const normalized = to.replace(/\D/g, "");
  const e164 = normalized.startsWith("1") ? `+${normalized}` : `+1${normalized}`;

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ From: FROM_NUMBER, To: e164, Body: message }).toString(),
      }
    );

    const result = await twilioRes.json();

    if (!twilioRes.ok) {
      console.error("[sms] Twilio error:", result);
      return NextResponse.json({ error: result.message ?? "Twilio send failed" }, { status: 502 });
    }

    // Log to activity if leadId provided
    if (leadId) {
      const supabase = (await import("@/lib/supabase/server")).createServiceClient();
      await supabase.from("activity_log").insert({
        user_id:     user.id,
        event_type:  "sms_sent",
        title:       "SMS sent to lead",
        description: message.slice(0, 120),
        icon:        "message",
        severity:    "info",
        metadata:    { leadId, to: e164, sid: result.sid },
      }).catch(() => {});

      await supabase.from("leads").update({
        last_contact_at: new Date().toISOString(),
        stage: "contacted",
      }).eq("id", leadId).catch(() => {});
    }

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (err) {
    console.error("[sms] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}