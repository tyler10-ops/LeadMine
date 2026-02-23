import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

export async function GET(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agent_id");
    const status = searchParams.get("status");
    const outcome = searchParams.get("outcome");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = await createServerSupabase();

    let query = supabase
      .from("call_records")
      .select("*")
      .eq("realtor_id", realtorId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (agentId) query = query.eq("agent_id", agentId);
    if (status) query = query.eq("status", status);
    if (outcome) query = query.eq("outcome", outcome);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("call_records")
      .insert({ ...body, realtor_id: realtorId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update lead's last_contact_at
    if (body.lead_id) {
      await supabase
        .from("leads")
        .update({ last_contact_at: new Date().toISOString() })
        .eq("id", body.lead_id)
        .eq("realtor_id", realtorId);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
