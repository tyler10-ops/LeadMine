/**
 * Lead Mine Worker Process
 *
 * Runs BullMQ workers that process mining and scraping jobs.
 * Start with: npx tsx scripts/worker.ts
 *
 * Requires env vars:
 *   UPSTASH_REDIS_URL
 *   GOOGLE_PLACES_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
import { createMiningWorker, createScrapeWorker, createPropertyMiningWorker, createFollowUpWorker } from "../src/lib/queue/workers";
import { closeRedisConnection } from "../src/lib/queue/connection";

console.log("─────────────────────────────────────────");
console.log("  Lead Mine Worker starting...");
console.log("─────────────────────────────────────────");

const miningWorker         = createMiningWorker();
const scrapeWorker         = createScrapeWorker();
const propertyMiningWorker = createPropertyMiningWorker();
const followUpWorker       = createFollowUpWorker();

miningWorker.on("completed", (job) => {
  console.log(`✓ Mining job ${job.id} completed`);
});

miningWorker.on("failed", (job, err) => {
  console.error(`✗ Mining job ${job?.id} failed:`, err.message);
});

scrapeWorker.on("completed", (job) => {
  console.log(`✓ Scrape job ${job.id} completed`);
});

scrapeWorker.on("failed", (job, err) => {
  console.error(`✗ Scrape job ${job?.id} failed:`, err.message);
});

propertyMiningWorker.on("completed", (job) => {
  console.log(`✓ Property mining job ${job.id} completed`);
});

propertyMiningWorker.on("failed", (job, err) => {
  console.error(`✗ Property mining job ${job?.id} failed:`, err.message);
});

followUpWorker.on("completed", (job) => {
  console.log(`✓ Follow-up job ${job.id} completed`);
});

followUpWorker.on("failed", (job, err) => {
  console.error(`✗ Follow-up job ${job?.id} failed:`, err.message);
});

console.log("Workers are running. Press Ctrl+C to stop.");

// Graceful shutdown
async function shutdown() {
  console.log("\nShutting down workers...");
  await Promise.all([
    miningWorker.close(),
    scrapeWorker.close(),
    propertyMiningWorker.close(),
    followUpWorker.close(),
  ]);
  await closeRedisConnection();
  console.log("Workers stopped.");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
