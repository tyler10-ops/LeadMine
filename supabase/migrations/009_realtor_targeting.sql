-- 009_realtor_targeting.sql

-- Extend search_areas with targeting profile
ALTER TABLE search_areas
  ADD COLUMN IF NOT EXISTS min_price              NUMERIC,
  ADD COLUMN IF NOT EXISTS max_price              NUMERIC,
  ADD COLUMN IF NOT EXISTS lead_type_preference   TEXT DEFAULT 'both'
    CHECK (lead_type_preference IN ('buyers', 'sellers', 'both')),
  ADD COLUMN IF NOT EXISTS seller_signals         TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS buyer_signals          TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS deal_goal              TEXT DEFAULT '1-2'
    CHECK (deal_goal IN ('1-2', '3-5', '5+')),
  ADD COLUMN IF NOT EXISTS is_onboarding_profile  BOOLEAN DEFAULT false;

-- Extend leads with heat score
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS heat_score       INTEGER DEFAULT 0 CHECK (heat_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS heat_tier        TEXT DEFAULT 'cold'
    CHECK (heat_tier IN ('cold', 'warm', 'hot', 'diamond')),
  ADD COLUMN IF NOT EXISTS heat_breakdown   JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS heat_reasoning   TEXT,
  ADD COLUMN IF NOT EXISTS heat_scored_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_heat_score ON leads (heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_heat_tier  ON leads (heat_tier);

-- Outreach Drafts
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id  UUID REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id     UUID REFERENCES leads(id) ON DELETE CASCADE,
  subject     TEXT,
  body        TEXT NOT NULL,
  channel     TEXT DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'call_script')),
  tone        TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'casual', 'urgent')),
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'rejected')),
  ai_model    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outreach_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors manage own outreach drafts" ON outreach_drafts;
END $$;

CREATE POLICY "Realtors manage own outreach drafts" ON outreach_drafts
  FOR ALL USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

CREATE INDEX IF NOT EXISTS idx_outreach_drafts_lead    ON outreach_drafts (lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_realtor ON outreach_drafts (realtor_id, created_at DESC);
