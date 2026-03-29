/**
 * POST /api/sales/outreach  — process the outreach queue (send due emails)
 * GET  /api/sales/outreach  — queue stats
 */

import { NextRequest, NextResponse } from "next/server";
import { processOutreachQueue } from "@/lib/sales/outreach-sender";
import { createServiceClient, createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = body.limit ?? 50;

  const result = await processOutreachQueue(limit);
  return NextResponse.json(result);
}

export async function GET() {
  const supabase = createServiceClient();

  const { data: stageRows } = await supabase.from("prospects").select("stage");
  const pipeline: Record<string, number> = {};
  for (const row of (stageRows ?? []) as { stage: string }[]) {
    pipeline[row.stage] = (pipeline[row.stage] ?? 0) + 1;
  }

  const [due, total] = await Promise.all([
    supabase.from("prospects")
      .select("id", { count: "exact", head: true })
      .lte("next_email_at", new Date().toISOString())
      .eq("unsubscribed", false)
      .not("email", "is", null),
    supabase.from("prospects")
      .select("id", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    pipeline,
    due_now:      due.count ?? 0,
    total:        total.count ?? 0,
  });
}
