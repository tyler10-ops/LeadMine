import Anthropic from "@anthropic-ai/sdk";
import type { PropertyLead, SearchArea, HeatScoreResult, HeatScoreBreakdown, HeatTier } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Tier thresholds ────────────────────────────────────────────────────────────

function scoreToTier(score: number): HeatTier {
  if (score >= 86) return "diamond";
  if (score >= 71) return "hot";
  if (score >= 41) return "warm";
  return "cold";
}

// ── Deterministic scoring ──────────────────────────────────────────────────────

function calcLocationMatch(lead: PropertyLead, profile: SearchArea): number {
  // max 20
  const leadZip    = lead.property_zip?.trim() ?? "";
  const leadCity   = lead.property_city?.toLowerCase().trim() ?? "";
  const leadCounty = lead.property_county?.toLowerCase().trim() ?? "";

  const inZip = profile.zip_codes.some((z) => z.trim() === leadZip);
  if (inZip) return 20;

  const inCity = profile.cities.some(
    (c) => c.toLowerCase().trim() === leadCity || c.toLowerCase().includes(leadCity)
  );
  if (inCity) return 17;

  const inCounty = profile.counties.some(
    (c) => c.toLowerCase().trim() === leadCounty || c.toLowerCase().includes(leadCounty)
  );
  if (inCounty) return 12;

  // State match only
  if (profile.state && lead.property_state?.toUpperCase() === profile.state.toUpperCase()) {
    return 5;
  }

  return 0;
}

function calcPropertyIntent(lead: PropertyLead, profile: SearchArea): number {
  // max 25
  let score = 0;

  // Opportunity type aligns with preference
  const pref = profile.lead_type_preference ?? "both";
  const dealGoal = profile.deal_goal ?? "3-5";

  const isTypeMatch =
    pref === "both" ||
    (pref === "sellers" && lead.opportunity_type === "seller") ||
    (pref === "buyers" && (lead.opportunity_type === "buyer" || lead.opportunity_type === "investor"));

  if (pref === "both") {
    score += 10;
  } else if (isTypeMatch) {
    score += 15;
  } else if (lead.opportunity_type) {
    // Wrong type: quality mode ("1-2") gives no partial credit; volume mode ("5+") still gives some
    score += dealGoal === "1-2" ? 0 : dealGoal === "5+" ? 6 : 4;
  }

  // Seller signals
  const sellerSignals = profile.seller_signals ?? [];
  if (sellerSignals.length > 0 && lead.signal_flags?.length > 0) {
    const matches = sellerSignals.filter((s) => lead.signal_flags.includes(s));
    score += Math.min(10, matches.length * 4);
  }

  // Buyer signals
  const buyerSignals = profile.buyer_signals ?? [];
  if (buyerSignals.length > 0 && lead.signal_flags?.length > 0) {
    const matches = buyerSignals.filter((s) => lead.signal_flags.includes(s));
    score += Math.min(8, matches.length * 3);
  }

  return Math.min(25, score);
}

function calcRecentActivity(lead: PropertyLead, profile: SearchArea): number {
  // max 20 — based on lead recency and ownership duration
  let score = 0;

  // Lead created recently → higher activity signal
  const created = new Date(lead.created_at);
  const daysOld = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  if (daysOld <= 7)  score += 10;
  else if (daysOld <= 30) score += 7;
  else if (daysOld <= 90) score += 4;

  // Years owned (seller signal — long ownership = more likely to sell)
  const years = lead.years_owned ?? 0;
  const minYears = profile.min_years_owned ?? 0;

  // If the profile requires minimum ownership years and lead doesn't meet it, skip ownership points
  if (minYears > 0 && years < minYears) return Math.min(20, score);

  if (years >= 10) score += 10;
  else if (years >= 5) score += 7;
  else if (years >= 2) score += 3;

  return Math.min(20, score);
}

function calcPropertyValue(lead: PropertyLead, profile: SearchArea): number {
  // max 10 — higher value = larger commission potential
  const value = lead.estimated_value ?? lead.assessed_value ?? 0;
  if (value === 0) return 0;

  const minPrice = profile.min_price ?? 0;
  const maxPrice = profile.max_price ?? Infinity;

  // Within target range
  if (value >= minPrice && value <= maxPrice) {
    if (value >= 750_000) return 10;
    if (value >= 500_000) return 8;
    if (value >= 300_000) return 6;
    return 4;
  }

  // Outside range but high value
  if (value >= 1_000_000) return 5;
  if (value >= 500_000)   return 3;
  return 1;
}

function calcContactCompleteness(lead: PropertyLead): number {
  // max 10
  let score = 0;
  if (lead.owner_name || lead.business_name) score += 3;
  if (lead.email && lead.email !== "unknown@unknown.com") score += 4;
  if (lead.phone) score += 3;
  return score;
}

