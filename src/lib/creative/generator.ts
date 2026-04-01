import Anthropic from "@anthropic-ai/sdk";
import { adCopyPrompt, imagePrompt, type CreativeContext } from "./prompts";
import type { CreativeCopySet, CreativeImageVariant } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Copy Generation ────────────────────────────────────────────────────────────

export async function generateCopy(ctx: CreativeContext): Promise<CreativeCopySet> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: adCopyPrompt(ctx) }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    return JSON.parse(text) as CreativeCopySet;
  } catch {
    // Structured fallback if JSON parse fails
    return {
      headlines: [
        `Homes in ${ctx.county} County`,
        "Is Now the Right Time to Sell?",
        "Local Real Estate Experts",
        "Find Your Perfect Home Here",
        "Your Neighborhood Specialists",
      ],
      primaryText: [
        `${ctx.leadCount} homeowners in your area are making moves. Are you next?`,
        "We know this market better than anyone. Let's talk about your options.",
        "Serious buyers are looking in your neighborhood right now.",
      ],
      ctas: ["Get Free Home Valuation", "See What's Available"],
      localHook: `${ctx.leadCount} identified prospects in ${ctx.county} County, ${ctx.state} with ${ctx.equityBand} in equity.`,
    };
  }
}

// ── Image Generation ───────────────────────────────────────────────────────────

// Placeholder images (Unsplash) — used when FAL_API_KEY is not configured
const PLACEHOLDER_IMAGES: Record<string, string> = {
  aerial:       "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=900&fit=crop&q=80",
  lifestyle:    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=900&fit=crop&q=80",
  text_overlay: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&h=900&fit=crop&q=80",
};

async function generateImageViaFlux(prompt: string): Promise<string | null> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_4_3",
        num_inference_steps: 4,
        num_images: 1,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as { images?: { url: string }[] };
    return data.images?.[0]?.url ?? null;
  } catch {
    return null;
  }
}

export async function generateImages(ctx: CreativeContext): Promise<CreativeImageVariant[]> {
  const styles = ["aerial", "lifestyle", "text_overlay"] as const;

  const results = await Promise.allSettled(
    styles.map(async (style): Promise<CreativeImageVariant> => {
      const prompt = imagePrompt(ctx, style);
      const url = (await generateImageViaFlux(prompt)) ?? PLACEHOLDER_IMAGES[style];
      return { url, prompt, style, status: "generated" };
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : {
          url: PLACEHOLDER_IMAGES[styles[i]],
          prompt: imagePrompt(ctx, styles[i]),
          style: styles[i],
          status: "error" as const,
        }
  );
}

// ── Main Orchestrator ──────────────────────────────────────────────────────────

export async function generateCreativeSet(ctx: CreativeContext): Promise<{
  copy: CreativeCopySet;
  images: CreativeImageVariant[];
}> {
  // Copy and images are independent — run in parallel
  const [copy, images] = await Promise.all([
    generateCopy(ctx),
    generateImages(ctx),
  ]);

  return { copy, images };
}
