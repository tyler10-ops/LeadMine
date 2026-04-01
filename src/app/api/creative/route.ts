import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) return NextResponse.json([], { status: 200 });

    const { data: creatives, error } = await supabase
      .from("ad_creatives")
      .select("*")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      // Table may not exist yet
      return NextResponse.json([]);
    }

    return NextResponse.json(creatives);
  } catch (err) {
    console.error("Creative list error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
