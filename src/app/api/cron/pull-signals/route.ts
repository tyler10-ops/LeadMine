import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/ai/claude";

/**
 * GET /api/cron/pull-signals
 *
 * Pulls live real-estate market news from an RSS source, classifies each item
 * into a structured market signal with Claude, and inserts new ones into
 * market_signals + signal_interpretations. Powers the live Market feed.
 *
 * Source is configurable via SIGNALS_FEED_URL (any RSS/Atom feed). Defaults to
 * a Google News query — a real source that needs no API key.
 *
 * Scheduled in vercel.json. Secured with CRON_SECRET; also manually runnable
 * with the bearer token for seeding/testing.
 */
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const DEFAULT_FEED =
  "https://news.google.com/rss/search?q=" +
  encodeURIComponent("mortgage rates OR housing market OR home sales OR real estate inventory OR home prices") +
  "&hl=en-US&gl=US&ceid=US:en";

const SOURCE_NAME = "Google News";
const VALID_CATEGORIES = ["rates", "inventory", "demand", "policy", "local_market", "macro"] as const;
const VALID_DIRECTIONS = ["bullish", "bearish", "neutral"] as const;

interface FeedItem { title: string; link: string; guid: string; pubDate: string; source: string; }
interface Classification {
  index: number;
  category: string;
  direction: string;
  impact: number;
  confidence: number;
  summary: string;
  realtor_impact: string;
  implication?: string;
  tags?: string[];
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .trim();
}
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]) : "";
}
function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const out: FeedItem[] = [];
  for (const b of blocks) {
    const title = pick(b, "title");
    if (!title) continue;
    out.push({
      title,
      link: pick(b, "link"),
      guid: pick(b, "guid") || pick(b, "link") || title,
      pubDate: pick(b, "pubDate"),
      source: pick(b, "source") || SOURCE_NAME,
    });
  }
  return out;
}

function clamp(n: number): number { return Math.max(0, Math.min(100, Math.round(Number(n) || 0))); }

/** Classify headlines into structured signals, in small chunks to fit the token budget. */
async function classify(items: FeedItem[]): Promise<Map<number, Classification>> {
  const map = new Map<number, Classification>();
  const CHUNK = 5;
  const system =
    "You are a real estate market analyst for a realtor lead-gen platform. For each news headline, produce a structured market signal. 'direction' is from a realtor's deal-flow perspective: anything that increases buyer/seller transaction activity is 'bullish', anything that suppresses it is 'bearish', unclear is 'neutral'. Return ONLY a JSON array — no prose, no markdown fences.";

  for (let start = 0; start < items.length; start += CHUNK) {
    const chunk = items.slice(start, start + CHUNK);
    const list = chunk.map((it, j) => `${j}. ${it.title}`).join("\n");
    const user =
      `Headlines:\n${list}\n\n` +
      `Return a JSON array; each element:\n` +
      `{"index": number, "category": one of ["rates","inventory","demand","policy","local_market","macro"], ` +
      `"direction": one of ["bullish","bearish","neutral"], "impact": 0-100 integer, "confidence": 0-100 integer, ` +
      `"summary": one plain sentence, "realtor_impact": 1-2 sentences of concrete action for a realtor, ` +
      `"implication": short phrase, "tags": array of 2-4 lowercase keywords}`;
    try {
      const raw = await chatCompletion(system, [{ role: "user", content: user }]);
      const json = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      const arr = JSON.parse(json) as Classification[];
      for (const c of arr) {
        if (typeof c.index === "number" && c.index >= 0 && c.index < chunk.length) {
          map.set(start + c.index, c);
        }
      }
    } catch (e) {
      console.warn("[pull-signals] classify chunk failed, using defaults:", e instanceof Error ? e.message : e);
    }
  }
  return map;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feedUrl = process.env.SIGNALS_FEED_URL || DEFAULT_FEED;

  // ── Fetch + parse the feed ──────────────────────────────────────────────
  let items: FeedItem[] = [];
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "Mozilla/5.0 (LeadMine SignalBot)" } });
    if (!res.ok) throw new Error(`Feed responded ${res.status}`);
    items = parseFeed(await res.text()).slice(0, 12);
  } catch (e) {
    console.error("[pull-signals] feed fetch failed:", e);
    return NextResponse.json({ error: "feed fetch failed" }, { status: 502 });
  }
  if (items.length === 0) return NextResponse.json({ inserted: 0, message: "no items in feed" });

  const supabase = createServiceClient();

  // ── Dedupe against signals we've already ingested ───────────────────────
  const { data: existing } = await supabase
    .from("market_signals")
    .select("external_id")
    .eq("source_name", SOURCE_NAME)
    .in("external_id", items.map((i) => i.guid));
  const seen = new Set((existing ?? []).map((r: { external_id: string }) => r.external_id));
  const fresh = items.filter((i) => !seen.has(i.guid));

  if (fresh.length === 0) return NextResponse.json({ inserted: 0, scanned: items.length, message: "no new items" });

  // ── Classify + insert ───────────────────────────────────────────────────
  const classes = await classify(fresh);
  let inserted = 0;

  for (let i = 0; i < fresh.length; i++) {
    const it = fresh[i];
    const c = classes.get(i);
    const category  = c && (VALID_CATEGORIES as readonly string[]).includes(c.category) ? c.category : "macro";
    const direction = c && (VALID_DIRECTIONS as readonly string[]).includes(c.direction) ? c.direction : "neutral";
    const impact    = clamp(c?.impact ?? 50);
    const confidence = clamp(c?.confidence ?? 50);
    const pub = it.pubDate ? new Date(it.pubDate) : new Date();
    const publishedAt = isNaN(pub.getTime()) ? new Date().toISOString() : pub.toISOString();

    const { data: sig, error: sigErr } = await supabase
      .from("market_signals")
      .insert({
        source_name:      SOURCE_NAME,
        source_type:      "api",
        source_url:       it.link || null,
        external_id:      it.guid,
        headline:         it.title.slice(0, 300),
        summary:          c?.summary ?? null,
        category,
        geography:        "national",
        region:           "US",
        signal_direction: direction,
        confidence_score: confidence,
        impact_score:     impact,
        is_high_impact:   impact >= 70,
        tags:             (c?.tags ?? []).slice(0, 5),
        status:           "active",
        published_at:     publishedAt,
        raw_data:         { source: it.source },
      })
      .select("id")
      .single();

    if (sigErr || !sig) {
      console.warn("[pull-signals] insert signal failed:", sigErr?.message);
      continue;
    }

    await supabase.from("signal_interpretations").insert({
      signal_id:                sig.id,
      ai_summary:               c?.summary ?? it.title,
      ai_realtor_impact:        c?.realtor_impact ?? "Monitor this development for impact on your local market and client conversations.",
      ai_suggested_implication: c?.implication ?? null,
      is_current:               true,
    });
    inserted++;
  }

  console.log(`[pull-signals] inserted ${inserted} new signals (${fresh.length} fresh of ${items.length} scanned)`);
  return NextResponse.json({ inserted, fresh: fresh.length, scanned: items.length });
}
