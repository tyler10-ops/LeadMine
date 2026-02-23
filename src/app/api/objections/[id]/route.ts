import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createServerSupabase();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.objection_text !== undefined) updates.objection_text = body.objection_text;
    if (body.response_text !== undefined) updates.response_text = body.response_text;
    if (body.category !== undefined) updates.category = body.category;
    if (body.effectiveness_score !== undefined) updates.effectiveness_score = body.effectiveness_score;

    const { data, error } = await supabase
      .from("objection_scripts")
      .update(updates)
      .eq("id", id)
      .eq("realtor_id", realtorId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
