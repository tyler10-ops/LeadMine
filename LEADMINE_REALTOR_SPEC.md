# LeadMine Realtor Targeting System — Implementation Spec

## Overview

Transform LeadMine from a generic B2B lead miner into a **realtor-focused lead intelligence platform**. Realtors sign up, define their target market, and the system mines, scores, ranks, and helps them reach out to high-value buyer/seller opportunities.

## Phase 1: Database Migration (009_realtor_targeting.sql)

### Extend `search_areas` table (realtor targeting profile)

Add these columns to the existing `search_areas` table:

```sql
ALTER TABLE search_areas
  ADD COLUMN IF NOT EXISTS min_price NUMERIC,          -- minimum home value filter
  ADD COLUMN IF NOT EXISTS max_price NUMERIC,          -- maximum home value filter
  ADD COLUMN IF NOT EXISTS lead_type_preference TEXT DEFAULT 'both'
    CHECK (lead_type_preference IN ('buyers', 'sellers', 'both')),
  ADD COLUMN IF NOT EXISTS seller_signals TEXT[] DEFAULT '{}',
    -- e.g. {'high_equity', 'long_ownership', 'absentee_owner', 'recently_renovated', 'likely_downsize'}
  ADD COLUMN IF NOT EXISTS buyer_signals TEXT[] DEFAULT '{}',
    -- e.g. {'first_time_buyer', 'luxury_buyer', 'investor', 'relocation_buyer'}
  ADD COLUMN IF NOT EXISTS deal_goal TEXT DEFAULT '1-2'
    CHECK (deal_goal IN ('1-2', '3-5', '5+')),
  ADD COLUMN IF NOT EXISTS is_onboarding_profile BOOLEAN DEFAULT false;
```

### Add heat score fields to `leads` table

```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS heat_score INTEGER DEFAULT 0 CHECK (heat_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS heat_tier TEXT DEFAULT 'cold'
    CHECK (heat_tier IN ('cold', 'warm', 'hot', 'diamond')),
  ADD COLUMN IF NOT EXISTS heat_breakdown JSONB DEFAULT '{}'::jsonb,
    -- { location_match: 18, property_intent: 22, recent_activity: 15, ... }
  ADD COLUMN IF NOT EXISTS heat_reasoning TEXT,
    -- AI-generated explanation of why this lead scored as it did
  ADD COLUMN IF NOT EXISTS heat_scored_at TIMESTAMPTZ;
```

### Create `outreach_drafts` table

```sql
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  channel TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'call_script')),
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'urgent')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'rejected')),
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Realtors manage own outreach drafts" ON outreach_drafts
  FOR ALL USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_lead ON outreach_drafts(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_realtor ON outreach_drafts(realtor_id, created_at DESC);
```

## Phase 2: Realtor Targeting Onboarding Card

Create a new component: `src/components/onboarding/targeting-card.tsx`

This is a multi-step form that appears after signup. It collects:

### Step 1: Target Market
- City/cities input (text, comma-separated)
- ZIP codes input (text, comma-separated)

### Step 2: Property Preferences
- Property types (multi-select checkboxes): Single Family, Condos, Multi-Family, Luxury, Investment
- Price range: min/max sliders or inputs

### Step 3: Lead Type
- Buyers / Sellers / Both (radio buttons)

### Step 4: Signal Filters (optional, collapsible)
- Seller signals checkboxes: Homes owned 5+ years, High equity, Recently renovated, Absentee owners, Likely to downsize
- Buyer signals checkboxes: First time buyers, Luxury buyers, Investors, Relocation buyers

### Step 5: Deal Goal
- How many deals/month? Radio: 1-2, 3-5, 5+

### On Submit:
- Save to `search_areas` with `is_onboarding_profile = true`
- Redirect to dashboard

**Design:**
- Use the existing cave theme (CAVE, GEM, GLOW constants from `src/lib/cave-theme.ts`)
- Dark background, glowing gem accents
- Mining metaphor: "Configure Your Mining Zone" / "Set Your Mining Parameters"
- Pickaxe icon, gem indicators

Create a page at `src/app/onboarding/page.tsx` that renders this card.

## Phase 3: Heat Score Engine

Create `src/lib/scoring/heat-score.ts`

### Scoring Framework (total = 100 points):

```typescript
interface HeatScoreBreakdown {
  location_match: number;      // max 20 — lead is in agent's target ZIP/city
  property_intent: number;     // max 25 — signals they may buy/sell soon
  recent_activity: number;     // max 20 — recent listing searches, property engagement
  property_value: number;      // max 10 — higher value = larger commission
  contact_completeness: number; // max 10 — has phone, email, name
  market_competition: number;  // max 5 — lower competition areas score higher
  behavior_signals: number;    // max 10 — online real estate activity
}

interface HeatScoreResult {
  score: number;               // 0-100
  tier: 'cold' | 'warm' | 'hot' | 'diamond';
  breakdown: HeatScoreBreakdown;
  reasoning: string;           // AI-generated explanation
}
```

