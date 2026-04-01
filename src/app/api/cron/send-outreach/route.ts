/**
 * GET /api/cron/send-outreach
 *
 * Cron job — runs every 15 minutes via Vercel Cron.
 * Picks up outreach_drafts with status "queued_to_send" and dispatches
 * them via Resend. Enforces per-lead rate limiting (1 email / 24h).
 *
 * Secured with CRON_SECRET bearer token.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { processOutreachQueue } from "@/lib/outreach/email-sender";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const started  = Date.now();

  try {
    const result = await processOutreachQueue(supabase);

    console.log(
      `[cron/send-outreach] processed=${result.processed} sent=${result.sent} failed=${result.failed} ms=${Date.now() - started}`
    );

    return NextResponse.json({
      ok:        true,
      processed: result.processed,
      sent:      result.sent,
      failed:    result.failed,
      durationMs: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/send-outreach] Fatal error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
