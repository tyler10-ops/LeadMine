import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("realtor_id", realtor.id)
      .single();

    // Return defaults if no row yet
    return NextResponse.json(prefs ?? {
      email_enabled: false,
      push_enabled:  false,
      send_time:     "08:00",
      timezone:      "America/Chicago",
      last_sent_at:  null,
    });
  } catch (err) {
    console.error("Prefs GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    const body = await request.json() as {
      email_enabled?: boolean;
      push_enabled?:  boolean;
      send_time?:     string;
      timezone?:      string;
    };

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .upsert({
        realtor_id: realtor.id,
        ...body,
        updated_at: new Date().toISOString(),
      }, { onConflict: "realtor_id" })
      .select()
      .single();

    return NextResponse.json(prefs);
  } catch (err) {
    console.error("Prefs PATCH error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