### Tier thresholds:
- 0–40 → Cold (red gem)
- 41–70 → Warm (yellow gem)
- 71–85 → Hot (green gem)
- 86–100 → Diamond (glowing emerald/white)

### Function signature:
```typescript
export async function calculateHeatScore(
  lead: PropertyLead,
  targetingProfile: SearchArea
): Promise<HeatScoreResult>
```

The scoring logic should be deterministic for the numeric breakdown. The `reasoning` field should be generated by calling the Anthropic API (already in dependencies) to produce a 2-3 sentence explanation.

### API Route: `src/app/api/leads/score/route.ts`
- POST: accepts `{ leadId }`, fetches lead + realtor's targeting profile, calculates score, saves to DB
- Can also accept `{ leadIds: string[] }` for batch scoring

## Phase 4: Ranked Lead Dashboard

Overhaul `src/app/dashboard/leads/page.tsx` to show heat-scored lead cards.

### Layout:
- Top: summary stats (total leads, diamonds, hot, warm, cold counts)
- Filter bar: by tier, lead type, location, date range
- Main: ranked list of lead cards sorted by heat_score DESC

### Lead Card Component (`src/components/leads/heat-lead-card.tsx`):

Each card shows:
- **Heat Score** — large number with gem color glow
- **Tier badge** — "Diamond Lead" / "Hot Lead" etc. with gem icon
- **Lead Type** — Buyer / Seller
- **Location** — city, state
- **Estimated Property Value** — formatted currency
- **Signal pills** — tags showing why they scored high (from signal_flags + heat_breakdown)
- **Contact info** — name, email, phone (if available)
- **Outreach button** — "Draft Message" opens outreach generator

### Gem Colors (use existing theme):
- Cold = `GEM.red`
- Warm = `GEM.yellow`
- Hot = `GEM.green`
- Diamond = new — use white/cyan glow: `#00FFD4` or similar emerald

### Add diamond gem color to `src/lib/cave-theme.ts`:
```typescript
// Add to GEM object:
diamond: '#00FFD4',
```

## Phase 5: AI Outreach Draft Generator

### API Route: `src/app/api/outreach/generate/route.ts`

POST body: `{ leadId, channel: 'email' | 'sms' | 'call_script', tone: 'professional' | 'casual' | 'urgent' }`

1. Fetch the lead data + realtor profile
2. Call Anthropic Claude to generate a personalized outreach message using lead data (property value, location, signals, heat reasoning)
3. Save draft to `outreach_drafts` table
4. Return the draft for display

### UI Component: `src/components/outreach/outreach-modal.tsx`

A modal/drawer that:
1. Shows the generated message
2. Allows editing
3. Has "Approve" and "Regenerate" buttons
4. On approve: updates status to 'approved'
5. Does NOT auto-send — human-in-the-loop only

### Integrate into lead card:
- "Draft Message" button on each lead card opens the outreach modal
- Pre-fills with lead data

## TypeScript Types

Add to `src/types/index.ts`:

```typescript
// Heat Score
export type HeatTier = 'cold' | 'warm' | 'hot' | 'diamond';

export interface HeatScoreBreakdown {
  location_match: number;
  property_intent: number;
  recent_activity: number;
  property_value: number;
  contact_completeness: number;
  market_competition: number;
  behavior_signals: number;
}

// Outreach
export type OutreachChannel = 'email' | 'sms' | 'call_script';
export type OutreachTone = 'professional' | 'casual' | 'urgent';
export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'rejected';

export interface OutreachDraft {
  id: string;
  realtor_id: string;
  lead_id: string;
  subject: string | null;
  body: string;
  channel: OutreachChannel;
  tone: OutreachTone;
  status: OutreachStatus;
  ai_model: string | null;
  created_at: string;
  updated_at: string;
}

// Extend SearchArea with new targeting fields
// (add to existing SearchArea interface)
// min_price, max_price, lead_type_preference, seller_signals, buyer_signals, deal_goal, is_onboarding_profile
```

## Important Notes

1. **Use existing patterns** — look at how other pages/components are structured (mining page, pipeline page, etc.)
2. **Use existing Supabase client** — `createClient()` from `src/lib/supabase/client` for client-side, service client for server-side
3. **Use existing cave theme** — all colors from `src/lib/cave-theme.ts` (CAVE, GEM, GLOW constants)
4. **Use existing Anthropic SDK** — already in dependencies (`@anthropic-ai/sdk`)
5. **Responsive** — must work on mobile
6. **Migration file** — create as `supabase/migrations/009_realtor_targeting.sql`
7. **Don't break existing functionality** — all additions are additive
