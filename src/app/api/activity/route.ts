import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { logActivity, type EventType } from "@/lib/activity-log";

// GET — fetch activity feed for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get("event_type");
    const severity  = searchParams.get("severity");
    const limit     = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset    = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("activity_log")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (eventType) query = query.eq("event_type", eventType);
    if (severity)  query = query.eq("severity", severity);

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ events: data ?? [], total: count ?? 0, limit, offset });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — write an activity event from client-side code
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const body = await request.json();
    const { eventType, entityType, entityId, title, description, metadata } = body;

    if (!eventType || !title) {
      return NextResponse.json({ error: "eventType and title are required" }, { status: 400 });
    }

    await logActivity({
      userId:      user.id,
      clientId:    client?.id,
      eventType:   eventType as EventType,
      entityType,
      entityId,
      title,
      description,
      metadata,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}