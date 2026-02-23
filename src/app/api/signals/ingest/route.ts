import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ingestSignal } from "@/lib/market-intel/ingestion";
import type { RawSignalInput } from "@/lib/market-intel/types";

/**
 * POST /api/signals/ingest — Ingest one or more raw signals.
 * Protected: requires service-role or API key in production.
 * For MVP, accepts signals directly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceClient();

    // Accept single signal or array
    const signals: RawSignalInput[] = Array.isArray(body) ? body : [body];

    // Validate required fields
    for (const sig of signals) {
      if (!sig.source_name || !sig.headline || !sig.category) {
        return NextResponse.json(
          { error: "Each signal requires: source_name, headline, category" },
          { status: 400 }
        );
      }
    }

    const results = [];
    const errors = [];

    for (const raw of signals) {
      try {
        const result = await ingestSignal(raw, supabase);
        if (result) {
          results.push(result);
        } else {
          errors.push({ headline: raw.headline, error: "Insert failed" });
        }
      } catch (err) {
        errors.push({
          headline: raw.headline,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ingested: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
