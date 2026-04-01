-- ============================================
-- MARKET INTELLIGENCE — Core Signal System
-- ============================================

CREATE TABLE IF NOT EXISTS market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('api', 'batch', 'manual', 'derived')),
  source_url TEXT,
  external_id TEXT,
  headline TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  raw_data JSONB DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN ('rates', 'inventory', 'demand', 'policy', 'local_market', 'macro')),
  geography TEXT NOT NULL DEFAULT 'national' CHECK (geography IN ('national', 'state', 'local')),
  region TEXT DEFAULT 'US',
  signal_direction TEXT NOT NULL DEFAULT 'neutral' CHECK (signal_direction IN ('bullish', 'bearish', 'neutral')),
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  impact_score INTEGER DEFAULT 50 CHECK (impact_score >= 0 AND impact_score <= 100),
  impact_factors JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  is_high_impact BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'retracted')),
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_name, external_id)
);

CREATE INDEX IF NOT EXISTS idx_signals_category ON market_signals(category);
CREATE INDEX IF NOT EXISTS idx_signals_geography ON market_signals(geography);
CREATE INDEX IF NOT EXISTS idx_signals_direction ON market_signals(signal_direction);
CREATE INDEX IF NOT EXISTS idx_signals_impact ON market_signals(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_signals_published ON market_signals(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_high_impact ON market_signals(is_high_impact) WHERE is_high_impact = true;
CREATE INDEX IF NOT EXISTS idx_signals_tags ON market_signals USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_signals_region ON market_signals(region);
CREATE INDEX IF NOT EXISTS idx_signals_status ON market_signals(status);

CREATE TABLE IF NOT EXISTS signal_interpretations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_id UUID NOT NULL REFERENCES market_signals(id) ON DELETE CASCADE,
  ai_summary TEXT NOT NULL,
  ai_realtor_impact TEXT NOT NULL,
  ai_suggested_implication TEXT,
  affected_asset_types TEXT[] DEFAULT '{}',
  asset_recommendations JSONB DEFAULT '[]'::jsonb,
  model_used TEXT DEFAULT 'claude-sonnet-4-20250514',
  prompt_version TEXT DEFAULT 'v1',
  generated_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_interpretations_signal ON signal_interpretations(signal_id);
CREATE INDEX IF NOT EXISTS idx_interpretations_current ON signal_interpretations(signal_id) WHERE is_current = true;

CREATE TABLE IF NOT EXISTS alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  categories TEXT[] DEFAULT '{"rates", "inventory", "demand", "policy", "local_market", "macro"}',
  geographies TEXT[] DEFAULT '{"national", "state", "local"}',
  regions TEXT[] DEFAULT '{"US"}',
  min_impact_score INTEGER DEFAULT 70,
  signal_directions TEXT[] DEFAULT '{"bullish", "bearish"}',
  alert_enabled BOOLEAN DEFAULT true,
  alert_channel TEXT DEFAULT 'in_app' CHECK (alert_channel IN ('in_app', 'email', 'both')),
  max_alerts_per_day INTEGER DEFAULT 5,
  last_alert_at TIMESTAMPTZ,
  alerts_sent_today INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(realtor_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_prefs_realtor ON alert_preferences(realtor_id);

CREATE TABLE IF NOT EXISTS signal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  geography TEXT NOT NULL,
  region TEXT DEFAULT 'US',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_signals INTEGER DEFAULT 0,
  bullish_count INTEGER DEFAULT 0,
  bearish_count INTEGER DEFAULT 0,
  neutral_count INTEGER DEFAULT 0,
  avg_impact_score NUMERIC(5,2) DEFAULT 0,
  avg_confidence_score NUMERIC(5,2) DEFAULT 0,
  high_impact_count INTEGER DEFAULT 0,
  period_type TEXT CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category, geography, region, period_start, period_type)
);

CREATE INDEX IF NOT EXISTS idx_signal_history_lookup ON signal_history(category, geography, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_signal_history_period ON signal_history(period_type, period_start DESC);

CREATE TABLE IF NOT EXISTS signal_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  signal_id UUID NOT NULL REFERENCES market_signals(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('viewed', 'expanded', 'dismissed', 'acted_on')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signal_interactions_realtor ON signal_interactions(realtor_id);
CREATE INDEX IF NOT EXISTS idx_signal_interactions_signal ON signal_interactions(signal_id);

ALTER TABLE market_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_interpretations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_interactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "signals_read" ON market_signals;
  DROP POLICY IF EXISTS "interpretations_read" ON signal_interpretations;
  DROP POLICY IF EXISTS "history_read" ON signal_history;
  DROP POLICY IF EXISTS "alert_prefs_own" ON alert_preferences;
  DROP POLICY IF EXISTS "interactions_own" ON signal_interactions;
END $$;

CREATE POLICY "signals_read" ON market_signals FOR SELECT USING (true);
CREATE POLICY "interpretations_read" ON signal_interpretations FOR SELECT USING (true);
CREATE POLICY "history_read" ON signal_history FOR SELECT USING (true);

CREATE POLICY "alert_prefs_own" ON alert_preferences
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));

CREATE POLICY "interactions_own" ON signal_interactions
  FOR ALL USING (realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid()));
