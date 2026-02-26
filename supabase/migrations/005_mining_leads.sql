-- ============================================
-- LEAD MINING PIPELINE — Schema Updates
-- ============================================
-- Extends the leads table to support the mining orchestrator's
-- output columns (client_id, company_name, industry, source_url,
-- gem_grade, enrichment_data) and broadens the intent CHECK to
-- accept hot|warm|cold alongside the legacy buyer|seller|investor|unknown.

-- ── 1. Add client_id (nullable — old rows still use realtor_id) ─────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- ── 2. Make realtor_id nullable (backward compat) ───────────────────
ALTER TABLE leads
  ALTER COLUMN realtor_id DROP NOT NULL;

-- ── 3. Add missing columns ──────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS gem_grade TEXT DEFAULT 'ungraded'
    CHECK (gem_grade IN ('elite', 'refined', 'rock', 'ungraded')),
  ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}'::jsonb;

-- ── 4. Widen intent CHECK to include mining values ──────────────────
-- Drop the original constraint added in 001_initial.sql, then re-add
-- with the full set of allowed values.
ALTER TABLE leads
  DROP CONSTRAINT IF EXISTS leads_intent_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_intent_check
    CHECK (intent IN ('buyer', 'seller', 'investor', 'unknown', 'hot', 'warm', 'cold'));

-- ── 5. Indexes for mining queries ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_gem_grade ON leads(gem_grade);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);

-- ── 6. RLS policy: allow service-role inserts for mining ────────────
-- The orchestrator uses createServiceClient() which bypasses RLS,
-- but we add an explicit policy for client_id-based reads so
-- dashboard queries work for mining-sourced leads.
CREATE POLICY "leads_client_id_read" ON leads
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM realtors WHERE user_id = auth.uid()
    )
  );
