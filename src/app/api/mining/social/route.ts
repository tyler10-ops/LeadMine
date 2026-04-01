/**
 * POST /api/mining/social
 *
 * Scrapes Reddit and Craigslist for real-time buyer/seller intent signals
 * in a given location and saves them directly as leads.
 *
 * Body: { location: string }  e.g. { location: "Austin, TX" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";
import { RedditScraper }      from "@/lib/mining/scrapers/reddit";
import { CraigslistScraper }  from "@/lib/mining/scrapers/craigslist";
import type { SocialSignalRecord } from "@/lib/mining/scrapers/reddit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: client }  = await supabase.from("clients").select("id").eq("user_id", user.id).single();
    const { data: realtor } = await supabase.from("realtors").select("id").eq("user_id", user.id).single();
    const clientId = client?.id ?? realtor?.id;
    if (!clientId) return NextResponse.json({ error: "No client profile found" }, { status: 404 });

    const body = await req.json() as { location?: string };
    const location = body.location?.trim();
    if (!location) return NextResponse.json({ error: "location is required" }, { status: 400 });

    // ── Scrape both sources concurrently ───────────────────────────────────
    const [redditRecords, craigslistRecords] = await Promise.allSettled([
      new RedditScraper().scrape(location),
      new CraigslistScraper().scrape(location),
    ]);

    const signals: SocialSignalRecord[] = [
      ...(redditRecords.status      === "fulfilled" ? redditRecords.value      : []),
      ...(craigslistRecords.status  === "fulfilled" ? craigslistRecords.value  : []),
    ];

    if (signals.length === 0) {
      return NextResponse.json({ saved: 0, message: "No signals found for this location" });
    }

    // ── Save to leads table ────────────────────────────────────────────────
    const db   = createServiceClient();
    const rows = signals.map((s) => ({
      client_id:        clientId,
      email:            `${s.sourceId}@leadmine.social`,
      source:           s.source,
      intent:           s.signalType === "seller_intent" ? "seller" : "buyer",
      score:            s.score,
      gem_grade:        s.score >= 70 ? "elite" : s.score >= 45 ? "refined" : "rock",
      business_name:    s.title,
      phone:            s.phone,
      property_city:    s.city,
      property_state:   s.state,
      opportunity_type: s.signalType,
      signal_flags:     s.keywords,
      stage:            "new",
      tags:             [s.source, s.signalType],
      enrichment_data:  {
        body:     s.body,
        url:      s.url,
        author:   s.author,
        postedAt: s.postedAt,
        keywords: s.keywords,
        rawData:  s.rawData,
      },
      data_source: s.source,
    }));

    // Upsert — skip duplicate posts (same sourceId → same email)
    const { data: saved, error } = await db
      .from("leads")
      .upsert(rows, { onConflict: "email", ignoreDuplicates: true })
      .select("id");

    if (error) {
      console.error("[api/mining/social] Save error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const savedCount = saved?.length ?? 0;

    // Log activity
    try {
      await db.from("activity_log").insert({
        user_id:     user.id,
        client_id:   clientId,
        event_type:  "mine_completed",
        title:       `Social signals mined — ${savedCount} new leads from ${location}`,
        description: `Reddit + Craigslist scan found ${signals.length} signals, ${savedCount} saved.`,
        icon:        "zap",
        severity:    savedCount > 0 ? "success" : "info",
        metadata:    { location, total: signals.length, saved: savedCount, sources: ["reddit", "craigslist"] },
      });
    } catch { /* non-fatal */ }

    return NextResponse.json({
      saved:   savedCount,
      total:   signals.length,
      sources: { reddit: redditRecords.status === "fulfilled" ? redditRecords.value.length : 0,
                 craigslist: craigslistRecords.status === "fulfilled" ? craigslistRecords.value.length : 0 },
      location,
    });

  } catch (err) {
    console.error("[api/mining/social]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}