/**
 * Signal Ingestion Pipeline
 *
 * Orchestrates the flow from raw data → scored signal → AI interpretation → DB.
 *
 * Pipeline stages:
 * 1. Adapter fetches raw data
 * 2. Scorer normalizes and computes impact
 * 3. AI generates interpretation
 * 4. Signal + interpretation written to DB
 *
 * Designed for:
 * - Real-time (webhook/API push)
 * - Near-real-time (polling)
 * - Batch (daily cron)
 */

import { scoreSignal } from "./scorer";
import { generateSignalInterpretation } from "./interpreter";
import type { RawSignalInput, DataSourceAdapter } from "./types";
import type { AssetRecommendation } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>;

interface IngestionResult {
  signalId: string;
  interpretationId: string;
  impactScore: number;
  isHighImpact: boolean;
}

/**
 * Process a single raw signal through the full pipeline.
 * Returns IDs of created records for downstream use (e.g., alerting).
 */
export async function ingestSignal(
  input: RawSignalInput,
  supabase: AnySupabaseClient
): Promise<IngestionResult | null> {
  // Stage 1: Score and classify
  const scored = scoreSignal(input);

  // Stage 2: Write signal to DB
  const { data: signal, error: sigError } = await supabase
    .from("market_signals")
    .upsert(
      {
        source_name: scored.source_name,
        source_type: scored.source_type,
        source_url: scored.source_url || null,
        external_id: scored.external_id || null,
        headline: scored.headline,
        summary: scored.summary || null,
        body: scored.body || null,
        raw_data: scored.raw_data || {},
        category: scored.category,
        geography: scored.geography,
        region: scored.region,
        signal_direction: scored.signal_direction,
        confidence_score: scored.confidence_score,
        impact_score: scored.impact_score,
        impact_factors: scored.impact_factors,
        tags: scored.tags,
        is_high_impact: scored.is_high_impact,
        published_at: scored.published_at || new Date().toISOString(),
      },
      { onConflict: "source_name,external_id" }
    )
    .select("id")
    .single();

  if (sigError || !signal) {
    console.error("Signal insert error:", sigError?.message);
    return null;
  }

  // Stage 3: Generate AI interpretation
  let interpretation: {
    summary: string;
    realtorImpact: string;
    implication: string;
    affectedAssets: string[];
    recommendations: AssetRecommendation[];
  };

  try {
    interpretation = await generateSignalInterpretation(scored);
  } catch (err) {
    console.error("AI interpretation error:", err);
    // Fallback: use summary as interpretation
    interpretation = {
      summary: scored.summary || scored.headline,
      realtorImpact: "Analysis pending.",
      implication: "",
      affectedAssets: [],
      recommendations: [],
    };
  }

  // Stage 4: Write interpretation to DB
  // Mark any previous interpretations as not current
  await supabase
    .from("signal_interpretations")
    .update({ is_current: false })
    .eq("signal_id", signal.id);

  const { data: interp, error: interpError } = await supabase
    .from("signal_interpretations")
    .insert({
      signal_id: signal.id,
      ai_summary: interpretation.summary,
      ai_realtor_impact: interpretation.realtorImpact,
      ai_suggested_implication: interpretation.implication || null,
      affected_asset_types: interpretation.affectedAssets,
      asset_recommendations: interpretation.recommendations,
      is_current: true,
    })
    .select("id")
    .single();

  if (interpError) {
    console.error("Interpretation insert error:", interpError.message);
  }

  return {
    signalId: signal.id,
    interpretationId: interp?.id || "",
    impactScore: scored.impact_score,
    isHighImpact: scored.is_high_impact,
  };
}

/**
 * Run a full ingestion cycle from a data source adapter.
 * Processes all signals returned by the adapter.
 */
export async function runAdapterIngestion(
  adapter: DataSourceAdapter,
  supabase: AnySupabaseClient
): Promise<IngestionResult[]> {
  const available = await adapter.isAvailable();
  if (!available) {
    console.warn(`Adapter ${adapter.name} is not available. Skipping.`);
    return [];
  }

  const rawSignals = await adapter.fetch();
  const results: IngestionResult[] = [];

  for (const raw of rawSignals) {
    const result = await ingestSignal(raw, supabase);
    if (result) results.push(result);
  }

  return results;
}
