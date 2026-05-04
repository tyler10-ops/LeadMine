import { NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const [{ data: clientRow }, { data: realtorRow }] = await Promise.all([
    supabase.from("clients").select("id").eq("user_id", user.id).single(),
    supabase.from("realtors").select("id").eq("user_id", user.id).single(),
  ]);

  const allowedIds = [clientRow?.id, realtorRow?.id, user.id].filter(Boolean) as string[];

  const { data: sample, count } = await supabase
    .from("leads")
    .select("id, client_id, data_source, gem_grade, created_at", { count: "exact" })
    .in("client_id", allowedIds)
    .limit(3);

  const { count: total } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    userId: user.id,
    clientId: clientRow?.id ?? null,
    realtorId: realtorRow?.id ?? null,
    allowedIds,
    leadsMatchingUser: count,
    totalLeadsInTable: total,
    sampleLeads: sample,
  });
}