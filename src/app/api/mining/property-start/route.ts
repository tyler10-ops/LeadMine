import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
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
 *   absenteeOnly?: boolean
 *   minScore?: number          // 0-100; only save leads scoring ≥ this
 *   excludeContacted?: boolean // skip leads already in pipeline (default true)
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
      zipCodes         = [],
      propertyTypes    = ["single_family"],
      minYearsOwned    = 0,
      minEquityPct     = 0,
      absenteeOnly     = false,
      minScore         = 0,
      excludeContacted = true,
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
      { clientId, counties: [], state: "", propertyTypes, zipCodes, minYearsOwned, minEquityPct, absenteeOnly, minScore, excludeContacted },
      { jobId: `prop-${clientId}-${zipCodes.join("-")}-${Date.now()}` }
    );

    // Register / refresh this territory in search_areas so the scheduler auto-mines it every 6h
    try {
      const svc = createServiceClient();
      const { data: existingArea } = await svc
        .from("search_areas")
        .select("id")
        .eq("realtor_id", clientId)
        .contains("zip_codes", zipCodes)
        .maybeSingle();

      if (!existingArea) {
        await svc.from("search_areas").insert({
          realtor_id:      clientId,
          name:            `ZIP: ${zipCodes.join(", ")}`,
          zip_codes:       zipCodes,
          counties:        [],
          state:           "",
          property_types:  propertyTypes,
          min_years_owned: minYearsOwned,
          min_equity_pct:  minEquityPct,
        });
      } else {
        await svc.from("search_areas").update({
          zip_codes:       zipCodes,
          property_types:  propertyTypes,
          min_years_owned: minYearsOwned,
          min_equity_pct:  minEquityPct,
          updated_at:      new Date().toISOString(),
        }).eq("id", existingArea.id);
      }
    } catch (areaErr) {
      // Non-fatal — job is already queued
      console.warn("[property-start] search_areas upsert failed (non-fatal):", areaErr);
    }

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
