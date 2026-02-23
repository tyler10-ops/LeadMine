import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/signals/:id — Single signal with full interpretation.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: signal, error } = await supabase
      .from("market_signals")
      .select(
        `*, interpretations:signal_interpretations(
          id, ai_summary, ai_realtor_impact, ai_suggested_implication,
          affected_asset_types, asset_recommendations, model_used,
          prompt_version, generated_at, is_current
        )`
      )
      .eq("id", id)
      .single();

    if (error || !signal) {
      return NextResponse.json({ error: "Signal not found" }, { status: 404 });
    }

    // Separate current and historical interpretations
    const interpretations = signal.interpretations || [];
    const current = interpretations.find((i: { is_current: boolean }) => i.is_current);
    const history = interpretations.filter((i: { is_current: boolean }) => !i.is_current);

    return NextResponse.json({
      ...signal,
      interpretation: current || null,
      interpretation_history: history,
      interpretations: undefined,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
