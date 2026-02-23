/**
 * Signal Impact Scorer
 *
 * Computes a 0-100 impact score for each market signal based on:
 * - Breadth: How wide is the geographic impact? (local=30, state=60, national=100)
 * - Magnitude: How significant is the change? (derived from category heuristics)
 * - Historical Relevance: How unusual is this event? (rarity factor)
 * - Confidence: How reliable is the data source?
 *
 * The score determines feed ranking, notification triggers,
 * and "high impact" flagging.
 */

import type { RawSignalInput, ProcessedSignal } from "./types";

/** Geography breadth scores */
const BREADTH_SCORES: Record<string, number> = {
  local: 30,
  state: 60,
  national: 100,
};

/** Base magnitude by category (adjustable per source) */
const CATEGORY_BASE_MAGNITUDE: Record<string, number> = {
  rates: 85,        // Rate changes affect all transactions
  policy: 80,       // Regulatory changes have broad impact
  macro: 75,        // Economic indicators are background signals
  inventory: 70,    // Supply directly affects pricing dynamics
  demand: 65,       // Demand signals are forward-looking
  local_market: 55, // Local data is narrower but actionable
};

/** Source reliability scores */
const SOURCE_CONFIDENCE: Record<string, number> = {
  "Federal Reserve": 98,
  "NAR": 92,
  "HUD": 95,
  "US Census Bureau": 94,
  "MBA": 88,
  "CoreLogic": 90,
  "BLS": 93,
  "Freddie Mac": 91,
  "Zillow Research": 82,
  "Redfin Data": 80,
};

const DEFAULT_SOURCE_CONFIDENCE = 65;

/**
 * Determine signal direction from headline and category heuristics.
 * This is a first-pass classifier; AI interpretation refines later.
 */
function classifyDirection(input: RawSignalInput): "bullish" | "bearish" | "neutral" {
  const text = `${input.headline} ${input.summary || ""}`.toLowerCase();

  const bullishTerms = [
    "rise", "rises", "rising", "increase", "increases", "grew", "growth",
    "improve", "improves", "stabilize", "stabilizes", "expand", "gains",
    "up ", "higher", "surge", "recovery", "rebound",
  ];

  const bearishTerms = [
    "decline", "declines", "drop", "drops", "fall", "falls", "falling",
    "decrease", "decreases", "slows", "slowing", "shrink", "contract",
    "down ", "lower", "plunge", "correction", "downturn",
  ];

  let bullishScore = 0;
  let bearishScore = 0;

  for (const term of bullishTerms) {
    if (text.includes(term)) bullishScore++;
  }
  for (const term of bearishTerms) {
    if (text.includes(term)) bearishScore++;
  }

  // Category-specific adjustments
  // For rates: "rises" is bearish for buyers (less affordable)
  if (input.category === "rates") {
    [bullishScore, bearishScore] = [bearishScore, bullishScore];
  }

  if (bullishScore > bearishScore) return "bullish";
  if (bearishScore > bullishScore) return "bearish";
  return "neutral";
}

/**
 * Compute impact score and all sub-factors for a signal.
 */
export function scoreSignal(input: RawSignalInput): ProcessedSignal {
  const geography = input.geography || "national";
  const breadth = BREADTH_SCORES[geography] || 50;
  const magnitude = CATEGORY_BASE_MAGNITUDE[input.category] || 60;
  const confidence = SOURCE_CONFIDENCE[input.source_name] || DEFAULT_SOURCE_CONFIDENCE;

  // Historical relevance: higher for policy/rates (rarer events)
  // Lower for local_market (frequent updates)
  const historicalRelevance =
    input.category === "policy" ? 85
    : input.category === "rates" ? 80
    : input.category === "macro" ? 70
    : input.category === "inventory" ? 60
    : input.category === "demand" ? 55
    : 45;

  // Weighted composite score
  const impactScore = Math.round(
    breadth * 0.20 +
    magnitude * 0.35 +
    historicalRelevance * 0.20 +
    confidence * 0.25
  );

  const clampedScore = Math.min(100, Math.max(0, impactScore));
  const isHighImpact = clampedScore >= 75;

  const direction = classifyDirection(input);

  return {
    ...input,
    geography,
    region: input.region || "US",
    tags: input.tags || [],
    signal_direction: direction,
    confidence_score: confidence,
    impact_score: clampedScore,
    impact_factors: {
      breadth,
      magnitude,
      historical_relevance: historicalRelevance,
      confidence,
    },
    is_high_impact: isHighImpact,
  };
}

/**
 * Score and classify a batch of raw signal inputs.
 */
export function scoreSignals(inputs: RawSignalInput[]): ProcessedSignal[] {
  return inputs
    .map(scoreSignal)
    .sort((a, b) => b.impact_score - a.impact_score);
}
