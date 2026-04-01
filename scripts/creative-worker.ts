/**
 * LeadMine Creative Worker
 *
 * Runs on a schedule to automatically generate on-brand social media creatives,
 * ads, and articles using Claude (content planning) + Flux via Replicate (images)
 * + sharp (text compositing) + Luma Dream Machine (video animation).
 *
 * Outputs are saved locally to ./output/creatives/ and persisted to Supabase.
 *
 * Start manually:  npx tsx scripts/creative-worker.ts
 * PM2 (scheduled): pm2 start ecosystem.creative.config.cjs
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   REPLICATE_API_TOKEN
 *   LUMAAI_API_KEY            (optional — enables video)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import path from "path";
import fs   from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

import { createClient }         from "@supabase/supabase-js";
import { generateContentPlan }  from "../src/lib/creative/content-plan";
import { compositeCreative }    from "../src/lib/creative/compositor";
import LumaAI                   from "lumaai";

// ── Config ─────────────────────────────────────────────────────────────────

const OUTPUT_DIR     = path.resolve(__dirname, "../output/creatives");
const REPLICATE_API  = "https://api.replicate.com/v1";
const FLUX_MODEL     = "black-forest-labs/flux-1.1-pro";
const BATCH_SIZE     = 6;    // creatives per run
const ANIMATE_COUNT  = 2;    // how many to also animate with Luma per run

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const luma = process.env.LUMAAI_API_KEY
  ? new LumaAI({ authToken: process.env.LUMAAI_API_KEY })
  : null;

// ── Platform → Replicate aspect ratio map ─────────────────────────────────

const PLATFORM_ASPECT: Record<string, string> = {
  instagram_post:  "4:5",
  instagram_story: "9:16",
  facebook_feed:   "16:9",
  facebook_square: "1:1",
  article_header:  "16:9",
};

// ── Main run ───────────────────────────────────────────────────────────────

async function run() {
  console.log("\n────────────────────────────────────────");
  console.log("  LeadMine Creative Worker");
  console.log(`  ${new Date().toLocaleString()}`);
  console.log("────────────────────────────────────────\n");

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Generate content plan via Claude
  console.log(`[plan] Generating ${BATCH_SIZE} content pieces with Claude…`);
  const plans = await generateContentPlan(BATCH_SIZE);
  console.log(`[plan] Got ${plans.length} plans\n`);

  const results: { id: string; imageUrl: string; videoUrl?: string }[] = [];

  for (const [idx, plan] of plans.entries()) {
    const label = `[${idx + 1}/${plans.length}] ${plan.platform} — ${plan.headline}`;
    console.log(label);

    try {
      // 2. Generate image via Replicate Flux
      console.log("  ↳ Generating image…");
      const imageUrl = await generateImage(plan.imagePrompt, PLATFORM_ASPECT[plan.platform] ?? "1:1");
      if (!imageUrl) { console.warn("  ✗ Image generation failed, skipping"); continue; }

      // 3. Download image buffer
      const imageRes    = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

      // 4. Composite text overlay
      console.log("  ↳ Compositing text overlay…");
      const composited = await compositeCreative(plan, imageBuffer);

      // 5. Save locally
      const filename = `${plan.id ?? `creative-${Date.now()}`}.jpg`;
      const filepath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filepath, composited);
      console.log(`  ↳ Saved → ${filename}`);

      // 6. Save article markdown if applicable
      if (plan.type === "article" && plan.articleBody) {
        const articleFile = path.join(OUTPUT_DIR, `${plan.id}.md`);
        const mdContent = `# ${plan.headline}\n\n${plan.subheadline ? `*${plan.subheadline}*\n\n` : ""}${plan.articleBody}`;
        fs.writeFileSync(articleFile, mdContent);
        console.log(`  ↳ Article saved → ${plan.id}.md`);
      }

      // 7. Animate with Luma (first N creatives that aren't stories/articles)
      let videoUrl: string | undefined;
      if (
        luma &&
        results.length < ANIMATE_COUNT &&
        plan.type !== "article" &&
        plan.platform !== "instagram_story"
      ) {
        console.log("  ↳ Animating with Luma Dream Machine…");
        videoUrl = await animateImage(imageUrl, plan.headline) ?? undefined;
        if (videoUrl) console.log("  ↳ Video ready");
      }

      // 8. Persist to Supabase
      await supabase.from("ad_creatives").insert({
        county:       "LeadMine",
        state:        "Brand",
        lead_type:    plan.type,
        equity_band:  plan.platform,
        property_type: plan.type,
        lead_count:   0,
        copy: {
          headlines:   [plan.headline],
          primaryText: [plan.body ?? ""],
          ctas:        [plan.cta],
          localHook:   plan.subheadline ?? "",
          hashtags:    plan.hashtags ?? [],
          articleBody: plan.articleBody ?? "",
        },
        images: [{ url: imageUrl, variant: plan.platform, composited: true }],
        platforms: [plan.platform],
        status: "complete",
      }).then(({ error }) => {
        if (error) console.warn("  ⚠ Supabase insert failed:", error.message);
      });

      results.push({ id: plan.id, imageUrl, videoUrl });
      console.log("  ✓ Done\n");
    } catch (err) {
      console.error(`  ✗ Error:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`  Run complete. ${results.length}/${plans.length} creatives generated.`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`────────────────────────────────────────\n`);
}

// ── Image generation via Replicate ─────────────────────────────────────────

async function generateImage(prompt: string, aspectRatio: string): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) { console.warn("  REPLICATE_API_TOKEN not set"); return null; }

  try {
    const res = await fetch(`${REPLICATE_API}/models/${FLUX_MODEL}/predictions`, {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait=60",
      },
      body: JSON.stringify({
        input: { prompt, aspect_ratio: aspectRatio, output_format: "webp", output_quality: 90 },
      }),
    });

    const prediction = await res.json();
    if (prediction.status === "succeeded" && prediction.output) {
      return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    }

    // Poll fallback
    if (prediction.id) {
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        const poll = await fetch(`${REPLICATE_API}/predictions/${prediction.id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }).then(r => r.json());
        if (poll.status === "succeeded" && poll.output) {
          return Array.isArray(poll.output) ? poll.output[0] : poll.output;
        }
        if (poll.status === "failed") break;
      }
    }
  } catch (err) {
    console.error("  Replicate error:", err);
  }
  return null;
}

// ── Luma animation ─────────────────────────────────────────────────────────

async function animateImage(imageUrl: string, prompt: string): Promise<string | null> {
  if (!luma) return null;
  try {
    const gen = await luma.generations.create({
      model: "ray-2",
      prompt: `${prompt} — smooth cinematic camera movement, subtle and elegant`,
      keyframes: { frame0: { type: "image", url: imageUrl } },
    });

    let result = gen;
    for (let i = 0; i < 60; i++) {
      if (result.state === "completed") break;
      if (result.state === "failed")    return null;
      await sleep(3000);
      result = await luma.generations.get(gen.id!);
    }

    return result.state === "completed" ? result.assets?.video ?? null : null;
  } catch (err) {
    console.warn("  Luma error:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ── Utils ──────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Entry point ────────────────────────────────────────────────────────────

run().catch(err => {
  console.error("Creative worker crashed:", err);
  process.exit(1);
});