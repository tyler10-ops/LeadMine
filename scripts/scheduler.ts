/**
 * LeadMine Auto-Mining Scheduler
 *
 * Runs on Mac Mini via PM2. Every INTERVAL_HOURS it:
 *   1. Queries all active clients that have search_areas configured
 *   2. Queues a property-mining job for each area
 *   3. Logs the schedule run to activity_log
 *
 * Start with:
 *   npx tsx scripts/scheduler.ts
 *
 * PM2:
 *   pm2 start scripts/scheduler.ts --interpreter npx --interpreter-args tsx --name leadmine-scheduler
 *
 * Requires env vars:
 *   UPSTASH_REDIS_URL
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { Queue } from "bullmq";
import { getRedisConnection } from "../src/lib/queue/connection";
import { RedditScraper }     from "../src/lib/mining/scrapers/reddit";
import { CraigslistScraper } from "../src/lib/mining/scrapers/craigslist";
import type { SocialSignalRecord } from "../src/lib/mining/scrapers/reddit";

// ── Config ────────────────────────────────────────────────────────────────────

const INTERVAL_HOURS = 6;
const INTERVAL_MS    = INTERVAL_HOURS * 60 * 60 * 1000;
const QUEUE_NAME     = "leadmine-property-mining";

// ── Supabase service client ───────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchArea {
  id:             string;
  realtor_id:     string; // client_id
  counties:       string[];
  state:          string;
  zip_codes:      string[] | null;
  property_types: string[] | null;
  min_years_owned: number | null;
  min_equity_pct:  number | null;
}

// ── Schedule run ──────────────────────────────────────────────────────────────

async function runSchedule() {
  const runAt = new Date().toISOString();
  console.log(`\n[scheduler] Run started at ${runAt}`);

  const supabase   = getSupabase();
  const miningQueue = new Queue(QUEUE_NAME, { connection: getRedisConnection() });

  let queued = 0;
  let errors = 0;

  try {
    // Fetch all search areas for clients that haven't been mined recently
    const cutoff = new Date(Date.now() - INTERVAL_MS).toISOString();

    const { data: areas, error } = await supabase
      .from("search_areas")
      .select("id, realtor_id, counties, state, zip_codes, property_types, min_years_owned, min_equity_pct, last_mined_at")
      .or(`last_mined_at.is.null,last_mined_at.lt.${cutoff}`)
      .limit(50);

    if (error) {
      console.error("[scheduler] Failed to fetch search areas:", error.message);
      return;
    }

    if (!areas || areas.length === 0) {
      console.log("[scheduler] No search areas due for mining.");
      return;
    }

    console.log(`[scheduler] ${areas.length} search area(s) due for mining`);

    for (const area of areas as SearchArea[]) {
      try {
        await miningQueue.add(
          "scheduled-mining",
          {
            clientId:      area.realtor_id,
            counties:      area.counties,
            state:         area.state,
            propertyTypes: area.property_types ?? ["residential"],
            zipCodes:      area.zip_codes ?? [],
            minYearsOwned: area.min_years_owned ?? 0,
            minEquityPct:  area.min_equity_pct ?? 0,
          },
          {
            attempts:    3,
            backoff:     { type: "exponential", delay: 60_000 },
            removeOnComplete: { count: 100 },
            removeOnFail:     { count: 50 },
          }
        );

        // Update last_mined_at so it won't re-queue immediately
        await supabase
          .from("search_areas")
          .update({ last_mined_at: new Date().toISOString() })
          .eq("id", area.id);

        // Log to activity feed for the realtor
        const { data: clientRow } = await supabase
          .from("clients")
          .select("user_id")
          .eq("id", area.realtor_id)
          .single();

        if (clientRow?.user_id) {
          await supabase.from("activity_log").insert({
            user_id:    clientRow.user_id,
            client_id:  area.realtor_id,
            event_type: "mine_started",
            title:      `Auto-mining started — ${area.counties.join(", ")}, ${area.state}`,
            description: `Scheduled every ${INTERVAL_HOURS}h`,
            icon:       "pickaxe",
            severity:   "info",
            metadata:   { counties: area.counties, state: area.state, triggeredBy: "scheduler" },
          });
        }

        // ── Social signal scraping (Reddit + Craigslist) ─────────────────
        try {
          const location = `${area.counties[0] ?? ""}, ${area.state}`.trim();
          const [redditResults, clResults] = await Promise.allSettled([
            new RedditScraper().scrape(location),
            new CraigslistScraper().scrape(location),
          ]);

          const signals: SocialSignalRecord[] = [
            ...(redditResults.status     === "fulfilled" ? redditResults.value     : []),
            ...(clResults.status === "fulfilled" ? clResults.value : []),
          ];

          if (signals.length > 0) {
            const rows = signals.map((s) => ({
              client_id:        area.realtor_id,
              email:            `${s.sourceId}@leadmine.social`,
              source:           s.source,
              intent:           s.signalType === "seller_intent" ? "seller" : "buyer",
              score:            s.score,
              gem_grade:        s.score >= 70 ? "elite" : s.score >= 45 ? "refined" : "rock",
              business_name:    s.title,
              phone:            s.phone,
              property_city:    s.city,
              property_state:   s.state,
              opportunity_type: s.signalType,
              signal_flags:     s.keywords,
              stage:            "new",
              tags:             [s.source, s.signalType],
              enrichment_data:  { body: s.body, url: s.url, author: s.author, postedAt: s.postedAt, keywords: s.keywords },
              data_source:      s.source,
            }));

            await supabase.from("leads").upsert(rows, { onConflict: "email", ignoreDuplicates: true });
            console.log(`[scheduler] Social signals: ${signals.length} found, saved for ${location}`);
          }
        } catch (socialErr) {
          console.warn(`[scheduler] Social scraping failed (non-fatal):`, socialErr);
        }

        queued++;
        console.log(`[scheduler] Queued: ${area.counties.join(", ")}, ${area.state} (client: ${area.realtor_id})`);
      } catch (jobErr) {
        errors++;
        console.error(`[scheduler] Failed to queue area ${area.id}:`, jobErr);
      }
    }
  } finally {
    await miningQueue.close();
    console.log(`[scheduler] Run complete — ${queued} queued, ${errors} errors`);
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

console.log("─────────────────────────────────────────");
console.log(`  LeadMine Scheduler (every ${INTERVAL_HOURS}h)`);
console.log("─────────────────────────────────────────");

// Run immediately on startup, then on interval
runSchedule().catch(console.error);
setInterval(() => {
  runSchedule().catch(console.error);
}, INTERVAL_MS);

// Graceful shutdown
process.on("SIGINT",  () => { console.log("\n[scheduler] Stopped."); process.exit(0); });
process.on("SIGTERM", () => { console.log("\n[scheduler] Stopped."); process.exit(0); });