import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase  = createServiceClient();
  const { searchParams } = request.nextUrl;
  const channel   = searchParams.get("channel");   // email | sms | call_script
  const status    = searchParams.get("status");    // draft | queued_to_send | sent
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: client } = !realtor
    ? await supabase.from("clients").select("id").eq("user_id", user.id).single()
    : { data: null };

  const realtorId = realtor?.id ?? client?.id;
  if (!realtorId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let query = supabase
    .from("outreach_drafts")
    .select("id, lead_id, subject, body, channel, tone, status, ai_model, created_at, updated_at")
    .eq("realtor_id", realtorId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (channel) query = query.eq("channel", channel);
  if (status)  query = query.eq("status", status);

  const { data: drafts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!drafts?.length) return NextResponse.json([]);

  // Enrich with lead data
  const leadIds = [...new Set(drafts.map((d: { lead_id: string }) => d.lead_id).filter(Boolean))];
  const { data: leads } = await supabase
    .from("leads")
    .select("id, owner_name, property_address, property_city, property_state, email, phone")
    .in("id", leadIds);

  const leadMap = Object.fromEntries((leads ?? []).map((l: { id: string }) => [l.id, l]));

  return NextResponse.json(
    drafts.map((d: { lead_id: string }) => ({ ...d, lead: leadMap[d.lead_id] ?? null }))
  );
}

export async function DELETE(request: NextRequest) {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("outreach_drafts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
