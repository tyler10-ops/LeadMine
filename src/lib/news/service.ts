import type { NewsArticle, NewsArticleCategory } from "@/types";

// ============================================
// Provider interface — swap this implementation
// to integrate a real RSS feed, NewsAPI, etc.
// ============================================

export interface NewsProvider {
  fetchArticles(): Promise<NewsArticle[]>;
}

// ============================================
// Mock provider (date-seeded, rotates daily)
// ============================================

const SOURCES = [
  "HousingWire",
  "Inman",
  "Realtor.com",
  "NAR Research",
  "Mortgage News Daily",
  "CNBC Real Estate",
] as const;

interface ArticleTemplate {
  headline: string;
  summary: string;
  source: (typeof SOURCES)[number];
  category: NewsArticleCategory;
}

const ARTICLE_POOL: ArticleTemplate[] = [
  {
    headline: "Existing Home Sales Rise for Third Consecutive Month",
    summary:
      "Sales of previously owned homes climbed 2.4% in the latest report, driven by increased inventory and stabilizing mortgage rates attracting sidelined buyers.",
    source: "NAR Research",
    category: "housing_market",
  },
  {
    headline: "30-Year Mortgage Rate Dips Below 6.5%, Boosting Buyer Demand",
    summary:
      "The average 30-year fixed rate fell to 6.42% this week, marking the lowest level in four months and prompting a surge in purchase applications.",
    source: "Mortgage News Daily",
    category: "mortgage_rates",
  },
  {
    headline: "New Listings Surge 12% Year-Over-Year in Key Metro Areas",
    summary:
      "Fresh supply entering the market is giving buyers more options, with notable gains in Phoenix, Austin, and Tampa as sellers respond to stabilizing prices.",
    source: "Realtor.com",
    category: "inventory",
  },
  {
    headline: "FHA Announces Lower Down Payment Thresholds for First-Time Buyers",
    summary:
      "New guidelines from the Federal Housing Administration reduce minimum down payments on qualifying properties, expanding access for entry-level purchasers.",
    source: "HousingWire",
    category: "policy",
  },
  {
    headline: "Buyer Confidence Index Reaches 18-Month High",
    summary:
      "Consumer sentiment toward home purchasing has strengthened significantly, with affordability improvements and job market stability cited as leading factors.",
    source: "NAR Research",
    category: "buyer_seller_trends",
  },
  {
    headline: "Median Home Price Hits Record $420K Amid Low Inventory in Northeast",
    summary:
      "Tight supply in the Northeast corridor continues to push prices higher, with multiple-offer situations returning in suburban markets.",
    source: "CNBC Real Estate",
    category: "housing_market",
  },
  {
    headline: "Adjustable-Rate Mortgages See Renewed Interest as Spreads Widen",
    summary:
      "With the gap between ARM and fixed rates widening, more borrowers are opting for 5/1 and 7/1 products to lower initial monthly payments.",
    source: "Mortgage News Daily",
    category: "mortgage_rates",
  },
  {
    headline: "Housing Starts Jump 8% as Builders Respond to Demand",
    summary:
      "Single-family housing starts rose sharply last month, signaling builder confidence in sustained demand despite elevated construction costs.",
    source: "HousingWire",
    category: "inventory",
  },
  {
    headline: "Senate Committee Advances Bipartisan Housing Supply Bill",
    summary:
      "The proposed legislation incentivizes local governments to ease zoning restrictions, aiming to add 1.5 million new housing units over the next decade.",
    source: "Inman",
    category: "policy",
  },
  {
    headline: "Remote Work Continues to Reshape Suburban Housing Demand",
    summary:
      "Markets within a two-hour drive of major metros are seeing outsized price gains as hybrid workers prioritize space and affordability over commute time.",
    source: "Realtor.com",
    category: "buyer_seller_trends",
  },
  {
    headline: "Pending Home Sales Indicator Signals Stronger Spring Market",
    summary:
      "Forward-looking contract signings rose 3.1% month-over-month, suggesting the spring selling season will outpace last year's activity levels.",
    source: "NAR Research",
    category: "housing_market",
  },
  {
    headline: "Mortgage Application Volume Climbs for Fifth Straight Week",
    summary:
      "Both purchase and refinance applications increased as rates eased, with first-time buyer share reaching 34% of total activity.",
    source: "Mortgage News Daily",
    category: "mortgage_rates",
  },
  {
    headline: "Active Listings Still 25% Below Pre-Pandemic Levels Nationally",
    summary:
      "Despite gains in new listings, the total number of homes for sale remains well below 2019 norms, keeping upward pressure on prices in most markets.",
    source: "Realtor.com",
    category: "inventory",
  },
  {
    headline: "Property Tax Reform Proposals Gain Traction in Several States",
    summary:
      "Legislators in Texas, Florida, and California are advancing measures to cap assessment increases, potentially affecting home valuations and local revenue.",
    source: "Inman",
    category: "policy",
  },
  {
    headline: "Millennial Buyers Now Represent Largest Share of Home Purchases",
    summary:
      "The generation has overtaken all other age groups in purchase volume, with growing household formation and delayed buying creating pent-up demand.",
    source: "CNBC Real Estate",
    category: "buyer_seller_trends",
  },
  {
    headline: "Home Price Appreciation Slows to 3.8% Annually, Rebalancing Markets",
    summary:
      "The deceleration from double-digit gains signals a healthier market, with several Sun Belt metros shifting from seller's to balanced conditions.",
    source: "HousingWire",
    category: "housing_market",
  },
  {
    headline: "Fed Signals Potential Rate Cut, Mortgage Markets React",
    summary:
      "Futures pricing in a 25-basis-point cut at the next meeting sent mortgage rates lower, with lenders reporting an immediate uptick in lock activity.",
    source: "Mortgage News Daily",
    category: "mortgage_rates",
  },
  {
    headline: "New Construction Inventory Reaches Highest Level Since 2008",
    summary:
      "Builder-held homes available for immediate move-in hit a 16-year high, giving new-construction buyers more negotiating leverage on price and upgrades.",
    source: "CNBC Real Estate",
    category: "inventory",
  },
  {
    headline: "NAR Settlement Changes Take Effect, Reshaping Commission Structures",
    summary:
      "New rules requiring written buyer agreements and decoupled commissions are changing how agents negotiate compensation and represent clients.",
    source: "Inman",
    category: "policy",
  },
  {
    headline: "Cash Buyers Account for Record 32% of Transactions",
    summary:
      "All-cash purchases continue to climb as investors and equity-rich repeat buyers bypass financing challenges, intensifying competition for entry-level homes.",
    source: "NAR Research",
    category: "buyer_seller_trends",
  },
];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function generateMockArticles(): NewsArticle[] {
  const seed = dateSeed();
  const shuffled = seededShuffle(ARTICLE_POOL, seed);
  const selected = shuffled.slice(0, 6);
  const today = new Date();

  return selected.map((tpl, i) => {
    const published = new Date(today);
    published.setHours(published.getHours() - i * 4 - 1);

    return {
      id: `news-${seed}-${i}`,
      headline: tpl.headline,
      summary: tpl.summary,
      source: tpl.source,
      sourceUrl: "#",
      publishedAt: published.toISOString(),
      category: tpl.category,
    };
  });
}

const mockProvider: NewsProvider = {
  async fetchArticles() {
    return generateMockArticles();
  },
};

// ============================================
// Public API — consumers call this function.
// Swap `currentProvider` to use a real source.
// ============================================

let currentProvider: NewsProvider = mockProvider;

export function setNewsProvider(provider: NewsProvider) {
  currentProvider = provider;
}

export async function fetchRealEstateNews(): Promise<NewsArticle[]> {
  return currentProvider.fetchArticles();
}
