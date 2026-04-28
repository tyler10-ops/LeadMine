import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: realtor } = await supabase
    .from("realtors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!realtor) return NextResponse.json({ leadsThisMonth: 0 });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: areas } = await supabase
    .from("search_areas")
    .select("id")
    .eq("realtor_id", realtor.id);

  const areaIds = (areas ?? []).map((a: { id: string }) => a.id);
  if (areaIds.length === 0) return NextResponse.json({ leadsThisMonth: 0 });

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .in("search_area_id", areaIds)
    .gte("created_at", startOfMonth.toISOString());

  return NextResponse.json({ leadsThisMonth: count ?? 0 });
}