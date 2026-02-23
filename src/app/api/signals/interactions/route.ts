import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

/**
 * POST /api/signals/interactions — Track signal interactions (viewed, expanded, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { signal_id, interaction_type } = body;

    if (!signal_id || !interaction_type) {
      return NextResponse.json(
        { error: "signal_id and interaction_type required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.from("signal_interactions").insert({
      realtor_id: realtorId,
      signal_id,
      interaction_type,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
