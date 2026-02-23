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
    const status = searchParams.get("status");
    const upcoming = searchParams.get("upcoming");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = await createServerSupabase();

    let query = supabase
      .from("appointments")
      .select("*, leads(name, email, phone)")
      .eq("realtor_id", realtorId)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (status) query = query.eq("status", status);
    if (upcoming === "true") {
      query = query
        .gte("scheduled_at", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"]);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten joined lead data
    const appointments = (data || []).map((apt: Record<string, unknown>) => {
      const leads = apt.leads as Record<string, unknown> | null;
      return {
        ...apt,
        lead_name: leads?.name || null,
        lead_email: leads?.email || null,
        lead_phone: leads?.phone || null,
        leads: undefined,
      };
    });

    return NextResponse.json(appointments);
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
      .from("appointments")
      .insert({ ...body, realtor_id: realtorId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update lead stage to booked
    if (body.lead_id) {
      await supabase
        .from("leads")
        .update({
          stage: "booked",
          stage_changed_at: new Date().toISOString(),
        })
        .eq("id", body.lead_id)
        .eq("realtor_id", realtorId);
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
