/**
 * AI Signal Interpretation Layer
 *
 * Uses Claude to generate realtor-focused analysis of market signals.
 * Each interpretation includes:
 * - Plain-English summary
 * - Realtor-specific impact assessment
 * - Suggested market implication
 * - Affected AI asset types
 * - Actionable recommendations per asset
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ProcessedSignal } from "./types";
import type { AssetRecommendation } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface InterpretationResult {
  summary: string;
  realtorImpact: string;
  implication: string;
  affectedAssets: string[];
  recommendations: AssetRecommendation[];
}

const SIGNAL_INTERPRETATION_PROMPT = `You are a senior real estate market analyst AI. Your job is to interpret market signals and provide actionable intelligence for real estate agents.

Given a market signal, produce a JSON response with the following fields:

{
  "summary": "A clear 1-2 sentence plain-English summary of what happened and why it matters.",
  "realtorImpact": "A 2-3 sentence assessment of how this specifically affects a working real estate agent's business. Be concrete — mention lead flow, pricing strategy, client conversations, listing timing, etc.",
  "implication": "A 1 sentence forward-looking market implication. What should agents expect next?",
  "affectedAssets": ["array of affected AI asset types from: voice, sms, email, social, listing, booking"],
  "recommendations": [
    {
      "asset_type": "one of: voice, sms, email, social, listing, booking",
      "action": "specific action to take with this asset",
      "reason": "why this action is recommended given the signal",
      "priority": "high, medium, or low"
    }
  ]
}

RULES:
- Be specific and actionable, not generic
- Write for a busy realtor who needs quick takeaways
- The "realtorImpact" is the most important field — make it practical
- Include 1-3 recommendations, prioritized by urgency
- Only include asset types that are genuinely affected
- For rates signals: focus on buyer affordability and urgency messaging
- For inventory signals: focus on pricing strategy and listing timing
- For demand signals: focus on lead pipeline and follow-up cadence
- For policy signals: focus on compliance and client education
- For macro signals: focus on market positioning and long-term strategy
- For local_market signals: focus on hyperlocal competitive advantage
- Return ONLY valid JSON, no markdown, no code fences`;

/**
 * Generate an AI interpretation for a processed market signal.
 */
export async function generateSignalInterpretation(
  signal: ProcessedSignal
): Promise<InterpretationResult> {
  const signalContext = `
SIGNAL DATA:
- Headline: ${signal.headline}
- Summary: ${signal.summary || "N/A"}
- Category: ${signal.category}
- Geography: ${signal.geography}
- Region: ${signal.region || "US"}
- Direction: ${signal.signal_direction}
- Impact Score: ${signal.impact_score}/100
- Confidence: ${signal.confidence_score}/100
- Source: ${signal.source_name}
- Tags: ${(signal.tags || []).join(", ") || "none"}
- Is High Impact: ${signal.is_high_impact ? "YES" : "no"}
${signal.body ? `- Body: ${signal.body.slice(0, 500)}` : ""}
`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: SIGNAL_INTERPRETATION_PROMPT,
    messages: [{ role: "user", content: signalContext }],
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const parsed = JSON.parse(block.text);

  // Validate and normalize the response
  return {
    summary: parsed.summary || signal.headline,
    realtorImpact: parsed.realtorImpact || "Analysis pending.",
    implication: parsed.implication || "",
    affectedAssets: Array.isArray(parsed.affectedAssets)
      ? parsed.affectedAssets
      : [],
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations.map((r: Record<string, unknown>) => ({
          asset_type: r.asset_type || "email",
          action: r.action || "",
          reason: r.reason || "",
          priority: r.priority || "medium",
        }))
      : [],
  };
}
