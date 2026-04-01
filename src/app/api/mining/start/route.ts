import { NextRequest, NextResponse } from "next/server";
import { getMiningQueue } from "@/lib/queue/queues";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/mining/start
 * Start a new mining job for the authenticated user.
 *
 * Body: { verticalId, locations, scrapers? }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use realtor ID as clientId so RLS and lead queries work correctly
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) {
      return NextResponse.json({ error: "Realtor profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { verticalId, locations, scrapers } = body;
    const clientId = realtor.id;

    if (!verticalId || !locations?.length) {
      return NextResponse.json(
        { error: "verticalId and locations are required" },
        { status: 400 }
      );
    }

    const queue = getMiningQueue();
    const job = await queue.add(
      `mine:${verticalId}:${clientId}`,
      { clientId, verticalId, locations, scrapers },
      {
        jobId: `mine-${clientId}-${verticalId}-${Date.now()}`,
      }
    );

    return NextResponse.json({
      jobId: job.id,
      status: "queued",
      message: `Mining job queued for ${locations.length} locations`,
    });
  } catch (err) {
    console.error("[api/mining/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
