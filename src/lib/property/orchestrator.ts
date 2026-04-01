/**
 * Property Mining Orchestrator
 *
 * Coordinates the full property intelligence pipeline:
 *   1. Fetch county assessor records for the search area
 *   2. Score + grade each record using property signals
 *   3. Save graded leads to the database
 *   4. Update the mining job status + fire notification
 */

import { createServiceClient } from "@/lib/supabase/server";
import { fetchCountyRecords } from "./county-adapter";
import { scoreBatch, type ScoredPropertyRecord } from "./scorer";
import type { SearchArea, MiningJob } from "@/types";

export interface PropertyMiningResult {
  jobId: string;
  recordsFound: number;
  recordsSaved: number;
  duplicatesSkipped: number;
  eliteCount: number;
  refinedCount: number;
  rockCount: number;
  errors: string[];
}

// ── Main pipeline entry point ──────────────────────────────────────────────

export async function runPropertyMiningPipeline(
  job: MiningJob,
  searchArea: SearchArea
): Promise<PropertyMiningResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  // ── Phase 1: Fetch county records ──────────────────────────────────────
  await updateJobPhase(supabase, job.id, "fetching");

  const fetchResult = await fetchCountyRecords(searchArea, { limit: 1000 });
  errors.push(...fetchResult.errors);

  if (fetchResult.records.length === 0) {
    await failJob(supabase, job.id, "No records returned from county data source.");
    return {
      jobId: job.id,
      recordsFound: 0,
      recordsSaved: 0,
      duplicatesSkipped: 0,
      eliteCount: 0,
      refinedCount: 0,
      rockCount: 0,
      errors,
    };
  }

  await updateJobProgress(supabase, job.id, { records_found: fetchResult.records.length });

  // ── Phase 2: Score + grade ─────────────────────────────────────────────
  await updateJobPhase(supabase, job.id, "scoring");

  // Apply search area filters (property type, equity, years owned)
  const filtered = applySearchAreaFilters(fetchResult.records.map(r => ({ record: r, breakdown: null as never, yearsOwned: null, isAbsenteeOwner: false })), searchArea);
  const scored = scoreBatch(filtered.map(r => r.record));

  await updateJobPhase(supabase, job.id, "grading");

  const elite   = scored.filter((s) => s.breakdown.grade === "elite");
  const refined = scored.filter((s) => s.breakdown.grade === "refined");
  const rock    = scored.filter((s) => s.breakdown.grade === "rock");

  await updateJobProgress(supabase, job.id, {
    records_graded: scored.length,
    elite_count:    elite.length,
    refined_count:  refined.length,
    rock_count:     rock.length,
  });

  // ── Phase 3: Save to database ──────────────────────────────────────────
  await updateJobPhase(supabase, job.id, "saving");

  // Only save elite + refined — rocks not worth storing
  const toSave = [...elite, ...refined];
  let saved = 0;
  let duplicates = 0;

  for (const batch of chunk(toSave, 50)) {
    const rows = batch.map((s) => buildLeadRow(s, job, searchArea));

    const { data, error } = await supabase
      .from("leads")
      .upsert(rows, {
        onConflict: "external_property_id",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      errors.push(`Save batch failed: ${error.message}`);
    } else {
      saved += data?.length ?? 0;
      duplicates += batch.length - (data?.length ?? 0);
    }
  }

  // ── Phase 4: Complete job + send notification ──────────────────────────
  await supabase
    .from("mining_jobs")
    .update({
      status:             "complete",
      phase:              "complete",
      records_saved:      saved,
      duplicates_skipped: duplicates,
      completed_at:       new Date().toISOString(),
    })
    .eq("id", job.id);

  // Update search area last_mined_at + total_leads
  await supabase
    .from("search_areas")
    .update({
      last_mined_at: new Date().toISOString(),
      total_leads:   saved,
    })
    .eq("id", searchArea.id);

  // Fire in-app notification
  await supabase.from("notifications").insert({
    realtor_id: job.realtor_id,
    type:       "mining_complete",
    title:      `Mining complete — ${searchArea.name}`,
    body:       `Found ${saved} opportunity leads. ${elite.length} Elite Gems, ${refined.length} Refined.`,
    metadata: {
      job_id:        job.id,
      search_area:   searchArea.name,
      lead_count:    saved,
      elite_count:   elite.length,
      refined_count: refined.length,
    },
    read: false,
  });

  return {
    jobId:             job.id,
    recordsFound:      fetchResult.records.length,
    recordsSaved:      saved,
    duplicatesSkipped: duplicates,
    eliteCount:        elite.length,
    refinedCount:      refined.length,
    rockCount:         rock.length,
    errors,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function applySearchAreaFilters(
  records: ScoredPropertyRecord[],
  area: SearchArea
): ScoredPropertyRecord[] {
  return records.filter((r) => {
    if (area.property_types.length > 0) {
      const rType = r.record.property_type ?? "";
      if (!area.property_types.some((t) => rType.includes(t))) return false;
    }
    return true;
  });
}

function buildLeadRow(
  scored: ScoredPropertyRecord,
  job: MiningJob,
  area: SearchArea
) {
  const { record, breakdown, yearsOwned, isAbsenteeOwner } = scored;
  return {
    // Lead identity — use owner name or property address as fallback
    email:         `property+${record.external_property_id ?? slugify(record.property_address)}@leadmine.local`,
    business_name: record.owner_name ?? null,
    name:          record.owner_name ?? null,
    phone:         null,
    source:        "county_assessor",
    intent:        breakdown.opportunity_type,
    score:         breakdown.score,
    gem_grade:     breakdown.grade,

    // Property fields (from migration 007)
    property_address:      record.property_address,
    property_city:         record.property_city,
    property_state:        record.property_state,
    property_zip:          record.property_zip,
    property_county:       record.property_county,
    property_type:         record.property_type ?? null,
    owner_name:            record.owner_name ?? null,
    owner_mailing_address: record.owner_mailing_address ?? null,
    owner_mailing_city:    record.owner_mailing_city ?? null,
    owner_mailing_state:   record.owner_mailing_state ?? null,
    owner_mailing_zip:     record.owner_mailing_zip ?? null,
    is_absentee_owner:     isAbsenteeOwner,
    is_owner_occupied:     !isAbsenteeOwner,
    years_owned:           yearsOwned,
    last_sale_date:        record.last_sale_date ?? null,
    last_sale_price:       record.last_sale_price ?? null,
    assessed_value:        record.assessed_value ?? null,
    estimated_value:       record.estimated_value ?? null,
    estimated_equity:      record.estimated_equity ?? null,
    equity_percent:        record.equity_percent ?? null,
    opportunity_type:      breakdown.opportunity_type,
    opportunity_score:     breakdown.score,
    signal_flags:          breakdown.flags,
    data_source:           record.data_source ?? "county_assessor",
    external_property_id:  record.external_property_id ?? null,
    raw_property_data:     record.raw_data ?? null,
    search_area_id:        area.id,

    // Required pipeline defaults
    stage:       "new",
    tags:        breakdown.flags,
    enrichment_data: { reasons: breakdown.reasons },
  };
}

async function updateJobPhase(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string,
  phase: string
) {
  await supabase
    .from("mining_jobs")
    .update({ phase, status: "running", started_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function updateJobProgress(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string,
  fields: Record<string, unknown>
) {
  await supabase.from("mining_jobs").update(fields).eq("id", jobId);
}

async function failJob(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string,
  message: string
) {
  await supabase
    .from("mining_jobs")
    .update({ status: "failed", error_message: message, completed_at: new Date().toISOString() })
    .eq("id", jobId);
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
