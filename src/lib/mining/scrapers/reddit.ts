/**
 * Reddit Social Signal Scraper
 *
 * Searches city subreddits and real estate communities for buyer/seller
 * intent posts. Uses Reddit's public JSON API — no auth required.
 *
 * Rate limit: ~60 req/min unauthenticated. Scraper limits to 4 subreddits
 * per location to stay well within limits.
 */

export interface SocialSignalRecord {
  sourceId:    string;
  source:      "reddit" | "craigslist";
  signalType:  "buyer_intent" | "seller_intent" | "housing_wanted";
  title:       string;
  body:        string;
  author:      string | null;
  url:         string;
  city:        string;
  state:       string;
  postedAt:    string;
  phone:       string | null;
  score:       number; // 0–100
  keywords:    string[];
  rawData:     Record<string, unknown>;
}

// ── City → subreddit map ───────────────────────────────────────────────────

const CITY_SUBREDDITS: Record<string, string[]> = {
  austin:       ["Austin", "ATXHousing"],
  houston:      ["houston", "HoustonRealEstate"],
  dallas:       ["Dallas", "DFWRealEstate"],
  miami:        ["miami", "MiamiRealEstate"],
  chicago:      ["chicago", "ChicagoRealEstate"],
  seattle:      ["Seattle", "seattlehome"],
  denver:       ["Denver", "DenverRealEstate"],
  atlanta:      ["Atlanta", "AtlantaRealEstate"],
  phoenix:      ["phoenix", "azrealestate"],
  "las vegas":  ["vegaslocals", "LasVegas"],
  tampa:        ["tampa", "FloridaRealEstate"],
  orlando:      ["orlando", "FloridaRealEstate"],
  charlotte:    ["Charlotte", "Charlotte_RealEstate"],
  nashville:    ["nashville", "NashvilleRealEstate"],
  portland:     ["Portland", "portlandrealestate"],
  "san antonio":  ["sanantonio", "sanantoniorealestate"],
};

const GENERAL_SUBREDDITS = [
  "RealEstate",
  "FirstTimeHomeBuyer",
  "personalfinance",
  "REBubble",
];

// ── Intent keyword sets ────────────────────────────────────────────────────

const BUYER_KEYWORDS = [
  "looking to buy", "want to buy", "trying to buy", "first time buyer",
  "pre-approved", "house hunting", "looking for a home", "moving to",
  "relocating to", "need a house", "searching for homes", "buying a home",
  "FHA loan", "down payment", "closing costs", "open house",
];

const SELLER_KEYWORDS = [
  "need to sell", "have to sell", "selling my house", "sell fast",
  "moving out", "downsizing", "inherited property", "probate",
  "behind on mortgage", "underwater", "distressed property",
  "cash offer", "as-is", "quick sale", "tired landlord",
  "want to sell", "looking to sell", "selling our home",
  "job relocation", "divorce", "estate sale",
];

// ── Reddit post type ───────────────────────────────────────────────────────

interface RedditPost {
  id:           string;
  title:        string;
  selftext:     string;
  author:       string;
  subreddit:    string;
  permalink:    string;
  score:        number;
  num_comments: number;
  created_utc:  number;
  url:          string;
}

// ── Scraper ────────────────────────────────────────────────────────────────

export class RedditScraper {
  readonly name = "reddit";

  async scrape(location: string): Promise<SocialSignalRecord[]> {
    const [cityRaw, stateRaw] = location.split(",").map((s) => s.trim());
    const city  = cityRaw?.toLowerCase() ?? "";
    const state = stateRaw ?? "";

    const citySubreddits = CITY_SUBREDDITS[city] ?? [];
    const subreddits     = [...citySubreddits, ...GENERAL_SUBREDDITS].slice(0, 5);

    const records: SocialSignalRecord[] = [];

    for (const sub of subreddits) {
      try {
        const posts = await this.fetchSubreddit(sub);
        for (const post of posts) {
          const record = this.classify(post, cityRaw, state);
          if (record) records.push(record);
        }
        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 300));
      } catch {
        // Skip failed subreddits silently
      }
    }

    return records;
  }

  private async fetchSubreddit(subreddit: string): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=50`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "LeadMine/1.0 signal-scraper (real estate lead intelligence)",
        "Accept":     "application/json",
      },
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) return [];

    const json = await res.json() as { data?: { children?: { data: RedditPost }[] } };
    return json?.data?.children?.map((c) => c.data) ?? [];
  }

  private classify(
    post: RedditPost,
    city: string,
    state: string
  ): SocialSignalRecord | null {
    const text = `${post.title} ${post.selftext}`.toLowerCase();

    const buyerMatches  = BUYER_KEYWORDS.filter((k) => text.includes(k));
    const sellerMatches = SELLER_KEYWORDS.filter((k) => text.includes(k));
    const totalMatches  = buyerMatches.length + sellerMatches.length;

    // Must have at least one intent signal
    if (totalMatches === 0) return null;

    const signalType: SocialSignalRecord["signalType"] =
      sellerMatches.length >= buyerMatches.length ? "seller_intent" : "buyer_intent";

    // Score: keyword density + engagement
    const keywordScore  = Math.min(totalMatches * 15, 60);
    const engagementBonus = post.num_comments > 10 ? 10 : post.num_comments > 3 ? 5 : 0;
    const score = Math.min(keywordScore + engagementBonus + 20, 100);

    return {
      sourceId:  `reddit-${post.id}`,
      source:    "reddit",
      signalType,
      title:     post.title.slice(0, 150),
      body:      post.selftext.slice(0, 800),
      author:    post.author !== "[deleted]" ? post.author : null,
      url:       `https://reddit.com${post.permalink}`,
      city,
      state,
      postedAt:  new Date(post.created_utc * 1000).toISOString(),
      phone:     extractPhone(post.selftext),
      score,
      keywords:  [...sellerMatches, ...buyerMatches],
      rawData: {
        subreddit:   post.subreddit,
        upvotes:     post.score,
        comments:    post.num_comments,
        buyerSignals:  buyerMatches,
        sellerSignals: sellerMatches,
      },
    };
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function extractPhone(text: string): string | null {
  const match = text.match(/(\+?1?\s?)?(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})/);
  return match?.[0]?.trim() ?? null;
}