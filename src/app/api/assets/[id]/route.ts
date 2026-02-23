import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Get single asset with related automations and recent logs
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = await createServerSupabase();

    const [assetResult, automationsResult, logsResult] = await Promise.all([
      supabase
        .from("ai_assets")
        .select("*")
        .eq("id", id)
        .eq("realtor_id", realtorId)
        .single(),
      supabase
        .from("automations")
        .select("*")
        .eq("asset_id", id)
        .eq("realtor_id", realtorId)
        .order("created_at", { ascending: false }),
      supabase
        .from("automation_logs")
        .select("*")
        .eq("asset_id", id)
        .eq("realtor_id", realtorId)
        .order("timestamp", { ascending: false })
        .limit(50),
    ]);

    if (assetResult.error || !assetResult.data) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({
      asset: assetResult.data,
      automations: automationsResult.data || [],
      logs: logsResult.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update asset config or status
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const supabase = await createServerSupabase();

    const { data, error } = await supabase
      .from("ai_assets")
      .update({ ...body, updated_at: new Date().toISOString() })
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
