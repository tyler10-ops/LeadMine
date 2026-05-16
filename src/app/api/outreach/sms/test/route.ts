/**
 * POST /api/outreach/sms/test
 *
 * Sends a one-off test SMS to a phone number you provide.
 * Used to verify Twilio + A2P 10DLC config end-to-end before going live.
 *
 * Body: { to: string }  // E.164 or 10-digit US, e.g. "+15555551234" or "5555551234"
 */

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const ACCOUNT_SID           = process.env.TWILIO_ACCOUNT_SID            ?? "";
const AUTH_TOKEN            = process.env.TWILIO_AUTH_TOKEN             ?? "";
const FROM_NUMBER           = process.env.TWILIO_FROM_NUMBER            ?? "";
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID  ?? "";

export async function POST(request: Request) {
  const auth = await createServerSupabase();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Config diagnostics — return what's missing for fast debugging
  const missing: string[] = [];
  if (!ACCOUNT_SID) missing.push("TWILIO_ACCOUNT_SID");
  if (!AUTH_TOKEN)  missing.push("TWILIO_AUTH_TOKEN");
  if (!MESSAGING_SERVICE_SID && !FROM_NUMBER) {
    missing.push("TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER");
  }
  if (missing.length > 0) {
    return NextResponse.json({
      ok: false,
      error: "Twilio config missing",
      missing,
    }, { status: 503 });
  }

  let body: { to?: string };
  try { body = await request.json(); } catch { body = {}; }
  const to = (body.to ?? "").trim();
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 });

  const normalized = to.replace(/\D/g, "");
  const e164 = to.startsWith("+") ? to : normalized.startsWith("1") ? `+${normalized}` : `+1${normalized}`;
  if (!/^\+\d{10,15}$/.test(e164)) {
    return NextResponse.json({ error: `Invalid phone number: ${to}` }, { status: 400 });
  }

  const params = new URLSearchParams({
    To: e164,
    Body: "LeadMine test SMS — your A2P 10DLC + Messaging Service config is working. Reply STOP to opt out.",
  });
  if (MESSAGING_SERVICE_SID) params.set("MessagingServiceSid", MESSAGING_SERVICE_SID);
  else                       params.set("From", FROM_NUMBER);

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const result = await twilioRes.json();
    if (!twilioRes.ok) {
      return NextResponse.json({
        ok: false,
        error: result.message ?? "Twilio send failed",
        code: result.code,
        more_info: result.more_info,
        sender: MESSAGING_SERVICE_SID ? "MessagingService" : "From",
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      sid: result.sid,
      status: result.status,
      to: result.to,
      sender: MESSAGING_SERVICE_SID ? `MessagingService(${MESSAGING_SERVICE_SID.slice(0, 8)}…)` : `From(${FROM_NUMBER})`,
      price: result.price,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : "Internal error",
    }, { status: 500 });
  }
}