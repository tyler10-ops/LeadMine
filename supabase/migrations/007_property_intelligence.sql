-- 007_property_intelligence.sql

-- Extend leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS property_address       TEXT,
  ADD COLUMN IF NOT EXISTS property_city          TEXT,
  ADD COLUMN IF NOT EXISTS property_state         TEXT,
  ADD COLUMN IF NOT EXISTS property_zip           TEXT,
  ADD COLUMN IF NOT EXISTS property_county        TEXT,
  ADD COLUMN IF NOT EXISTS property_type          TEXT CHECK (property_type IN ('single_family','condo','multi_family','townhouse','land','commercial','mobile_home')),
  ADD COLUMN IF NOT EXISTS owner_name             TEXT,
  ADD COLUMN IF NOT EXISTS owner_mailing_address  TEXT,
  ADD COLUMN IF NOT EXISTS owner_mailing_city     TEXT,
  ADD COLUMN IF NOT EXISTS owner_mailing_state    TEXT,
  ADD COLUMN IF NOT EXISTS owner_mailing_zip      TEXT,
  ADD COLUMN IF NOT EXISTS is_absentee_owner      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_owner_occupied      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS years_owned            NUMERIC,
  ADD COLUMN IF NOT EXISTS last_sale_date         DATE,
  ADD COLUMN IF NOT EXISTS last_sale_price        NUMERIC,
  ADD COLUMN IF NOT EXISTS assessed_value         NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_value        NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_equity       NUMERIC,
  ADD COLUMN IF NOT EXISTS equity_percent         NUMERIC,
  ADD COLUMN IF NOT EXISTS opportunity_type       TEXT CHECK (opportunity_type IN ('seller','buyer','investor')),
  ADD COLUMN IF NOT EXISTS opportunity_score      INTEGER DEFAULT 0 CHECK (opportunity_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS signal_flags           TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS data_source            TEXT DEFAULT 'county_assessor',
  ADD COLUMN IF NOT EXISTS external_property_id  TEXT,
  ADD COLUMN IF NOT EXISTS raw_property_data      JSONB,
  ADD COLUMN IF NOT EXISTS search_area_id         UUID;

CREATE INDEX IF NOT EXISTS idx_leads_property_zip      ON leads (property_zip);
CREATE INDEX IF NOT EXISTS idx_leads_property_county   ON leads (property_county);
CREATE INDEX IF NOT EXISTS idx_leads_property_state    ON leads (property_state);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_type  ON leads (opportunity_type);
CREATE INDEX IF NOT EXISTS idx_leads_opportunity_score ON leads (opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_absentee          ON leads (is_absentee_owner) WHERE is_absentee_owner = true;
CREATE INDEX IF NOT EXISTS idx_leads_search_area       ON leads (search_area_id);

-- Search Areas
CREATE TABLE IF NOT EXISTS search_areas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id      UUID REFERENCES realtors(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  zip_codes       TEXT[] DEFAULT '{}',
  cities          TEXT[] DEFAULT '{}',
  counties        TEXT[] DEFAULT '{}',
  state           TEXT,
  property_types  TEXT[] DEFAULT '{}',
  min_years_owned NUMERIC DEFAULT 0,
  min_equity_pct  NUMERIC DEFAULT 0,
  opportunity_types TEXT[] DEFAULT '{seller,buyer,investor}',
  last_mined_at   TIMESTAMPTZ,
  total_leads     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE search_areas ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors manage own search areas" ON search_areas;
END $$;

CREATE POLICY "Realtors manage own search areas"
  ON search_areas FOR ALL
  USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

-- Mining Jobs
CREATE TABLE IF NOT EXISTS mining_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id      UUID REFERENCES realtors(id) ON DELETE CASCADE,
  search_area_id  UUID REFERENCES search_areas(id) ON DELETE SET NULL,
  queue_job_id    TEXT,
  status          TEXT DEFAULT 'queued' CHECK (status IN ('queued','running','complete','failed','cancelled')),
  phase           TEXT,
  records_found   INTEGER DEFAULT 0,
  records_graded  INTEGER DEFAULT 0,
  records_saved   INTEGER DEFAULT 0,
  duplicates_skipped INTEGER DEFAULT 0,
  elite_count     INTEGER DEFAULT 0,
  refined_count   INTEGER DEFAULT 0,
  rock_count      INTEGER DEFAULT 0,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mining_jobs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors see own mining jobs" ON mining_jobs;
END $$;

CREATE POLICY "Realtors see own mining jobs"
  ON mining_jobs FOR ALL
  USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

CREATE INDEX IF NOT EXISTS idx_mining_jobs_realtor ON mining_jobs (realtor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mining_jobs_status  ON mining_jobs (status);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id  UUID REFERENCES realtors(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('mining_complete','elite_gem_found','mining_failed','export_ready','system')),
  title       TEXT NOT NULL,
  body        TEXT,
  metadata    JSONB DEFAULT '{}',
  read        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors see own notifications" ON notifications;
END $$;

CREATE POLICY "Realtors see own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

CREATE INDEX IF NOT EXISTS idx_notifications_realtor_unread
  ON notifications (realtor_id, created_at DESC)
  WHERE read = false;

-- Lead Exports
CREATE TABLE IF NOT EXISTS lead_exports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id   UUID REFERENCES realtors(id) ON DELETE CASCADE,
  lead_ids     UUID[] NOT NULL,
  export_type  TEXT DEFAULT 'csv' CHECK (export_type IN ('csv','json')),
  filters_used JSONB,
  record_count INTEGER,
  exported_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lead_exports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors see own exports" ON lead_exports;
END $$;

CREATE POLICY "Realtors see own exports"
  ON lead_exports FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));
