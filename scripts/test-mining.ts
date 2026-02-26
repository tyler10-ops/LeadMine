/**
 * E2E Test Script — Mining Pipeline
 *
 * Adds a test mining job for roofing vertical in Baltimore, MD,
 * then polls for completion and prints the result summary.
 *
 * Run with: npx tsx scripts/test-mining.ts
 *
 * Requires env vars:
 *   UPSTASH_REDIS_URL
 *   GOOGLE_PLACES_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { getMiningQueue } from "../src/lib/queue/queues";
import { closeRedisConnection } from "../src/lib/queue/connection";

const POLL_INTERVAL_MS = 5_000;
const MAX_WAIT_MS = 3 * 60 * 1_000; // 3 minutes

// Verify required env vars
const required = [
  "UPSTASH_REDIS_URL",
  "GOOGLE_PLACES_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

async function main() {
  const queue = getMiningQueue();

  // Add a test mining job
  const job = await queue.add("test-roofing-baltimore", {
    clientId: "00000000-0000-0000-0000-000000000000", // placeholder test client
    verticalId: "roofing",
    locations: ["Baltimore, MD"],
  });

  console.log("─────────────────────────────────────────");
  console.log("  Mining E2E Test");
  console.log("─────────────────────────────────────────");
  console.log(`Job ID:     ${job.id}`);
  console.log(`Vertical:   roofing`);
  console.log(`Location:   Baltimore, MD`);
  console.log("─────────────────────────────────────────");
  console.log("Polling for completion...\n");

  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    // Re-fetch job state
    const current = await queue.getJob(job.id!);
    if (!current) {
      console.error("Job not found — it may have been removed.");
      break;
    }

    const state = await current.getState();
    const progress = current.progress as Record<string, unknown> | undefined;

    if (progress && typeof progress === "object") {
      const phase = progress.phase ?? "unknown";
      const found = progress.recordsFound ?? 0;
      const enriched = progress.recordsEnriched ?? 0;
      const saved = progress.recordsSaved ?? 0;
      const dupes = progress.duplicatesSkipped ?? 0;
      const errCount = Array.isArray(progress.errors) ? progress.errors.length : 0;
      console.log(
        `  [${state}] phase=${phase}  found=${found}  enriched=${enriched}  saved=${saved}  dupes=${dupes}  errors=${errCount}`
      );
    } else {
      console.log(`  [${state}] waiting...`);
    }

    if (state === "completed") {
      const result = current.returnvalue;
      console.log("\n=========================================");
      console.log("  MINING JOB COMPLETED");
      console.log("=========================================");
      console.log(JSON.stringify(result, null, 2));
      console.log("=========================================\n");
      break;
    }

    if (state === "failed") {
      console.error("\nJob FAILED.");
      console.error("Reason:", current.failedReason);
      break;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  if (Date.now() - startTime >= MAX_WAIT_MS) {
    console.error("\nTimed out after 3 minutes. Job may still be running.");
  }

  await closeRedisConnection();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
