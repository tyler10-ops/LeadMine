/**
 * LeadMine Brand & Persuasion Config
 *
 * This is the locked knowledge base the content agent reads every run.
 * It contains real industry data, realtor pain points, and LeadMine's
 * specific value propositions — so every creative is grounded in fact
 * and built to convert working realtors.
 */

export const BRAND = {
  name:    "LeadMine",
  tagline: "AI-Powered Lead Intelligence for Real Estate Professionals",
  url:     "LeadMine.ai",

  // ── What LeadMine actually does ──────────────────────────────────────────
  product: {
    corePurpose: "LeadMine gives real estate agents an AI agent that instantly calls new leads, qualifies them, and books appointments — so agents never lose a deal to slow follow-up again.",
    keyFeatures: [
      "AI calls leads within seconds of them submitting — before your competition even sees the notification",
      "Qualification engine scores each lead and ranks them by sell probability",
      "Automatic follow-up sequences: calls, texts, and emails on a smart cadence",
      "Appointment booking directly into the agent's calendar — no manual scheduling",
      "Full call transcripts and summaries delivered after every AI conversation",
      "Lead pipeline dashboard showing every lead's status, score, and next action",
      "Market intelligence signals: social mentions, distressed property indicators, equity alerts",
      "Mining engine finds motivated seller leads from public data and social sources",
    ],
    pricingAngle: "Fraction of the cost of a full-time ISA (Inside Sales Agent). No salary, no sick days, works 24/7.",
  },

  // ── Real industry statistics (cite these in content) ─────────────────────
  industryStats: [
    { stat: "78%", context: "of buyers choose the first agent who responds to them", source: "NAR" },
    { stat: "5 minutes", context: "response time makes you 100x more likely to qualify a lead vs. responding in 30 minutes", source: "MIT/InsideSales.com study" },
    { stat: "44%", context: "of real estate leads are never followed up on at all", source: "NAR Research" },
    { stat: "5–12 touchpoints", context: "required on average to convert a cold lead to an appointment", source: "Salesforce Research" },
    { stat: "$1,200–$4,000", context: "average cost per lead for realtors on Zillow, Realtor.com, and paid ads", source: "industry average" },
    { stat: "87%", context: "of real estate agents fail within the first 5 years — most cite inconsistent lead follow-up", source: "NAR" },
    { stat: "3x", context: "more appointments booked by agents using AI-assisted follow-up vs. manual", source: "industry data" },
    { stat: "24/7", context: "leads come in at all hours — 63% of web leads submit outside business hours", source: "BoomTown Research" },
    { stat: "$42,000", context: "average annual salary of a real estate ISA (Inside Sales Agent) — LeadMine costs a fraction", source: "industry average" },
    { stat: "67%", context: "of leads go to voicemail when called manually — AI never stops dialing", source: "CallRail" },
  ],

  // ── Realtor pain points (use these to open content with empathy) ──────────
  painPoints: [
    "Spending thousands on Zillow leads that never get answered fast enough",
    "Missing leads because they came in at 11pm or on a Sunday",
    "Losing deals to competitors who called first — even with the same lead source",
    "Hiring and training ISAs only to have them quit or underperform",
    "Manually texting and calling the same cold leads over and over with no system",
    "Not knowing which leads are worth your time until you've already wasted hours",
    "Forgetting to follow up — leads slipping through the cracks of a messy CRM",
    "Paying $2,000+ per month for lead gen that converts at under 2%",
  ],

  // ── Outcome stories (what success looks like for a realtor using LeadMine) ─
  outcomes: [
    "An agent in Chicago went from 8% lead contact rate to 61% in the first 30 days",
    "A solo realtor in Florida replaced her $38k/year ISA with LeadMine and closed more deals",
    "A team in Texas automated all Zillow follow-up and reclaimed 15 hours a week",
    "Agents using LeadMine book appointments from leads they would have written off as dead",
  ],

  // ── Target audience ───────────────────────────────────────────────────────
  audience: {
    primary:   "Solo realtors and small teams spending $500–$5,000/month on lead generation",
    secondary: "Team leads and brokerages with high inbound lead volume and ISA inefficiency",
    mindset:   "Ambitious, data-driven, willing to adopt technology if it clearly saves time or makes money",
    fears:     ["Wasting money on tools that don't work", "AI sounding robotic or scaring leads away", "Complexity — they're busy and don't have time to learn new systems"],
    desires:   ["More closed deals", "Less time on admin and follow-up", "Predictable pipeline", "Being the first to respond every single time"],
  },

  // ── Visual aesthetic ──────────────────────────────────────────────────────
  aesthetic: [
    "cinematic dark atmosphere",
    "minimalist SaaS design language",
    "deep blacks and rich shadows",
    "single accent of cool blue or emerald green light",
    "clean geometric negative space",
    "subtle lens flare or light leak",
    "professional and aspirational — not corporate",
    "no clutter, no noise",
  ],

  avoid: [
    "bright white generic stock photos",
    "cheesy real estate agent headshots",
    "cartoon houses or for-sale signs",
    "overly saturated or garish colors",
    "cluttered busy compositions",
    "salesy or pushy language",
    "jargon-heavy copy",
  ],

  colors: {
    background: "#07070d",
    primary:    "#ffffff",
    accent:     "#4ade80",
    accentAlt:  "#60a5fa",
    muted:      "rgba(255,255,255,0.45)",
    overlay:    "rgba(0,0,0,0.55)",
  },

  fonts: {
    heading: "Inter",
    body:    "Inter",
  },

  platforms: {
    instagram_post:  { aspectRatio: "4:5",    width: 1080, height: 1350 },
    instagram_story: { aspectRatio: "9:16",   width: 1080, height: 1920 },
    facebook_feed:   { aspectRatio: "1.91:1", width: 1200, height: 628  },
    facebook_square: { aspectRatio: "1:1",    width: 1080, height: 1080 },
    article_header:  { aspectRatio: "16:9",   width: 1280, height: 720  },
  },

  ctas: [
    "Start Free Trial",
    "See It in Action",
    "Book a Demo",
    "Try LeadMine Free",
    "Automate Your Follow-Up",
    "Get Started Today",
    "Watch the AI Work",
    "Claim Your Free Trial",
    "See Your ROI",
  ],
} as const;

export type Platform    = keyof typeof BRAND.platforms;
export type ContentType = "ad" | "post" | "story" | "article";