function calcMarketCompetition(lead: PropertyLead): number {
  // max 5 — placeholder: use opportunity_score as a proxy (lower competition → higher opportunity)
  // In production this would use market data
  const oppScore = lead.opportunity_score ?? 50;
  if (oppScore >= 80) return 5;
  if (oppScore >= 60) return 4;
  if (oppScore >= 40) return 3;
  if (oppScore >= 20) return 2;
  return 1;
}

function calcBehaviorSignals(lead: PropertyLead, profile: SearchArea): number {
  // max 10 — based on signal_flags count + absentee/equity signals
  let score = 0;

  const flags = lead.signal_flags ?? [];
  score += Math.min(5, flags.length * 1.5);

  if (lead.is_absentee_owner) score += 3;

  const minEquityPct = profile.min_equity_pct ?? 0;
  const leadEquity = lead.equity_percent ?? 0;

  if (leadEquity >= Math.max(40, minEquityPct)) {
    score += 2;
  } else if (minEquityPct > 0 && leadEquity < minEquityPct) {
    // Doesn't meet the realtor's minimum equity threshold — penalize
    score = Math.max(0, score - 2);
  }

  return Math.min(10, Math.round(score));
}

// ── AI Reasoning ───────────────────────────────────────────────────────────────

async function generateReasoning(
  lead: PropertyLead,
  breakdown: HeatScoreBreakdown,
  score: number,
  tier: HeatTier
): Promise<string> {
  const value = lead.estimated_value ?? lead.assessed_value;
  const valueStr = value ? `$${value.toLocaleString()}` : "unknown value";
  const location = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "unknown location";
  const flags = lead.signal_flags?.slice(0, 3).join(", ") || "no special flags";

  const prompt = `You are a real estate lead scoring assistant. Write a concise 2-3 sentence explanation of why this lead scored ${score}/100 (${tier} tier).

Lead data:
- Location: ${location}
- Estimated property value: ${valueStr}
- Opportunity type: ${lead.opportunity_type ?? "unknown"}
- Years owned: ${lead.years_owned ?? "unknown"}
- Absentee owner: ${lead.is_absentee_owner}
- Signal flags: ${flags}
- Equity percent: ${lead.equity_percent ?? "unknown"}%

Score breakdown:
- Location match: ${breakdown.location_match}/20
- Property intent: ${breakdown.property_intent}/25
- Recent activity: ${breakdown.recent_activity}/20
- Property value: ${breakdown.property_value}/10
- Contact completeness: ${breakdown.contact_completeness}/10
- Market competition: ${breakdown.market_competition}/5
- Behavior signals: ${breakdown.behavior_signals}/10

Respond with only the explanation, no headers or bullet points. Be direct and specific about why this lead is ${tier}.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].type === "text" ? response.content[0].text : fallbackReasoning(tier, score);
  } catch {
    return fallbackReasoning(tier, score);
  }
}

function fallbackReasoning(tier: HeatTier, score: number): string {
  switch (tier) {
    case "diamond": return `This lead scored ${score}/100 (Diamond) — it matches multiple high-priority targeting criteria including location, property signals, and contact completeness. Prioritize outreach immediately.`;
    case "hot":     return `This lead scored ${score}/100 (Hot) — strong alignment with your target market and opportunity signals. Recommend prompt follow-up within 24 hours.`;
    case "warm":    return `This lead scored ${score}/100 (Warm) — moderate match with some promising signals. Worth including in your next outreach sequence.`;
    default:        return `This lead scored ${score}/100 (Cold) — limited match with current targeting profile. May improve with additional data enrichment.`;
  }
}

// ── Main Export ────────────────────────────────────────────────────────────────

export async function calculateHeatScore(
  lead: PropertyLead,
  targetingProfile: SearchArea
): Promise<HeatScoreResult> {
  const location_match       = calcLocationMatch(lead, targetingProfile);
  const property_intent      = calcPropertyIntent(lead, targetingProfile);
  const recent_activity      = calcRecentActivity(lead, targetingProfile);
  const property_value       = calcPropertyValue(lead, targetingProfile);
  const contact_completeness = calcContactCompleteness(lead);
  const market_competition   = calcMarketCompetition(lead);
  const behavior_signals     = calcBehaviorSignals(lead, targetingProfile);

  const breakdown: HeatScoreBreakdown = {
    location_match,
    property_intent,
    recent_activity,
    property_value,
    contact_completeness,
    market_competition,
    behavior_signals,
  };

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  const tier  = scoreToTier(score);

  const reasoning = await generateReasoning(lead, breakdown, score, tier);

  return { score, tier, breakdown, reasoning };
}
