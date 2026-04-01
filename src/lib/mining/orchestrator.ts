import { Job } from "bullmq";
import type { MiningJobData, MiningProgress } from "../queue/queues";
import { getVertical } from "./verticals";
import { getScraper, type RawBusinessRecord } from "./scrapers";
import { enrichBatch, type EnrichedRecord } from "./enrichment";
import { gradeBatch, type GradedRecord } from "./grading";
import { createServiceClient } from "@/lib/supabase/server";

/** Final result returned when a mining job completes. */
export interface MiningResult {
  totalScraped: number;
  totalEnriched: number;
  totalSaved: number;
  duplicatesSkipped: number;
  byGrade: { elite: number; refined: number; rock: number };
  errors: string[];
  durationMs: number;
}

/**
 * Run the full mining pipeline for a job:
 * 1. Scrape all query+location combos via the configured scrapers
 * 2. Enrich new records (dedup + website scrape)
 * 3. Grade and classify
 * 4. Save to Supabase
 */
export async function runMiningPipeline(
  job: Job<MiningJobData>
): Promise<MiningResult> {
  const startTime = Date.now();
  const { clientId, verticalId, locations, scrapers: scraperNames } = job.data;
  const vertical = getVertical(verticalId);
  const activeScrapers = scraperNames ?? ["google-places"];
  const errors: string[] = [];

  const progress: MiningProgress = {
    phase: "scraping",
    totalQueries: vertical.searchQueries.length * locations.length * activeScrapers.length,
    completedQueries: 0,
    recordsFound: 0,
    recordsEnriched: 0,
    recordsSaved: 0,
    duplicatesSkipped: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await job.updateProgress(progress);

  // ── Phase 1: Scrape ──────────────────────────────────────────────
  const allRawRecords: RawBusinessRecord[] = [];

  for (const scraperName of activeScrapers) {
    const scraper = getScraper(scraperName);

    for (const location of locations) {
      for (const query of vertical.searchQueries) {
        try {
          const records = await scraper.scrape(query, location);
          allRawRecords.push(...records);
          progress.completedQueries++;
          progress.recordsFound = allRawRecords.length;
          progress.updatedAt = new Date().toISOString();
          await job.updateProgress(progress);
        } catch (err) {
          const msg = `Scrape error [${scraperName}] "${query}" in ${location}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(msg);
          errors.push(msg);
          progress.completedQueries++;
          progress.errors = errors;
          await job.updateProgress(progress);
        }
      }
    }
  }

  // Deduplicate raw records within the batch (by sourceId)
  const seen = new Set<string>();
  const uniqueRaw = allRawRecords.filter((r) => {
    const key = `${r.source}:${r.sourceId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[orchestrator] Scraped ${uniqueRaw.length} unique records (${allRawRecords.length} total)`);

  // ── Phase 2: Enrich ──────────────────────────────────────────────
  progress.phase = "enriching";
  await job.updateProgress(progress);

  let enrichedRecords: EnrichedRecord[] = [];
  let duplicateCount = 0;

  try {
    const result = await enrichBatch(uniqueRaw, clientId);
    enrichedRecords = result.enriched;
    duplicateCount = result.duplicateCount;
    progress.recordsEnriched = enrichedRecords.length;
    progress.duplicatesSkipped = duplicateCount;
    progress.updatedAt = new Date().toISOString();
    await job.updateProgress(progress);
  } catch (err) {
    const msg = `Enrichment error: ${err instanceof Error ? err.message : String(err)}`;
    console.error(msg);
    errors.push(msg);
  }

  console.log(`[orchestrator] Enriched ${enrichedRecords.length} records, ${duplicateCount} duplicates skipped`);

  // ── Phase 3: Grade ───────────────────────────────────────────────
  progress.phase = "grading";
  await job.updateProgress(progress);

  const gradedRecords = gradeBatch(enrichedRecords, vertical);

  console.log(`[orchestrator] Graded ${gradedRecords.length} records`);

  // ── Phase 4: Save to Supabase ────────────────────────────────────
  progress.phase = "saving";
  await job.updateProgress(progress);

  const savedCount = await saveLeads(gradedRecords, clientId, verticalId);

  progress.phase = "complete";
  progress.recordsSaved = savedCount;
  progress.updatedAt = new Date().toISOString();
  await job.updateProgress(progress);

  const byGrade = {
    elite: gradedRecords.filter((r) => r.gemGrade === "elite").length,
    refined: gradedRecords.filter((r) => r.gemGrade === "refined").length,
    rock: gradedRecords.filter((r) => r.gemGrade === "rock").length,
  };

  return {
    totalScraped: uniqueRaw.length,
    totalEnriched: enrichedRecords.length,
    totalSaved: savedCount,
    duplicatesSkipped: duplicateCount,
    byGrade,
    errors,
    durationMs: Date.now() - startTime,
  };
}

/** Insert graded records as leads into Supabase. */
async function saveLeads(
  records: GradedRecord[],
  clientId: string,
  verticalId: string
): Promise<number> {
  if (records.length === 0) return 0;

  const supabase = createServiceClient();
  let saved = 0;

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const rows = batch.map((r) => ({
      client_id: clientId,
      business_name: r.record.name,
      email: r.record.enrichedEmails[0] ?? null,
      phone: r.record.enrichedPhones[0] ?? null,
      company_name: r.record.name,
      website: r.record.website ?? null,
      address: r.record.address ?? null,
      city: r.record.city ?? null,
      state: r.record.state ?? null,
      rating: r.record.rating ?? null,
      review_count: r.record.reviewCount ?? null,
      industry: verticalId,
      source: `mined:${r.record.source}`,
      source_url: `${r.record.source}:${r.record.sourceId}`,
      score: r.score,
      gem_grade: r.gemGrade,
      intent: r.intent,
      stage: "new",
      tags: [verticalId, r.record.city, r.record.state].filter(Boolean),
      enrichment_data: {
        zip: r.record.zip,
        photoCount: r.record.photoCount,
        socialLinks: r.record.socialLinks,
        websiteTitle: r.record.websiteTitle,
        websiteDescription: r.record.websiteDescription,
        websiteKeywords: r.record.websiteKeywords,
        allEmails: r.record.enrichedEmails,
        allPhones: r.record.enrichedPhones,
      },
      notes: `Mined from ${r.record.source} | Rating: ${r.record.rating ?? "N/A"} | Reviews: ${r.record.reviewCount ?? 0}`,
    }));

    const { error } = await supabase.from("leads").insert(rows);
    if (error) {
      console.error(`[orchestrator] Insert batch error:`, error.message);
    } else {
      saved += batch.length;
    }
  }

  return saved;
}
