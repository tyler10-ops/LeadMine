import type { CreativeLeadType } from "@/types";

export interface CreativeContext {
  county: string;
  state: string;
  leadType: CreativeLeadType;
  equityBand: string;
  propertyType: string;
  leadCount: number;
  avgYearsOwned?: number;
}

export function adCopyPrompt(ctx: CreativeContext): string {
  const targetLabel =
    ctx.leadType === "buyers"  ? "home buyers" :
    ctx.leadType === "sellers" ? "homeowners ready to sell" :
    "buyers and sellers";

  const propertyLabel = ctx.propertyType.replace("_", " ");

  return `You are an expert real estate ad copywriter. Generate high-converting ad copy for a Facebook/Instagram real estate campaign targeting ${targetLabel} in ${ctx.county} County, ${ctx.state}.

MARKET DATA:
- Location: ${ctx.county} County, ${ctx.state}
- Target audience: ${targetLabel}
- Equity band: ${ctx.equityBand}
- Property type: ${propertyLabel}
- Identified prospects in area: ${ctx.leadCount}${ctx.avgYearsOwned ? `\n- Average years owned: ${ctx.avgYearsOwned} years` : ""}

REQUIREMENTS:
- Headlines: 5 variants, 40 characters MAX each (strict — Meta Ads limit)
- Primary text: 3 variants, conversational, 125 characters MAX each
- CTAs: 2 options, action-oriented, 3–5 words each
- Local hook: one compelling data-driven sentence using the market data above

COMPLIANCE RULES (Meta Housing Special Ad Category):
- No references to age, gender, race, religion, national origin, or ZIP codes
- No specific price guarantees or fabricated statistics
- Focus on opportunity, timing, local expertise, and general market conditions

TONE: Professional but approachable. Local and trustworthy. Not pushy.

Return ONLY valid JSON — no markdown, no explanation:
{
  "headlines": ["string", "string", "string", "string", "string"],
  "primaryText": ["string", "string", "string"],
  "ctas": ["string", "string"],
  "localHook": "string"
}`;
}

export function imagePrompt(
  ctx: CreativeContext,
  style: "aerial" | "lifestyle" | "text_overlay"
): string {
  const county = `${ctx.county} County, ${ctx.state}`;
  const propertyLabel = ctx.propertyType.replace("_", " ");

  const guides = {
    aerial: `Aerial drone photograph of a quiet residential neighborhood in ${county}. Golden hour warm lighting, tree-lined streets, well-maintained ${propertyLabel} homes with green lawns. Photorealistic, 4K, professional real estate photography.`,
    lifestyle: `Warm, aspirational lifestyle photo of a happy family or couple standing in front of a beautiful ${propertyLabel} home in a sunny suburban neighborhood. Bright natural light, green yard, welcoming front porch. Professional advertising photography, 4K.`,
    text_overlay: `Clean, modern real estate advertisement background for ${county}. Elegant dark-to-transparent gradient suitable for overlaying white text. Softly blurred suburban neighborhood in background. Minimal, professional, cinematic.`,
  };

  return guides[style];
}
