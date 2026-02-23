import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = await createServerSupabase();

    const [automationResult, logsResult] = await Promise.all([
      supabase
        .from("automations")
        .select("*, ai_assets(name, type)")
        .eq("id", id)
        .eq("realtor_id", realtorId)
        .single(),
      supabase
        .from("automation_logs")
        .select("*")
        .eq("automation_id", id)
        .eq("realtor_id", realtorId)
        .order("timestamp", { ascending: false })
        .limit(100),
    ]);

    if (automationResult.error || !automationResult.data) {
      return NextResponse.json({ error: "Automation not found" }, { status: 404 });
    }

    return NextResponse.json({
      automation: automationResult.data,
      logs: logsResult.data || [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
      .from("automations")
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
