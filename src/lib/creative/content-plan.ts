/**
 * LeadMine Content Persuasion Agent
 *
 * Uses Claude to generate a varied, insight-driven content batch each run.
 * Every piece is rooted in real industry data and speaks directly to a
 * working realtor's pain points, fears, and ambitions.
 *
 * Content angles rotate across:
 *   - Stat-led posts (open with a shocking industry number)
 *   - Pain-point posts (lead with empathy, resolve with LeadMine)
 *   - Outcome posts (show the transformation — before/after)
 *   - Educational articles (authoritative, citable, SEO-friendly)
 *   - Direct ads (clear problem → solution → CTA)
 */

import Anthropic from "@anthropic-ai/sdk";
import { BRAND, type ContentType, type Platform } from "./brand-config";


export interface ContentPlan {
  id:           string;
  type:         ContentType;
  platform:     Platform;
  angle:        string;       // what persuasion angle this piece uses
  imagePrompt:  string;
  headline:     string;
  subheadline?: string;
  body:         string;
  cta:          string;
  hashtags?:    string[];
  articleBody?: string;       // full markdown article — article type only
  statUsed?:    string;       // which stat was featured, if any
}

// ── Content angles to rotate through ───────────────────────────────────────

const ANGLES = [
  "stat-shock",      // lead with a surprising industry statistic
  "pain-empathy",    // open with a pain point the realtor feels daily
  "outcome-story",   // paint the before/after transformation
  "fear-of-missing", // what they're losing every day without LeadMine
  "direct-ad",       // clean problem → solution → CTA
  "education",       // teach something valuable, position LeadMine as the solution
] as const;

// ── Main generator ──────────────────────────────────────────────────────────

export async function generateContentPlan(count = 6): Promise<ContentPlan[]> {
  // Pick varied angles for this batch
  const selectedAngles = pickVaried(ANGLES as unknown as string[], count);

  // Pick stats and pain points to feature
  const stats      = pickVaried(BRAND.industryStats.map(s => `${s.stat} — ${s.context} (${s.source})`), 3);
  const painPoints = pickVaried(BRAND.painPoints as unknown as string[], 3);
  const outcomes   = pickVaried(BRAND.outcomes as unknown as string[], 2);

  const systemPrompt = `
You are the content strategist and copywriter for LeadMine — an AI-powered lead follow-up platform built specifically for real estate agents.

YOUR MISSION: Create content that makes working realtors stop scrolling, feel understood, and want to try LeadMine.

ABOUT LEADMINE:
${BRAND.product.corePurpose}

Key features:
${BRAND.product.keyFeatures.map(f => `• ${f}`).join("\n")}

ABOUT THE AUDIENCE:
• ${BRAND.audience.primary}
• Mindset: ${BRAND.audience.mindset}
• Fears: ${BRAND.audience.fears.join(", ")}
• Desires: ${BRAND.audience.desires.join(", ")}

VISUAL AESTHETIC FOR IMAGE PROMPTS:
${BRAND.aesthetic.join(", ")}
Avoid: ${BRAND.avoid.join(", ")}
Images should feel premium, cinematic, and aspirational — never generic stock.
Think: a realtor looking at glowing data on a dark screen, architectural detail of a luxury listing shot at night, abstract data flows with light trails, a phone call visualization in dark space.

WRITING RULES:
• Open with empathy or a provocative fact — never with a product pitch
• Use real statistics to add authority (provided below)
• Speak to realtors like a peer who gets it — not like a vendor
• Headlines should create curiosity or confirm a feeling they already have
• Body copy should feel like insight, not a sales pitch
• CTAs should feel like opportunity, not pressure
• Never use jargon. Never be generic. Every line earns its place.
`.trim();

  const userPrompt = `
Generate exactly ${count} content pieces for LeadMine's realtor acquisition campaign.

BATCH ANGLES (use each one for the corresponding piece):
${selectedAngles.map((a, i) => `${i + 1}. ${a}`).join("\n")}

STATS TO USE IN THIS BATCH:
${stats.map(s => `• ${s}`).join("\n")}

PAIN POINTS TO REFERENCE:
${painPoints.map(p => `• ${p}`).join("\n")}

OUTCOME STORIES TO DRAW FROM:
${outcomes.map(o => `• ${o}`).join("\n")}

PLATFORM MIX (assign one per piece):
1. instagram_post (type: post)
2. facebook_feed (type: ad)
3. instagram_story (type: story)
4. facebook_square (type: post)
5. facebook_feed (type: ad)
6. article_header (type: article)

AVAILABLE CTAs: ${BRAND.ctas.join(" | ")}

Return a JSON array of exactly ${count} objects. Each object:
{
  "id": "kebab-case-slug",
  "type": "ad" | "post" | "story" | "article",
  "platform": "instagram_post" | "instagram_story" | "facebook_feed" | "facebook_square" | "article_header",
  "angle": "the angle used (from the batch angles list)",
  "imagePrompt": "Detailed Flux image generation prompt. Cinematic, dark, professional. Describe lighting, mood, composition. Reference the content context so image and copy feel unified.",
  "headline": "Punchy, max 8 words. Should stop a realtor mid-scroll.",
  "subheadline": "Supporting context, max 15 words (optional)",
  "body": "2-4 sentences. Insight-driven, empathetic. Weave in the stat or pain point naturally. End pointing toward LeadMine.",
  "cta": "One from the available CTAs",
  "hashtags": ["realestate", "realtor", "leadgeneration", ...5-8 relevant tags], // post/story only
  "statUsed": "the stat featured in this piece, if any",
  "articleBody": "Full markdown article, 900-1200 words. Structure: hook paragraph, 3-4 insightful sections with subheadings, real data, specific realtor scenarios, LeadMine positioned as the natural solution (not forced). Authoritative and shareable." // article type only
}

Return only the JSON array. No markdown fences, no explanation.
`.trim();

  const anthropic = new Anthropic();
  const response = await anthropic.messages.create({
    model:      "claude-opus-4-5-20251101",
    max_tokens: 6000,
    system:     systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const raw   = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
    const plans = JSON.parse(raw) as ContentPlan[];
    return plans.map((p, i) => ({
      ...p,
      id: p.id ?? `leadmine-creative-${Date.now()}-${i}`,
    }));
  } catch {
    console.error("[content-plan] Parse failed. Raw output:\n", text.slice(0, 500));
    return [];
  }
}

// ── Utils ──────────────────────────────────────────────────────────────────

function pickVaried<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  const result: T[] = [];
  for (let i = 0; i < count; i++) {
    result.push(shuffled[i % shuffled.length]);
  }
  return result;
}
