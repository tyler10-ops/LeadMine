import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { runPropertyMiningPipeline } from "@/lib/property/orchestrator";
import type { MiningJob, SearchArea } from "@/types";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Get all realtors that have at least one search area with zip codes
  const { data: searchAreas, error } = await supabase
    .from("search_areas")
    .select("*")
    .not("zip_codes", "eq", "{}")
    .order("last_mined_at", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("[cron/nightly-mine] Failed to fetch search areas:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: { searchAreaId: string; realtorId: string; status: string; newLeads?: number }[] = [];

  for (const area of searchAreas ?? []) {
    if (!area.zip_codes?.length) continue;

    try {
      // Create a mining_job record
      const { data: job, error: jobError } = await supabase
        .from("mining_jobs")
        .insert({
          realtor_id:     area.realtor_id,
          search_area_id: area.id,
          status:         "running",
          phase:          "fetching",
          records_found:  0,
          records_graded: 0,
          records_saved:  0,
          elite_count:    0,
          refined_count:  0,
          rock_count:     0,
          duplicates_skipped: 0,
          started_at:     new Date().toISOString(),
        })
        .select("*")
        .single();

      if (jobError || !job) {
        results.push({ searchAreaId: area.id, realtorId: area.realtor_id, status: "job_create_failed" });
        continue;
      }

      const result = await runPropertyMiningPipeline(job as MiningJob, area as SearchArea);

      results.push({
        searchAreaId: area.id,
        realtorId:    area.realtor_id,
        status:       "complete",
        newLeads:     result.recordsSaved,
      });
    } catch (err) {
      console.error(`[cron/nightly-mine] Error for search area ${area.id}:`, err);
      results.push({ searchAreaId: area.id, realtorId: area.realtor_id, status: "error" });
    }
  }

  const totalNewLeads = results.reduce((sum, r) => sum + (r.newLeads ?? 0), 0);
  console.log(`[cron/nightly-mine] Done. ${results.length} areas processed, ${totalNewLeads} new leads saved.`);

  return NextResponse.json({ processed: results.length, totalNewLeads, results });
}