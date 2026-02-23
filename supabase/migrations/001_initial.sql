-- ============================================
-- REAL ESTATE AUTOPILOT — Initial Schema
-- ============================================

-- Realtors
CREATE TABLE realtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  tagline TEXT,
  bio TEXT,
  photo_url TEXT,
  brand_color TEXT DEFAULT '#000000',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_realtors_slug ON realtors(slug);
CREATE INDEX idx_realtors_user_id ON realtors(user_id);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  intent TEXT DEFAULT 'unknown' CHECK (intent IN ('buyer', 'seller', 'investor', 'unknown')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  source TEXT DEFAULT 'chat',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leads_realtor ON leads(realtor_id);
CREATE INDEX idx_leads_intent ON leads(intent);
CREATE INDEX idx_leads_created ON leads(created_at);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  intent TEXT,
  gated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_realtor ON conversations(realtor_id);

-- Events (page views, chat starts, etc.)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('page_view', 'chat_start', 'lead_capture', 'content_view')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_realtor ON events(realtor_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created ON events(created_at);

-- Market content
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT CHECK (type IN ('market_pulse', 'buyer_tip', 'seller_warning')),
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_content_realtor ON content(realtor_id);

-- Daily metrics (aggregated)
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  page_views INTEGER DEFAULT 0,
  chat_starts INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  buyer_leads INTEGER DEFAULT 0,
  seller_leads INTEGER DEFAULT 0,
  investor_leads INTEGER DEFAULT 0,
  UNIQUE(realtor_id, date)
);

CREATE INDEX idx_daily_metrics_realtor_date ON daily_metrics(realtor_id, date);

-- Row Level Security
ALTER TABLE realtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Realtors: users can only see/edit their own
CREATE POLICY "realtors_own" ON realtors
  FOR ALL USING (auth.uid() = user_id);

-- Public read for realtor pages (by slug)
CREATE POLICY "realtors_public_read" ON realtors
  FOR SELECT USING (true);

-- Leads: realtors see their own leads
CREATE POLICY "leads_own" ON leads
  FOR SELECT USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Leads: anonymous insert (from chat widget)
CREATE POLICY "leads_insert" ON leads
  FOR INSERT WITH CHECK (true);

-- Conversations: realtors see their own
CREATE POLICY "conversations_own" ON conversations
  FOR SELECT USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Conversations: anonymous insert/update (from chat widget)
CREATE POLICY "conversations_anon_insert" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "conversations_anon_update" ON conversations
  FOR UPDATE USING (true);

-- Events: anyone can insert (tracking)
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (true);

-- Events: realtors see their own
CREATE POLICY "events_own" ON events
  FOR SELECT USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Content: realtors manage their own
CREATE POLICY "content_own" ON content
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Content: public read for published
CREATE POLICY "content_public_read" ON content
  FOR SELECT USING (published = true);

-- Daily metrics: realtors see their own
CREATE POLICY "daily_metrics_own" ON daily_metrics
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );
