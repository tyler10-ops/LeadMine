import { Worker, Job } from "bullmq";
import { getRedisConnection } from "./connection";
import type { MiningJobData, ScrapeJobData, PropertyMiningJobData, FollowUpJobData } from "./queues";
import { runMiningPipeline } from "../mining/orchestrator";
import { getScraper } from "../mining/scrapers";
import { fetchCountyRecords } from "../property/county-adapter";
import { scoreBatch } from "../property/scorer";
import { createServiceClient } from "@/lib/supabase/server";
import { sendMiningCompletionPush } from "../notifications/push";
import type { MiningProgress } from "./queues";

const QUEUE_PREFIX = "leadmine-";

// ── Property Mining Worker ────────────────────────────────────────────────────

export function createPropertyMiningWorker(): Worker<PropertyMiningJobData> {
  return new Worker<PropertyMiningJobData>(
    `${QUEUE_PREFIX}property-mining`,
    async (job: Job<PropertyMiningJobData>) => {
      const { clientId, counties, state, propertyTypes, zipCodes = [], minYearsOwned = 0, minEquityPct = 0 } = job.data;
      console.log(`[property-mining] Starting job ${job.id} — ${counties.join(", ")}, ${state}`);

      const progress: MiningProgress = {
        phase: "scraping",
        totalQueries: counties.length,
        completedQueries: 0,
        recordsFound: 0,
        recordsEnriched: 0,
        recordsSaved: 0,
        duplicatesSkipped: 0,
        errors: [],
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await job.updateProgress({ ...progress, phase: "scraping" });

      // Fetch county records
      const fetchResult = await fetchCountyRecords(
        {
          id: job.id ?? "tmp",
          realtor_id: clientId,
          name: `${counties.join(", ")}, ${state}`,
          counties,
          state,
          zip_codes: zipCodes,
          cities: [],
          property_types: propertyTypes as never,
          min_years_owned: minYearsOwned,
          min_equity_pct: minEquityPct,
          opportunity_types: ["seller"],
          last_mined_at: null,
          total_leads: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          min_price: null,
          max_price: null,
          lead_type_preference: "sellers",
          seller_signals: [],
          buyer_signals: [],
          deal_goal: "3-5",
          is_onboarding_profile: false,
        },
        { limit: 500, zipFilter: zipCodes }
      );

      progress.recordsFound = fetchResult.records.length;
      progress.errors.push(...fetchResult.errors);
      console.log(`[property-mining] Fetched ${fetchResult.records.length} records from ${counties.join(", ")}, ${state}`);
      if (fetchResult.errors.length > 0) console.error(`[property-mining] Fetch errors:`, fetchResult.errors);
      await job.updateProgress({ ...progress, phase: "enriching" });

      if (fetchResult.records.length === 0) {
        console.warn(`[property-mining] No records returned — county may not have open data or URL is wrong`);
        return { totalScraped: 0, totalEnriched: 0, totalSaved: 0, duplicatesSkipped: 0, byGrade: { elite: 0, refined: 0, rock: 0 }, errors: progress.errors, durationMs: 0 };
      }

      // Score + grade
      const scored = scoreBatch(fetchResult.records);
      console.log(`[property-mining] Scored ${scored.length} records — elite: ${scored.filter(s=>s.breakdown.grade==="elite").length}, refined: ${scored.filter(s=>s.breakdown.grade==="refined").length}, rock: ${scored.filter(s=>s.breakdown.grade==="rock").length}`);
      await job.updateProgress({ ...progress, phase: "grading" });

      const elite    = scored.filter((s) => s.breakdown.grade === "elite");
      const refined  = scored.filter((s) => s.breakdown.grade === "refined");
      const rock     = scored.filter((s) => s.breakdown.grade === "rock");
      const ungraded = scored.filter((s) => s.breakdown.grade === "ungraded");

      // Log a sample record so we can see what ATTOM fields are populated
      if (scored.length > 0) {
        const sample = scored[0].record;
        console.log(`[property-mining] Sample record:`, JSON.stringify({
          address: sample.property_address,
          owner: sample.owner_name,
          lastSaleDate: sample.last_sale_date,
          lastSalePrice: sample.last_sale_price,
          assessedValue: sample.assessed_value,
          equityPct: sample.equity_percent,
          absentee: sample.owner_mailing_zip,
        }, null, 2));
      }

      if (ungraded.length > 0) {
        console.log(`[property-mining] ${ungraded.length} ungraded (sparse data — saving as rock)`);
      }

      await job.updateProgress({ ...progress, phase: "saving" });

      // Save all graded records — ungraded saved as rock when data is sparse
      const supabase = createServiceClient();
      const allToSave = [...elite, ...refined, ...rock, ...ungraded];

      // Deduplicate against existing leads by external_property_id
      const externalIds = allToSave
        .map(s => s.record.external_property_id)
        .filter(Boolean) as string[];

      const { data: existing } = await supabase
        .from("leads")
        .select("external_property_id")
        .in("external_property_id", externalIds);

      const existingIds = new Set((existing ?? []).map((r: { external_property_id: string }) => r.external_property_id));
      const toSave = allToSave.filter(s =>
        !s.record.external_property_id || !existingIds.has(s.record.external_property_id)
      );
      let saved = 0;
      let dupes  = 0;

      for (let i = 0; i < toSave.length; i += 50) {
        const batch = toSave.slice(i, i + 50);
        const rows  = batch.map((s) => ({
          client_id:             clientId,
          email:                 `property+${s.record.external_property_id ?? slugify(s.record.property_address)}@leadmine.local`,
          business_name:         s.record.owner_name ?? null,
          phone:                 null,
          source:                "county_assessor",
          intent:                s.breakdown.opportunity_type,
          score:                 s.breakdown.score,
          gem_grade:             s.breakdown.grade === "ungraded" ? "rock" : s.breakdown.grade,
          property_address:      s.record.property_address,
          property_city:         s.record.property_city,
          property_state:        s.record.property_state,
          property_zip:          s.record.property_zip,
          property_county:       s.record.property_county,
          property_type:         s.record.property_type ?? null,
          owner_name:            s.record.owner_name ?? null,
          owner_mailing_address: s.record.owner_mailing_address ?? null,
          owner_mailing_city:    s.record.owner_mailing_city ?? null,
          owner_mailing_state:   s.record.owner_mailing_state ?? null,
          owner_mailing_zip:     s.record.owner_mailing_zip ?? null,
          is_absentee_owner:     s.isAbsenteeOwner,
          years_owned:           s.yearsOwned,
          last_sale_date:        s.record.last_sale_date ?? null,
          last_sale_price:       s.record.last_sale_price ?? null,
          assessed_value:        s.record.assessed_value ?? null,
          estimated_equity:      s.record.estimated_equity ?? null,
          equity_percent:        s.record.equity_percent ?? null,
          opportunity_type:      s.breakdown.opportunity_type,
          opportunity_score:     s.breakdown.score,
          signal_flags:          s.breakdown.flags,
          data_source:           "county_assessor",
          external_property_id:  s.record.external_property_id ?? null,
          stage:                 "new",
          tags:                  s.breakdown.flags,
          enrichment_data:       { reasons: s.breakdown.reasons },
        }));

        const { data, error } = await supabase
          .from("leads")
          .insert(rows)
          .select("id");

        if (error) {
          console.error(`[property-mining] Batch save failed:`, error.message, error.details ?? "");
          progress.errors.push(`Batch save failed: ${error.message}`);
        } else {
          saved += data?.length ?? 0;
          dupes  += batch.length - (data?.length ?? 0);
        }
      }

      progress.recordsSaved      = saved;
      progress.duplicatesSkipped = dupes;
      await job.updateProgress({ ...progress, phase: "complete" });

      console.log(`[property-mining] Job ${job.id} complete — ${saved} leads saved (${elite.length} elite, ${refined.length} refined)`);

      // ── Post-completion: log activity + push notification ──────────────────
      try {
        // Resolve user_id for this client
        const { data: clientRow } = await supabase
          .from("clients")
          .select("user_id")
          .eq("id", clientId)
          .single();

        const locationLabel = `${counties.join(", ")}, ${state}`;

        if (clientRow?.user_id) {
          // Log to activity feed
          await supabase.from("activity_log").insert({
            user_id:    clientRow.user_id,
            client_id:  clientId,
            event_type: "mine_completed",
            title:      `Mining complete — ${saved} lead${saved !== 1 ? "s" : ""} saved`,
            description: `${elite.length} elite · ${refined.length} refined from ${locationLabel}`,
            icon:       "gem",
            severity:   saved > 0 ? "success" : "info",
            metadata:   { eliteCount: elite.length, refinedCount: refined.length, totalSaved: saved, location: locationLabel, jobId: job.id },
          });

          // Push notification if client has subscriptions
          if (saved > 0) {
            const { data: subs } = await supabase
              .from("push_subscriptions")
              .select("endpoint, p256dh, auth")
              .eq("client_id", clientId);

            if (subs && subs.length > 0) {
              await Promise.allSettled(
                subs.map((sub: { endpoint: string; p256dh: string; auth: string }) =>
                  sendMiningCompletionPush(sub, {
                    eliteCount: elite.length,
                    totalSaved: saved,
                    location:   locationLabel,
                  })
                )
              );
            }
          }
        }
      } catch (notifyErr) {
        console.warn(`[property-mining] Post-completion notification failed (non-fatal):`, notifyErr);
      }
      // ───────────────────────────────────────────────────────────────────────

      return {
        totalScraped:      fetchResult.records.length,
        totalEnriched:     scored.length,
        totalSaved:        saved,
        duplicatesSkipped: dupes,
        byGrade:           { elite: elite.length, refined: refined.length, rock: rock.length },
        errors:            progress.errors,
        durationMs:        Date.now() - new Date(progress.startedAt).getTime(),
      };
    },
    {
      connection:  getRedisConnection(),
      concurrency: 2,
    }
  );
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
}

// ── Follow-Up Sequence Worker ─────────────────────────────────────────────────

import { executeEmailStep, executeCallStep, executeSmsStep, executeRescoreStep } from "@/lib/followup/actions";

export function createFollowUpWorker(): Worker<FollowUpJobData> {
  return new Worker<FollowUpJobData>(
    `${QUEUE_PREFIX}followup`,
    async (job: Job<FollowUpJobData>) => {
      const { leadId, realtorId, step, channel, followUpActivityId } = job.data;
      console.log(`[followup] Step ${step} (${channel}) for lead ${leadId}`);

      const supabase = createServiceClient();

      // If this step had a DB activity row, check it's still pending (not cancelled)
      if (followUpActivityId) {
        const { data: activity } = await supabase
          .from("follow_up_activities")
          .select("status")
          .eq("id", followUpActivityId)
          .single();

        if (!activity || activity.status !== "pending") {
          console.log(`[followup] Step ${step} skipped — activity status: ${activity?.status ?? "not found"}`);
          return { skipped: true };
        }
      }

      let result: Record<string, unknown> = {};

      if (channel === "email")   result = await executeEmailStep(leadId, realtorId, supabase);
      if (channel === "call")    result = await executeCallStep(leadId, realtorId, supabase);
      if (channel === "sms")     result = await executeSmsStep(leadId, realtorId, supabase);
      if (channel === "rescore") result = await executeRescoreStep(leadId, realtorId, supabase);

      // Mark activity as sent/completed
      if (followUpActivityId) {
        const isSkipped = !!result.skipped;
        await supabase
          .from("follow_up_activities")
          .update({
            status:       isSkipped ? "failed" : "sent",
            completed_at: new Date().toISOString(),
            content:      isSkipped ? String(result.skipped) : undefined,
          })
          .eq("id", followUpActivityId);
      }

      console.log(`[followup] Step ${step} (${channel}) done:`, result);
      return result;
    },
    {
      connection:  getRedisConnection(),
      concurrency: 5,
      limiter: {
        max:      10,
        duration: 60_000, // max 10 outreach actions per minute across all workers
      },
    }
  );
}

/**
 * Create the mining orchestration worker.
 * Processes top-level mining jobs by running the full pipeline.
 */
export function createMiningWorker(): Worker<MiningJobData> {
  return new Worker<MiningJobData>(
    `${QUEUE_PREFIX}mining`,
    async (job: Job<MiningJobData>) => {
      console.log(`[mining] Starting job ${job.id} for client ${job.data.clientId}`);
      const result = await runMiningPipeline(job);
      console.log(`[mining] Job ${job.id} complete:`, result);
      return result;
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
      limiter: {
        max: 5,
        duration: 60_000, // 5 jobs per minute max
      },
    }
  );
}

/**
 * Create the scrape sub-task worker.
 * Processes individual query+location scrape tasks.
 */
export function createScrapeWorker(): Worker<ScrapeJobData> {
  return new Worker<ScrapeJobData>(
    `${QUEUE_PREFIX}scrape`,
    async (job: Job<ScrapeJobData>) => {
      const { scraperName, query, location } = job.data;
      console.log(`[scrape] ${scraperName}: "${query}" in ${location}`);

      const scraper = getScraper(scraperName);
      const records = await scraper.scrape(query, location);

      console.log(`[scrape] Found ${records.length} records`);
      return records;
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 60_000, // 10 scrape jobs per minute
      },
    }
  );
}
