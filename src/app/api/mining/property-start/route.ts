import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPropertyMiningQueue } from "@/lib/queue/queues";

/**
 * POST /api/mining/property-start
 * Queue a property owner mining job for a set of counties.
 *
 * Body: {
 *   counties: string[]      // e.g. ["Travis"]
 *   state: string           // e.g. "TX"
 *   propertyTypes?: string[] // defaults to ["single_family"]
 *   zipCodes?: string[]
 *   minYearsOwned?: number
 *   minEquityPct?: number
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Resolve the client/realtor ID
    const { data: client }  = await supabase.from("clients").select("id").eq("user_id", user.id).single();
    const { data: realtor } = await supabase.from("realtors").select("id").eq("user_id", user.id).single();
    const clientId = client?.id ?? realtor?.id ?? user.id;

    const body = await req.json();
    const {
      counties,
      state,
      propertyTypes = ["single_family"],
      zipCodes      = [],
      minYearsOwned = 0,
      minEquityPct  = 0,
    } = body;

    if (!counties?.length || !state) {
      return NextResponse.json(
        { error: "counties (array) and state are required" },
        { status: 400 }
      );
    }

    const queue = getPropertyMiningQueue();
    const job   = await queue.add(
      `property:${state}:${counties.join("-")}`,
      { clientId, counties, state, propertyTypes, zipCodes, minYearsOwned, minEquityPct },
      { jobId: `prop-${clientId}-${state}-${counties.join("-")}-${Date.now()}` }
    );

    return NextResponse.json({
      jobId:   job.id,
      status:  "queued",
      message: `Property mining queued for ${counties.join(", ")}, ${state}`,
    });
  } catch (err) {
    console.error("[api/mining/property-start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
