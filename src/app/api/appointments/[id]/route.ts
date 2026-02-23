import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("appointments")
      .select("*, leads(name, email, phone)")
      .eq("id", id)
      .eq("realtor_id", realtorId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const leads = data.leads as Record<string, unknown> | null;
    return NextResponse.json({
      ...data,
      lead_name: leads?.name || null,
      lead_email: leads?.email || null,
      lead_phone: leads?.phone || null,
      leads: undefined,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    if (body.status !== undefined) updates.status = body.status;
    if (body.scheduled_at !== undefined) updates.scheduled_at = body.scheduled_at;
    if (body.conversation_summary !== undefined) updates.conversation_summary = body.conversation_summary;
    if (body.key_talking_points !== undefined) updates.key_talking_points = body.key_talking_points;

    const { data, error } = await supabase
      .from("appointments")
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
