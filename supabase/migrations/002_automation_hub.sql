-- ============================================
-- REALTOR AUTOMATION HUB — Extended Schema
-- ============================================

CREATE TABLE IF NOT EXISTS ai_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('voice', 'sms', 'email', 'social', 'listing', 'booking')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  description TEXT,
  performance_score INTEGER DEFAULT 0 CHECK (performance_score >= 0 AND performance_score <= 100),
  response_success_rate NUMERIC(5,2) DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0,
  completion_rate NUMERIC(5,2) DEFAULT 0,
  error_rate NUMERIC(5,2) DEFAULT 0,
  key_metric_label TEXT DEFAULT 'Interactions',
  key_metric_value INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_assets_realtor ON ai_assets(realtor_id);
CREATE INDEX IF NOT EXISTS idx_ai_assets_status ON ai_assets(status);
CREATE INDEX IF NOT EXISTS idx_ai_assets_type ON ai_assets(type);

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error', 'draft')),
  success_rate NUMERIC(5,2) DEFAULT 0,
  failure_rate NUMERIC(5,2) DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  modules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automations_realtor ON automations(realtor_id);
CREATE INDEX IF NOT EXISTS idx_automations_asset ON automations(asset_id);
CREATE INDEX IF NOT EXISTS idx_automations_status ON automations(status);

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  trigger_source TEXT NOT NULL,
  action_executed TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'partial', 'skipped')),
  reason TEXT,
  ai_decision_summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_realtor ON automation_logs(realtor_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_asset ON automation_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_outcome ON automation_logs(outcome);
CREATE INDEX IF NOT EXISTS idx_automation_logs_timestamp ON automation_logs(timestamp DESC);

CREATE TABLE IF NOT EXISTS market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT,
  source TEXT,
  source_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('rates', 'inventory', 'policy', 'local', 'economy', 'forecast')),
  tags TEXT[] DEFAULT '{}',
  ai_analysis TEXT,
  region TEXT DEFAULT 'national',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_market_news_category ON market_news(category);
CREATE INDEX IF NOT EXISTS idx_market_news_published ON market_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_region ON market_news(region);

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  ai_handled_leads INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  estimated_commission NUMERIC(12,2) DEFAULT 0,
  avg_response_time_ms INTEGER DEFAULT 0,
  total_automations_run INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  conversations_started INTEGER DEFAULT 0,
  UNIQUE(realtor_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_realtor_date ON analytics_snapshots(realtor_id, date DESC);

ALTER TABLE ai_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "ai_assets_own" ON ai_assets;
  DROP POLICY IF EXISTS "automations_own" ON automations;
  DROP POLICY IF EXISTS "automation_logs_own" ON automation_logs;
  DROP POLICY IF EXISTS "analytics_snapshots_own" ON analytics_snapshots;
END $$;

CREATE POLICY "ai_assets_own" ON ai_assets
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));

CREATE POLICY "automations_own" ON automations
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));

CREATE POLICY "automation_logs_own" ON automation_logs
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));

CREATE POLICY "analytics_snapshots_own" ON analytics_snapshots
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));
