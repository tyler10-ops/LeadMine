import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export interface MiningHistoryEntry {
  date: string;
  total: number;
  elite: number;
  refined: number;
  rock: number;
}

/**
 * GET /api/mining/history
 * Returns recent mining activity grouped by date for the authenticated user.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up client_id for this user
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "No client profile found" }, { status: 404 });
    }

    // Fetch recent leads for this client, ordered by created_at desc
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("created_at, gem_grade")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (leadsError) {
      console.error("[api/mining/history]", leadsError);
      return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
    }

    // Group by date
    const grouped = new Map<string, MiningHistoryEntry>();

    for (const lead of leads ?? []) {
      const date = lead.created_at.split("T")[0]; // YYYY-MM-DD
      const entry = grouped.get(date) ?? { date, total: 0, elite: 0, refined: 0, rock: 0 };
      entry.total++;
      if (lead.gem_grade === "elite") entry.elite++;
      else if (lead.gem_grade === "refined") entry.refined++;
      else entry.rock++;
      grouped.set(date, entry);
    }

    // Sort by date desc, limit to 10
    const history = Array.from(grouped.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[api/mining/history]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
