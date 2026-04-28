import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPropertyMiningQueue } from "@/lib/queue/queues";

/**
 * POST /api/mining/property-start
 * Queue a property owner mining job for a set of ZIP codes.
 *
 * Body: {
 *   zipCodes: string[]       // e.g. ["78701", "78702"]
 *   propertyTypes?: string[] // defaults to ["single_family"]
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
      zipCodes      = [],
      propertyTypes = ["single_family"],
      minYearsOwned = 0,
      minEquityPct  = 0,
    } = body;

    if (!zipCodes?.length) {
      return NextResponse.json(
        { error: "zipCodes (array) is required" },
        { status: 400 }
      );
    }

    const queue = getPropertyMiningQueue();
    const job   = await queue.add(
      `property:zips:${zipCodes.join("-")}`,
      { clientId, counties: [], state: "", propertyTypes, zipCodes, minYearsOwned, minEquityPct },
      { jobId: `prop-${clientId}-${zipCodes.join("-")}-${Date.now()}` }
    );

    return NextResponse.json({
      jobId:   job.id,
      status:  "queued",
      message: `Property mining queued for ZIP codes: ${zipCodes.join(", ")}`,
    });
  } catch (err) {
    console.error("[api/mining/property-start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
