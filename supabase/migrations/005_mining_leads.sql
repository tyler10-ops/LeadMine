-- ============================================
-- LEAD MINING PIPELINE — Schema Updates
-- ============================================

-- 1. Add client_id (nullable)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- 2. Make realtor_id nullable (backward compat)
ALTER TABLE leads
  ALTER COLUMN realtor_id DROP NOT NULL;

-- 3. Add missing columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS gem_grade TEXT DEFAULT 'ungraded'
    CHECK (gem_grade IN ('elite', 'refined', 'rock', 'ungraded')),
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}'::jsonb;

-- 4. Widen intent CHECK
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_intent_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_intent_check
    CHECK (intent IN ('buyer', 'seller', 'investor', 'unknown', 'hot', 'warm', 'cold'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_gem_grade ON leads(gem_grade);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);

-- 6. RLS policy for client_id-based reads
DO $$ BEGIN
  DROP POLICY IF EXISTS "leads_client_id_read" ON leads;
END $$;

CREATE POLICY "leads_client_id_read" ON leads
  FOR SELECT USING (
    client_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );
