/**
 * Seed realistic market signals with interpretations.
 * Run: node scripts/seed-signals.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local
const envContent = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const signals = [
  // === RATES ===
  {
    source_name: "Federal Reserve",
    source_type: "api",
    external_id: "fed-rate-2025-01",
    headline: "Federal Reserve Holds Rates Steady at 4.25-4.50%",
    summary: "The Federal Open Market Committee voted unanimously to maintain the federal funds rate, citing persistent inflation concerns balanced against a resilient labor market.",
    category: "rates",
    geography: "national",
    region: "US",
    tags: ["fed", "interest-rates", "fomc"],
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "Freddie Mac",
    source_type: "api",
    external_id: "freddie-pmms-2025-w4",
    headline: "30-Year Mortgage Rate Drops to 6.62%, Lowest in 3 Months",
    summary: "The average 30-year fixed mortgage rate fell 15 basis points this week, reflecting market expectations for easing monetary policy in H2 2025.",
    category: "rates",
    geography: "national",
    region: "US",
    tags: ["mortgage-rates", "30yr-fixed", "freddie-mac"],
    published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "MBA",
    source_type: "api",
    external_id: "mba-apps-2025-w4",
    headline: "Mortgage Applications Surge 12% as Rates Ease",
    summary: "Weekly mortgage application volume jumped 12.3% with purchase applications rising 9.8% and refinance applications up 18.2%, per the Mortgage Bankers Association.",
    category: "rates",
    geography: "national",
    region: "US",
    tags: ["mortgage-applications", "mba", "purchase", "refinance"],
    published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },

  // === INVENTORY ===
  {
    source_name: "NAR",
    source_type: "api",
    external_id: "nar-ehs-2025-01",
    headline: "Existing Home Sales Rise 4.2% in December, First Annual Gain Since 2021",
    summary: "Existing-home sales totaled 4.24 million (SAAR) in December, up 4.2% year-over-year. Median price reached $387,600. Inventory remains at 3.3 months of supply.",
    category: "inventory",
    geography: "national",
    region: "US",
    tags: ["existing-home-sales", "nar", "housing-inventory"],
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "US Census Bureau",
    source_type: "batch",
    external_id: "census-nhsales-2025-01",
    headline: "New Home Sales Jump 8.7% as Builders Offer Incentives",
    summary: "New single-family home sales reached a seasonally adjusted annual rate of 698,000 in December, driven by builder price concessions and rate buydowns.",
    category: "inventory",
    geography: "national",
    region: "US",
    tags: ["new-home-sales", "census", "builders"],
    published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "Zillow Research",
    source_type: "api",
    external_id: "zillow-inv-2025-01",
    headline: "Active Listings Up 22% Year-Over-Year in Major Metro Areas",
    summary: "Zillow's inventory tracker shows active for-sale listings are up significantly in Sun Belt markets, with Phoenix (+34%), Austin (+41%), and Tampa (+29%) leading gains.",
    category: "inventory",
    geography: "national",
    region: "US",
    tags: ["zillow", "active-listings", "sun-belt"],
    published_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // === DEMAND ===
  {
    source_name: "Redfin Data",
    source_type: "api",
    external_id: "redfin-demand-2025-w4",
    headline: "Home-Tour Demand Hits 14-Month High Nationwide",
    summary: "Redfin's homebuyer demand index shows touring activity at its highest level since November 2023, with first-time buyers accounting for 38% of activity.",
    category: "demand",
    geography: "national",
    region: "US",
    tags: ["redfin", "buyer-demand", "touring"],
    published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "NAR",
    source_type: "api",
    external_id: "nar-buyer-profile-2025",
    headline: "Median First-Time Buyer Age Rises to 36, Highest Ever Recorded",
    summary: "NAR's annual Profile of Home Buyers reports the median age of first-time buyers has reached 36, with student debt and high prices cited as primary barriers.",
    category: "demand",
    geography: "national",
    region: "US",
    tags: ["first-time-buyers", "demographics", "nar"],
    published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // === POLICY ===
  {
    source_name: "HUD",
    source_type: "api",
    external_id: "hud-fha-2025-01",
    headline: "FHA Reduces Annual Mortgage Insurance Premiums by 30 Basis Points",
    summary: "The Federal Housing Administration announced a 30 basis point reduction in annual MIP for standard 30-year loans, effective March 1, saving the average borrower $900/year.",
    category: "policy",
    geography: "national",
    region: "US",
    tags: ["fha", "hud", "mortgage-insurance", "affordability"],
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "NAR",
    source_type: "manual",
    external_id: "nar-settlement-update-2025",
    headline: "NAR Commission Settlement Implementation Enters Phase 2",
    summary: "The second phase of NAR's commission settlement rules takes effect, requiring written buyer agreements before any property showings and eliminating cooperative compensation offers on MLS.",
    category: "policy",
    geography: "national",
    region: "US",
    tags: ["nar-settlement", "commissions", "buyer-agreements"],
    published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // === MACRO ===
  {
    source_name: "BLS",
    source_type: "api",
    external_id: "bls-cpi-2025-01",
    headline: "CPI Inflation Falls to 2.9%, Lowest Since Early 2021",
    summary: "The Consumer Price Index rose 2.9% year-over-year in December. Shelter costs, the largest CPI component, increased 4.6% — still elevated but trending down.",
    category: "macro",
    geography: "national",
    region: "US",
    tags: ["cpi", "inflation", "bls", "shelter-costs"],
    published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "BLS",
    source_type: "api",
    external_id: "bls-jobs-2025-01",
    headline: "Economy Adds 256K Jobs in December, Unemployment Steady at 4.1%",
    summary: "Nonfarm payrolls exceeded expectations with 256,000 new jobs. Construction employment was notably strong at +32,000. Average hourly earnings rose 3.9% YoY.",
    category: "macro",
    geography: "national",
    region: "US",
    tags: ["jobs-report", "employment", "bls", "construction"],
    published_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // === LOCAL MARKET ===
  {
    source_name: "CoreLogic",
    source_type: "api",
    external_id: "corelogic-hpi-austin-2025-01",
    headline: "Austin Home Prices Decline 3.2% YoY as Supply Normalizes",
    summary: "CoreLogic's Home Price Index shows Austin-Round Rock metro area prices down 3.2% year-over-year, the largest decline among major metros. Active inventory is now 5.1 months.",
    category: "local_market",
    geography: "state",
    region: "TX",
    tags: ["austin", "home-prices", "corelogic", "correction"],
    published_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "Redfin Data",
    source_type: "api",
    external_id: "redfin-miami-2025-w4",
    headline: "Miami Condo Prices Flat as Insurance Costs Surge 40%",
    summary: "South Florida condo prices stagnated in Q4 as property insurance costs surged 40% year-over-year, pushing monthly carrying costs up $600+. HOA special assessments are also accelerating.",
    category: "local_market",
    geography: "state",
    region: "FL",
    tags: ["miami", "condos", "insurance", "carrying-costs"],
    published_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "Zillow Research",
    source_type: "api",
    external_id: "zillow-northeast-2025-01",
    headline: "Northeast Markets Outperform: Boston, NYC See 6%+ Price Growth",
    summary: "Constrained supply in Northeast metros is driving above-average appreciation. Boston median up 6.8% YoY and NYC metro up 6.2%, significantly outpacing the national 3.4% average.",
    category: "local_market",
    geography: "state",
    region: "NY",
    tags: ["northeast", "boston", "nyc", "price-growth"],
    published_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },

  // MORE SIGNALS for density
  {
    source_name: "Federal Reserve",
    source_type: "api",
    external_id: "fed-beige-book-2025-01",
    headline: "Fed Beige Book: Housing Activity 'Modestly Improved' Across Districts",
    summary: "The latest Beige Book reports modest improvement in residential real estate activity in 8 of 12 Fed districts, with new construction outpacing existing home sales.",
    category: "macro",
    geography: "national",
    region: "US",
    tags: ["fed", "beige-book", "housing-activity"],
    published_at: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "NAR",
    source_type: "api",
    external_id: "nar-pending-2025-01",
    headline: "Pending Home Sales Index Rises for 4th Consecutive Month",
    summary: "NAR's Pending Home Sales Index increased 2.1% in December, the fourth straight monthly gain, suggesting existing-home sales will continue improving into spring.",
    category: "demand",
    geography: "national",
    region: "US",
    tags: ["pending-sales", "nar", "forward-looking"],
    published_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "CoreLogic",
    source_type: "api",
    external_id: "corelogic-foreclosure-2025-01",
    headline: "Foreclosure Filings Remain Near Historic Lows Despite Rate Pressures",
    summary: "CoreLogic reports foreclosure filings at just 0.32% of all mortgages, well below pre-pandemic levels. Strong equity positions are protecting homeowners from distress.",
    category: "macro",
    geography: "national",
    region: "US",
    tags: ["foreclosures", "corelogic", "equity", "distress"],
    published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "HUD",
    source_type: "api",
    external_id: "hud-housing-starts-2025-01",
    headline: "Housing Starts Drop 4.3% in December on Multifamily Pullback",
    summary: "Total housing starts fell to 1.46M SAAR in December. Single-family starts held steady at 1.05M, but multifamily starts dropped 14% as apartment oversupply concerns grow.",
    category: "inventory",
    geography: "national",
    region: "US",
    tags: ["housing-starts", "multifamily", "construction"],
    published_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    source_name: "MBA",
    source_type: "api",
    external_id: "mba-refi-2025-01",
    headline: "Refinance Share Climbs to 35% of All Applications",
    summary: "The refinance share of mortgage applications rose to 35.2%, the highest since September 2022. Rate/term refis dominate as homeowners locked above 7% seek relief.",
    category: "rates",
    geography: "national",
    region: "US",
    tags: ["refinance", "mba", "mortgage-applications"],
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
];

// Pre-computed interpretations (no AI calls needed for seed data)
const interpretations = {
  "fed-rate-2025-01": {
    ai_summary: "The Fed held rates steady, signaling a wait-and-see approach. This maintains the current mortgage rate environment with rates likely to stay in the mid-6% range near-term.",
    ai_realtor_impact: "No immediate change to client affordability calculations. Use this as a talking point: rates are stable, not rising. This creates urgency for fence-sitters — waiting for dramatically lower rates is risky when inventory is climbing. Push the 'date the rate, marry the house' narrative with buyers.",
    ai_suggested_implication: "Mortgage rates will likely trade sideways for 6-8 weeks until the next Fed meeting in March.",
    affected_asset_types: ["voice", "email", "social"],
    asset_recommendations: [
      { asset_type: "email", action: "Send rate stability update to active buyers", reason: "Reinforce that now is a predictable window to lock", priority: "high" },
      { asset_type: "social", action: "Post market stability content", reason: "Counter uncertainty narrative — stability is good for buyers", priority: "medium" }
    ],
  },
  "freddie-pmms-2025-w4": {
    ai_summary: "Mortgage rates dropped to a 3-month low at 6.62%, improving buyer purchasing power by approximately $15,000 on a median-priced home.",
    ai_realtor_impact: "This is an actionable trigger for your pipeline. Every 25bp drop in rates qualifies thousands of additional buyers. Reach out to leads who were priced out at 7%+ — some may now qualify. For listings, this should generate more showing activity within 1-2 weeks. Update your buyer consultation materials with fresh payment calculations.",
    ai_suggested_implication: "If the downward trend continues, expect spring buying season to be more competitive than last year.",
    affected_asset_types: ["voice", "sms", "email", "social"],
    asset_recommendations: [
      { asset_type: "sms", action: "Text active leads with rate drop alert", reason: "Time-sensitive info that could move fence-sitters to action", priority: "high" },
      { asset_type: "voice", action: "Call pre-approved buyers who paused their search", reason: "Lower rate may bring them back into the market", priority: "high" },
      { asset_type: "email", action: "Send updated payment calculations to active buyers", reason: "Show concrete monthly savings at new rate", priority: "medium" }
    ],
  },
  "mba-apps-2025-w4": {
    ai_summary: "Mortgage applications jumped 12.3% with purchase apps up nearly 10%, indicating genuine buyer demand is responding to the recent rate decline.",
    ai_realtor_impact: "Higher application volume means more qualified buyers entering the market. Expect increased competition for well-priced listings in the next 30-45 days. If you have sellers on the fence about listing, this is your data point: buyer demand is real and growing. Adjust pricing strategies — aggressive pricing may generate multiple offers in hot submarkets.",
    ai_suggested_implication: "Purchase volume momentum typically takes 4-6 weeks to translate into closed transactions.",
    affected_asset_types: ["voice", "email", "listing"],
    asset_recommendations: [
      { asset_type: "listing", action: "Review pricing on active listings — tighten price if needed", reason: "Increasing demand may support firmer pricing", priority: "high" },
      { asset_type: "voice", action: "Call listing prospects with demand data", reason: "Rising applications data supports 'now is a good time to list' pitch", priority: "medium" }
    ],
  },
  "nar-ehs-2025-01": {
    ai_summary: "Existing home sales posted their first annual gain since 2021 at 4.24M SAAR, with inventory still tight at 3.3 months. This confirms the market is unfreezing.",
    ai_realtor_impact: "Transaction volume is finally recovering — this directly impacts your commission pipeline. At 3.3 months of supply, you're still in a seller-favorable market. Listings should move within 30-45 days if priced correctly. Use this data to motivate hesitant sellers: 'Sales are up but inventory is still scarce. Your home has maximum leverage right now.'",
    ai_suggested_implication: "Sales momentum should build through Q1 as seasonal patterns and rate improvements align.",
    affected_asset_types: ["email", "social", "voice"],
    asset_recommendations: [
      { asset_type: "email", action: "Send market recovery newsletter to full database", reason: "Positive data point that supports both buyer and seller confidence", priority: "high" },
      { asset_type: "social", action: "Create infographic showing sales recovery trend", reason: "Visual content drives engagement on market data", priority: "medium" }
    ],
  },
  "census-nhsales-2025-01": {
    ai_summary: "New home sales surged 8.7% as builders aggressively use rate buydowns and price concessions to move inventory. This is pulling buyer demand away from resale.",
    ai_realtor_impact: "Builders are your biggest competition right now. If you're working with buyers, you MUST factor in builder incentives (2-1 buydowns, closing cost credits, upgrade packages) when comparing homes. For sellers, emphasize what resale homes offer that new builds don't: established neighborhoods, mature landscaping, and no 6-12 month wait.",
    ai_suggested_implication: "Builder incentives will likely persist through Q1, creating headwinds for resale pricing in builder-heavy markets.",
    affected_asset_types: ["voice", "email", "listing"],
    asset_recommendations: [
      { asset_type: "voice", action: "Prepare builder incentive comparison for buyer clients", reason: "Buyers need to understand the true cost comparison", priority: "high" },
      { asset_type: "listing", action: "Highlight resale advantages in listing descriptions", reason: "Counter builder competition with differentiation", priority: "medium" }
    ],
  },
  "zillow-inv-2025-01": {
    ai_summary: "Active listings are up 22% nationally with Sun Belt markets seeing 30-40% increases. This is the fastest inventory recovery since the pandemic, fundamentally shifting market dynamics.",
    ai_realtor_impact: "More inventory means longer days on market and more negotiating power for buyers. If you work in Sun Belt markets (Phoenix, Austin, Tampa), adjust seller expectations NOW — properties that sat for 3 days in 2022 may now sit for 30. Price to market, not to comps from 12 months ago. For buyers, this is great news: more choices and less pressure to waive contingencies.",
    ai_suggested_implication: "Sun Belt inventory normalization will continue through 2025. Price corrections of 5-10% are possible in oversupplied submarkets.",
    affected_asset_types: ["listing", "email", "social"],
    asset_recommendations: [
      { asset_type: "listing", action: "Re-evaluate pricing on listings over 21 days on market", reason: "Rising inventory reduces urgency — stale listings will get passed over", priority: "high" },
      { asset_type: "email", action: "Send buyer opportunity alerts in high-inventory markets", reason: "More inventory = more options for buyers, good lead activation moment", priority: "high" }
    ],
  },
  "redfin-demand-2025-w4": {
    ai_summary: "Home touring activity hit a 14-month high, with first-time buyers making up 38% of demand. This is a strong leading indicator for spring transaction volume.",
    ai_realtor_impact: "Touring demand is the best predictor of near-term closings. If you're seeing more showing requests, the data confirms it's a real trend, not just your pipeline. First-time buyers at 38% means many of your prospects need extra hand-holding on process, financing, and expectations. Invest in educational content and first-time buyer programs.",
    ai_suggested_implication: "Spring 2025 will likely see higher transaction volume than spring 2024, though still below 2021-2022 levels.",
    affected_asset_types: ["voice", "booking", "email"],
    asset_recommendations: [
      { asset_type: "booking", action: "Increase availability for showing appointments", reason: "Touring demand is up — capitalize on buyer momentum", priority: "high" },
      { asset_type: "email", action: "Send first-time buyer guide to leads under 40", reason: "First-time buyers are 38% of demand — nurture this segment", priority: "medium" }
    ],
  },
  "nar-buyer-profile-2025": {
    ai_summary: "The median first-time buyer age has risen to 36, reflecting structural affordability challenges. Student debt and high prices are delaying homeownership.",
    ai_realtor_impact: "Your first-time buyer clients are older, more established in careers, and likely have higher incomes but also more debt than previous generations. Adjust your marketing to speak to 30-somethings, not 20-somethings. These buyers want data-driven advice, not emotional pitches. They're comparing buying vs. continuing to rent — have your rent-vs-buy analysis ready.",
    ai_suggested_implication: "Expect continued demographic shifts in buyer pools, with affordability-focused programs becoming more critical for market access.",
    affected_asset_types: ["social", "email"],
    asset_recommendations: [
      { asset_type: "social", action: "Create content targeting 30-36 age demographic", reason: "This is your primary first-time buyer audience now", priority: "medium" },
      { asset_type: "email", action: "Build rent-vs-buy calculator campaign", reason: "Older first-timers need financial justification to make the leap", priority: "medium" }
    ],
  },
  "hud-fha-2025-01": {
    ai_summary: "FHA is cutting annual mortgage insurance premiums by 30 basis points, saving the average borrower $900 per year. This significantly improves affordability for first-time and lower-income buyers.",
    ai_realtor_impact: "This is a BIG deal for FHA-eligible buyers. The MIP reduction effectively adds $10,000-15,000 in buying power. If you work with first-time buyers or moderate-income households, this is your best talking point right now. Update all payment scenarios for FHA buyers. This could reactivate leads who were previously priced out.",
    ai_suggested_implication: "Expect a surge in FHA loan applications starting March 1, particularly from first-time buyers in the $250K-$400K price range.",
    affected_asset_types: ["voice", "sms", "email", "social"],
    asset_recommendations: [
      { asset_type: "sms", action: "Text FHA-eligible leads about premium reduction", reason: "Time-sensitive savings that could reactivate dormant leads", priority: "high" },
      { asset_type: "voice", action: "Call first-time buyer leads with updated affordability numbers", reason: "$900/yr savings could tip the decision for fence-sitters", priority: "high" },
      { asset_type: "social", action: "Post FHA savings breakdown with real numbers", reason: "Concrete savings resonate more than abstract policy changes", priority: "medium" }
    ],
  },
  "nar-settlement-update-2025": {
    ai_summary: "NAR's commission settlement enters Phase 2, requiring written buyer agreements before showings and eliminating cooperative compensation on MLS. This is the biggest structural change to real estate in decades.",
    ai_realtor_impact: "If you haven't fully adapted your buyer representation process, this is urgent. You MUST have signed buyer agreements before any showing. Your value proposition needs to be crystal clear — buyers are now explicitly paying for your services. Invest in training, update your buyer presentation, and have a clear answer for 'why should I pay you?' Agents who adapt will thrive; those who don't will lose market share.",
    ai_suggested_implication: "Expect industry consolidation as agents who can't articulate their value proposition exit the business over the next 12-18 months.",
    affected_asset_types: ["voice", "email", "social"],
    asset_recommendations: [
      { asset_type: "voice", action: "Practice buyer agreement presentation and objection handling", reason: "This is now mandatory before every showing — master it or lose clients", priority: "high" },
      { asset_type: "email", action: "Send buyer FAQ about new commission rules to active leads", reason: "Proactive communication builds trust and reduces confusion", priority: "high" },
      { asset_type: "social", action: "Create educational content about buyer representation value", reason: "Position yourself as transparent and professional during industry transition", priority: "medium" }
    ],
  },
  "bls-cpi-2025-01": {
    ai_summary: "Inflation fell to 2.9%, nearing the Fed's 2% target. However, shelter costs remain elevated at 4.6%, which directly affects housing affordability calculations.",
    ai_realtor_impact: "Falling headline inflation is positive for the rate outlook — the Fed has more room to cut. But shelter inflation at 4.6% means housing costs are still rising faster than wages for many households. Use this in your market analysis: the overall economy is improving, which supports home values, while shelter inflation validates that owning is a hedge against rising rents.",
    ai_suggested_implication: "If shelter inflation continues declining, expect the Fed to begin rate cuts by mid-2025, which would significantly boost housing activity.",
    affected_asset_types: ["email", "social"],
    asset_recommendations: [
      { asset_type: "email", action: "Send inflation update with housing market implications", reason: "Connect macro trends to personal real estate decisions", priority: "medium" },
      { asset_type: "social", action: "Post 'own vs rent' content using shelter inflation data", reason: "Rising rents make ownership more attractive by comparison", priority: "medium" }
    ],
  },
  "bls-jobs-2025-01": {
    ai_summary: "The economy added 256K jobs in December with strong construction employment. Solid job growth supports housing demand, while construction gains suggest inventory relief ahead.",
    ai_realtor_impact: "Strong employment means your buyer pool has income stability and confidence. Construction job growth (+32K) signals that builders are ramping up, which will help supply eventually. The 3.9% wage growth, while cooling, still outpaces current price appreciation in many markets — fundamentals are sound. Share this optimism with clients who are worried about the economy.",
    ai_suggested_implication: "Job market resilience will sustain housing demand through H1 2025, supporting prices in supply-constrained markets.",
    affected_asset_types: ["email", "social"],
    asset_recommendations: [
      { asset_type: "social", action: "Share positive economic outlook content", reason: "Counter doom-and-gloom narratives with actual data", priority: "low" }
    ],
  },
  "corelogic-hpi-austin-2025-01": {
    ai_summary: "Austin home prices fell 3.2% year-over-year with inventory at 5.1 months — officially a buyer's market. This is the most significant price correction in a major metro.",
    ai_realtor_impact: "If you're in Austin, this demands a strategy shift. Seller expectations must be recalibrated — price to current comps, not peak-2022 comps. Buyers have leverage: negotiate hard on price, repairs, and concessions. For agents outside Austin, use this as a cautionary tale when advising sellers who want to overprice. Every market can correct when supply outstrips demand.",
    ai_suggested_implication: "Austin prices may decline another 2-3% before stabilizing, likely finding a floor by mid-2025 as demand catches up to new supply.",
    affected_asset_types: ["listing", "voice", "email"],
    asset_recommendations: [
      { asset_type: "listing", action: "Reprice Austin listings to current market — not aspirational", reason: "Overpriced listings in declining markets generate zero showings", priority: "high" },
      { asset_type: "voice", action: "Have honest pricing conversations with Austin sellers", reason: "Market data supports lower prices — build trust with transparency", priority: "high" }
    ],
  },
  "redfin-miami-2025-w4": {
    ai_summary: "Miami condo market is stalling as insurance costs surge 40% year-over-year, dramatically increasing carrying costs. This is a structural headwind for South Florida condos specifically.",
    ai_realtor_impact: "If you work Miami condos, the insurance/HOA story is your biggest challenge. Monthly carrying costs are up $600+ even if the mortgage payment stays flat. Help buyers do the FULL cost analysis before they fall in love with a unit. For sellers, be prepared to justify pricing against rising carrying costs. Single-family homes in South Florida are a different story — they're holding up better.",
    ai_suggested_implication: "Insurance costs will continue pressuring condo valuations in Florida through 2025 unless state insurance reform succeeds.",
    affected_asset_types: ["voice", "email", "listing"],
    asset_recommendations: [
      { asset_type: "voice", action: "Prepare total cost of ownership analysis for condo buyers", reason: "Insurance and HOA costs are now deal-breakers — address proactively", priority: "high" },
      { asset_type: "listing", action: "Include full carrying cost disclosure in condo listings", reason: "Transparency on costs builds trust and reduces deal fall-throughs", priority: "medium" }
    ],
  },
  "zillow-northeast-2025-01": {
    ai_summary: "Northeast markets (Boston +6.8%, NYC +6.2%) are significantly outperforming the national average due to constrained supply and strong local economies.",
    ai_realtor_impact: "If you're in the Northeast, you're in one of the hottest markets nationally. Use this data to create urgency with buyers and confidence with sellers. For sellers, this justifies premium pricing. For buyers, frame it as: appreciation is strong, so buying now captures equity growth. If you're in a slower market, don't compare yourself to Northeast numbers — different dynamics.",
    ai_suggested_implication: "Northeast appreciation will moderate but remain above-average through 2025 as supply constraints persist.",
    affected_asset_types: ["social", "email", "listing"],
    asset_recommendations: [
      { asset_type: "social", action: "Share local outperformance data with market area highlight", reason: "Local pride + data = high engagement content", priority: "medium" },
      { asset_type: "listing", action: "Price Northeast listings confidently at or above recent comps", reason: "Strong appreciation trend supports aggressive pricing", priority: "medium" }
    ],
  },
  "fed-beige-book-2025-01": {
    ai_summary: "The Fed's Beige Book reports modest housing improvement across 8 of 12 districts, with new construction outpacing existing home sales. The recovery is broadening geographically.",
    ai_realtor_impact: "The Beige Book is the Fed's ground-level economic assessment — and housing is improving. This validates what you're likely seeing in your own market. The fact that new construction is outpacing resale means builders are the current market movers. If you don't have builder relationships, develop them. Builder referral programs can be a significant lead source.",
    ai_suggested_implication: "Broad-based housing improvement supports the case for the Fed maintaining (not raising) rates, which is net positive for the market.",
    affected_asset_types: ["email"],
    asset_recommendations: [
      { asset_type: "email", action: "Include Beige Book summary in weekly market update", reason: "Fed data adds credibility to your market analysis", priority: "low" }
    ],
  },
  "nar-pending-2025-01": {
    ai_summary: "Pending home sales rose for the 4th straight month, a strong forward-looking indicator that closed transactions will increase over the next 1-2 months.",
    ai_realtor_impact: "Four consecutive months of pending sales growth is the strongest momentum signal since 2021. This means your pipeline should be filling up. If it's not, you may need to re-evaluate your lead gen strategy — the market opportunity is there. For team leaders, consider hiring now before the spring rush hits.",
    ai_suggested_implication: "Closed transaction counts in Q1 2025 will likely show 5-8% year-over-year improvement based on pending sale momentum.",
    affected_asset_types: ["voice", "booking"],
    asset_recommendations: [
      { asset_type: "booking", action: "Block extra consultation time for spring surge", reason: "Rising pending sales means more closings ahead — prepare capacity", priority: "medium" }
    ],
  },
  "corelogic-foreclosure-2025-01": {
    ai_summary: "Foreclosure filings remain near historic lows at 0.32% of mortgages. Homeowner equity positions are strong enough to prevent distress even as rates remain elevated.",
    ai_realtor_impact: "This kills the 'foreclosure wave' narrative. When clients ask if they should wait for distressed inventory, point to this data: it's not coming. Homeowners have too much equity to be forced into foreclosure. This supports pricing stability and means the market won't be flooded with cheap distressed properties. Adjust your talking points accordingly.",
    ai_suggested_implication: "Distressed inventory will not be a meaningful market factor in 2025. Supply growth will come from new construction and motivated sellers, not foreclosures.",
    affected_asset_types: ["social", "email"],
    asset_recommendations: [
      { asset_type: "social", action: "Post myth-busting content about foreclosure expectations", reason: "Counter misinformation with data — builds authority", priority: "medium" }
    ],
  },
  "hud-housing-starts-2025-01": {
    ai_summary: "Housing starts fell 4.3% on multifamily weakness, while single-family starts held steady. The pullback in apartment construction signals future rental supply constraints.",
    ai_realtor_impact: "Single-family starts holding steady means builder competition continues for existing-home sellers. The multifamily pullback is interesting long-term: less apartment supply in 2-3 years means rents stay higher, which makes buying more attractive. For investor clients, the rental market thesis remains strong. For buyers considering new builds, pipeline is steady — no supply crunch coming.",
    ai_suggested_implication: "Reduced multifamily starts today will support rental demand and single-family home values in 2026-2027.",
    affected_asset_types: ["email", "voice"],
    asset_recommendations: [
      { asset_type: "voice", action: "Discuss investment opportunity with investor leads", reason: "Declining apartment construction supports future rental demand", priority: "medium" }
    ],
  },
  "mba-refi-2025-01": {
    ai_summary: "Refinance share climbed to 35% of applications, the highest since September 2022. Homeowners locked above 7% are actively seeking rate relief.",
    ai_realtor_impact: "While refis don't directly close deals, they signal financial engagement from homeowners. Many refis trigger move-up conversations: 'While we're at it, should we consider upgrading?' Stay connected with past clients who are refinancing — they may be primed for a move. Also, for your listings, know that refinancing activity reduces the 'lock-in effect' (homeowners unwilling to give up low rates), which should gradually increase listing inventory.",
    ai_suggested_implication: "As more homeowners refinance, the rate lock-in effect will weaken, releasing pent-up inventory into the market over the next 12-18 months.",
    affected_asset_types: ["voice", "email"],
    asset_recommendations: [
      { asset_type: "voice", action: "Call past clients who may be refinancing", reason: "Refi conversations often lead to move-up discussions", priority: "medium" },
      { asset_type: "email", action: "Send 'is refinancing right for you?' content to database", reason: "Helpful financial content keeps you top-of-mind with homeowners", priority: "low" }
    ],
  },
};

async function seedSignals() {
  console.log("Seeding market signals...\n");

  let inserted = 0;
  let skipped = 0;

  for (const sig of signals) {
    const { data, error } = await supabase
      .from("market_signals")
      .upsert(
        {
          ...sig,
          signal_direction: "neutral", // will be overwritten
          confidence_score: 50,
          impact_score: 50,
          impact_factors: {},
          is_high_impact: false,
          raw_data: {},
        },
        { onConflict: "source_name,external_id" }
      )
      .select("id")
      .single();

    if (error) {
      console.error(`  Error: ${sig.headline.slice(0, 60)}...`, error.message);
      skipped++;
      continue;
    }

    // Now run the scorer logic inline
    const BREADTH = { local: 30, state: 60, national: 100 };
    const MAGNITUDE = { rates: 85, policy: 80, macro: 75, inventory: 70, demand: 65, local_market: 55 };
    const CONFIDENCE = {
      "Federal Reserve": 98, "NAR": 92, "HUD": 95, "US Census Bureau": 94,
      "MBA": 88, "CoreLogic": 90, "BLS": 93, "Freddie Mac": 91,
      "Zillow Research": 82, "Redfin Data": 80,
    };
    const HISTORICAL = { policy: 85, rates: 80, macro: 70, inventory: 60, demand: 55 };

    const breadth = BREADTH[sig.geography] || 50;
    const magnitude = MAGNITUDE[sig.category] || 60;
    const confidence = CONFIDENCE[sig.source_name] || 65;
    const histRel = HISTORICAL[sig.category] || 45;

    const impactScore = Math.min(100, Math.max(0, Math.round(
      breadth * 0.20 + magnitude * 0.35 + histRel * 0.20 + confidence * 0.25
    )));
    const isHighImpact = impactScore >= 75;

    // Classify direction from headline
    const text = `${sig.headline} ${sig.summary || ""}`.toLowerCase();
    const bullishTerms = ["rise", "rises", "rising", "increase", "surge", "growth", "gains", "higher", "improve", "recovery", "rebound", "jump"];
    const bearishTerms = ["decline", "drop", "fall", "falling", "decrease", "slows", "contract", "lower", "plunge", "correction", "downturn"];
    let bullish = 0, bearish = 0;
    for (const t of bullishTerms) if (text.includes(t)) bullish++;
    for (const t of bearishTerms) if (text.includes(t)) bearish++;
    if (sig.category === "rates") [bullish, bearish] = [bearish, bullish];
    const direction = bullish > bearish ? "bullish" : bearish > bullish ? "bearish" : "neutral";

    // Update signal with scored values
    await supabase
      .from("market_signals")
      .update({
        signal_direction: direction,
        confidence_score: confidence,
        impact_score: impactScore,
        impact_factors: { breadth, magnitude, historical_relevance: histRel, confidence },
        is_high_impact: isHighImpact,
      })
      .eq("id", data.id);

    // Insert interpretation
    const interpData = interpretations[sig.external_id];
    if (interpData) {
      // Clear old interpretations
      await supabase
        .from("signal_interpretations")
        .update({ is_current: false })
        .eq("signal_id", data.id);

      await supabase
        .from("signal_interpretations")
        .insert({
          signal_id: data.id,
          ...interpData,
          model_used: "claude-sonnet-4-20250514",
          prompt_version: "v1-seed",
          is_current: true,
        });
    }

    const impactLabel = isHighImpact ? " [HIGH IMPACT]" : "";
    console.log(`  ✓ ${direction.toUpperCase().padEnd(7)} ${impactScore.toString().padStart(3)} ${sig.headline.slice(0, 65)}${impactLabel}`);
    inserted++;
  }

  console.log(`\nDone: ${inserted} signals inserted, ${skipped} skipped.`);
}

seedSignals().catch(console.error);
