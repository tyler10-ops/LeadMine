import { NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { skipTraceBatch } from "@/lib/property/melissa-adapter";

export async function POST() {
  const authClient = await createServerSupabase();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  const [{ data: clientRow }, { data: realtorRow }] = await Promise.all([
    supabase.from("clients").select("id").eq("user_id", user.id).single(),
    supabase.from("realtors").select("id").eq("user_id", user.id).single(),
  ]);
  const allowedIds = [clientRow?.id, realtorRow?.id, user.id].filter(Boolean) as string[];

  const { data: leads } = await supabase
    .from("leads")
    .select("id, owner_name, property_address, property_city, property_state, property_zip")
    .in("client_id", allowedIds)
    .not("owner_name", "is", null)
    .is("phone", null)
    .order("opportunity_score", { ascending: false })
    .limit(50);

  if (!leads?.length) {
    return NextResponse.json({ message: "No leads to enrich", enriched: 0 });
  }

  const results = await skipTraceBatch(leads);

  let enriched = 0;
  for (const [leadId, result] of results) {
    await supabase.from("leads").update({
      phone: result.phone ?? null,
      ...(result.email ? { email: result.email } : {}),
    }).eq("id", leadId);
    enriched++;
  }

  return NextResponse.json({ message: `Enriched ${enriched} of ${leads.length} leads`, enriched, total: leads.length });
}