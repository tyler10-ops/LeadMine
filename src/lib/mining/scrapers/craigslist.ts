/**
 * Craigslist Housing Signal Scraper
 *
 * Fetches the "housing wanted" RSS feed from city-specific Craigslist
 * subdomains. No API key or auth required — public RSS feeds.
 *
 * Sections scraped:
 *   /search/hsw — housing wanted (people looking to buy/rent)
 */

import type { SocialSignalRecord } from "./reddit";

// ── City → Craigslist subdomain map ───────────────────────────────────────

const CITY_SUBDOMAINS: Record<string, string> = {
  austin:        "austin",
  houston:       "houston",
  dallas:        "dallas",
  miami:         "miami",
  chicago:       "chicago",
  seattle:       "seattle",
  denver:        "denver",
  atlanta:       "atlanta",
  phoenix:       "phoenix",
  "las vegas":   "lasvegas",
  tampa:         "tampa",
  orlando:       "orlando",
  charlotte:     "charlotte",
  nashville:     "nashville",
  portland:      "portland",
  "san antonio": "sanantonio",
  "los angeles": "losangeles",
  "san diego":   "sandiego",
  "new york":    "newyork",
  boston:        "boston",
  minneapolis:   "minneapolis",
  "kansas city": "kansascity",
  "salt lake":   "saltlakecity",
  raleigh:       "raleigh",
  sacramento:    "sacramento",
};

const BUYER_KEYWORDS = [
  "looking to buy", "want to buy", "cash buyer", "pre-approved",
  "house hunting", "first time", "relocating", "moving to",
  "need a house", "searching", "investor", "flip",
];

const SELLER_KEYWORDS = [
  "need to sell", "must sell", "quick sale", "as-is",
  "cash offer", "selling my home", "motivated seller",
  "behind on payments", "foreclosure", "inherited",
  "downsizing", "estate sale", "divorce",
];

// ── Scraper ────────────────────────────────────────────────────────────────

export class CraigslistScraper {
  readonly name = "craigslist";

  async scrape(location: string): Promise<SocialSignalRecord[]> {
    const [cityRaw, stateRaw] = location.split(",").map((s) => s.trim());
    const city      = cityRaw?.toLowerCase() ?? "";
    const state     = stateRaw ?? "";
    const subdomain = CITY_SUBDOMAINS[city];

    if (!subdomain) return [];

    try {
      const records = await this.fetchHousingWanted(subdomain, cityRaw, state);
      return records;
    } catch {
      return [];
    }
  }

  private async fetchHousingWanted(
    subdomain: string,
    city: string,
    state: string
  ): Promise<SocialSignalRecord[]> {
    const url = `https://${subdomain}.craigslist.org/search/hsw?format=rss`;

    const res = await fetch(url, {
      headers: { "User-Agent": "LeadMine/1.0 signal-scraper" },
      signal:  AbortSignal.timeout(15_000),
    });

    if (!res.ok) return [];

    const xml  = await res.text();
    const items = parseRssItems(xml);
    const records: SocialSignalRecord[] = [];

    for (const item of items) {
      const record = this.classify(item, city, state);
      if (record) records.push(record);
    }

    return records;
  }

  private classify(
    item: RssItem,
    city: string,
    state: string
  ): SocialSignalRecord | null {
    const text = `${item.title} ${item.description}`.toLowerCase();

    const buyerMatches  = BUYER_KEYWORDS.filter((k) => text.includes(k));
    const sellerMatches = SELLER_KEYWORDS.filter((k) => text.includes(k));

    // Craigslist "housing wanted" is inherently buyer intent — always include
    const signalType: SocialSignalRecord["signalType"] =
      sellerMatches.length > buyerMatches.length ? "seller_intent" : "housing_wanted";

    const totalMatches = buyerMatches.length + sellerMatches.length;
    const score        = Math.min(25 + totalMatches * 15, 100);

    const postId = item.link.split("/").pop()?.replace(".html", "") ?? item.link;

    return {
      sourceId:  `craigslist-${postId}`,
      source:    "craigslist",
      signalType,
      title:     item.title.slice(0, 150),
      body:      item.description.replace(/<[^>]+>/g, " ").slice(0, 600).trim(),
      author:    null,
      url:       item.link,
      city,
      state,
      postedAt:  item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      phone:     extractPhone(item.description),
      score,
      keywords:  [...sellerMatches, ...buyerMatches],
      rawData: {
        rawTitle:      item.title,
        buyerSignals:  buyerMatches,
        sellerSignals: sellerMatches,
      },
    };
  }
}

// ── RSS parser ─────────────────────────────────────────────────────────────

interface RssItem {
  title:       string;
  link:        string;
  description: string;
  pubDate:     string | null;
}

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemBlocks = xml.split("<item>").slice(1);

  for (const block of itemBlocks) {
    const title       = extractTag(block, "title");
    const link        = extractTag(block, "link") || extractCdataTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate     = extractTag(block, "pubDate");

    if (title && link) {
      items.push({ title, link, description: description ?? "", pubDate });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return (match?.[1] ?? match?.[2])?.trim() ?? null;
}

function extractCdataTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]>`));
  return match?.[1]?.trim() ?? null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  return match?.[0]?.trim() ?? null;
}