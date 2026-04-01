import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // Auth check via user session
  const authSupabase = await createServerSupabase();
  const { data: { user } } = await authSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Resolve client_id — check both tables, use whichever exists
  const { data: client }  = await authSupabase.from("clients").select("id").eq("user_id", user.id).single();
  const { data: realtor } = await authSupabase.from("realtors").select("id").eq("user_id", user.id).single();
  const clientId = client?.id ?? realtor?.id ?? null;
  if (!clientId) return NextResponse.json({ leads: [], stats: emptyStats() });

  // Use service role to bypass RLS (RLS only covers realtors table FK, not clients table)
  // Security: user is authenticated above and we filter strictly by their clientId
  const supabase = createServiceClient();

  // Parse query params
  const url = new URL(req.url);
  const grade    = url.searchParams.get("grade");
  const intent   = url.searchParams.get("intent");
  const industry = url.searchParams.get("industry");
  const search   = url.searchParams.get("q");
  const limit    = Math.min(parseInt(url.searchParams.get("limit") ?? "100"), 250);
  const offset   = parseInt(url.searchParams.get("offset") ?? "0");

  let query = supabase
    .from("leads")
    .select("id, company_name, email, phone, industry, gem_grade, score, intent, source, source_url, enrichment_data, notes, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (grade)    query = query.eq("gem_grade", grade);
  if (intent)   query = query.eq("intent", intent);
  if (industry) query = query.ilike("industry", `%${industry}%`);
  if (search)   query = query.or(
    `company_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
  );

  const { data: leads, error } = await query;
  if (error) {
    console.error("[intelligence/leads]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats query (count by grade for this client)
  const { data: statsRows } = await supabase
    .from("leads")
    .select("gem_grade, intent, created_at")
    .eq("client_id", clientId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type Stats = ReturnType<typeof emptyStats>;
  const stats = (statsRows ?? []).reduce(
    (acc: Stats, row: { gem_grade: string | null; intent: string | null; created_at: string }) => {
      acc.total++;
      if (row.gem_grade === "elite")   acc.elite++;
      if (row.gem_grade === "refined") acc.refined++;
      if (row.gem_grade === "rock")    acc.rock++;
      if (row.intent === "hot")        acc.hot++;
      if (new Date(row.created_at) >= today) acc.today++;
      return acc;
    },
    emptyStats()
  );

  return NextResponse.json({ leads: leads ?? [], stats });
}

function emptyStats() {
  return { total: 0, elite: 0, refined: 0, rock: 0, hot: 0, today: 0 };
}
