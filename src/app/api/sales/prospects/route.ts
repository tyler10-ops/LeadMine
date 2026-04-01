/**
 * GET  /api/sales/prospects  — list prospects with filters
 * POST /api/sales/prospects  — create a manual prospect
 * PATCH /api/sales/prospects — update stage/notes
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { enrollProspect } from "@/lib/sales/outreach-sender";

export async function GET(request: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(request.url);

  const stage  = searchParams.get("stage");
  const search = searchParams.get("q");
  const limit  = parseInt(searchParams.get("limit") ?? "100");

  let query = supabase
    .from("prospects")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (stage) query = query.eq("stage", stage);
  if (search) query = query.or(`business_name.ilike.%${search}%,name.ilike.%${search}%,city.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospects: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      business_name: body.business_name,
      name:          body.name ?? null,
      email:         body.email ?? null,
      phone:         body.phone ?? null,
      city:          body.city ?? null,
      state:         body.state ?? null,
      source:        "manual",
      score:         body.score ?? 60,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.enroll && body.email) {
    await enrollProspect(data.id);
  }

  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: NextRequest) {
  const supabase = createServiceClient();
  const { id, ...updates } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (updates.stage) {
    updates.stage_changed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("prospects").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
