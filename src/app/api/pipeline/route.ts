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
    const stage = searchParams.get("stage");
    const intent = searchParams.get("intent");
    const agentId = searchParams.get("agent_id");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "created_at";
    const order = searchParams.get("order") || "desc";
    const limit = parseInt(searchParams.get("limit") || "100");

    const supabase = await createServerSupabase();

    let query = supabase
      .from("leads")
      .select("*")
      .eq("realtor_id", realtorId);

    if (stage) query = query.eq("stage", stage);
    if (intent) query = query.eq("intent", intent);
    if (agentId) query = query.eq("assigned_agent_id", agentId);
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    query = query.order(sort, { ascending: order === "asc" }).limit(limit);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
