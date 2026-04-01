-- ============================================
-- LEAD PIPELINE & AI CALLING SYSTEM
-- ============================================

-- Extend leads table with pipeline fields (idempotent)
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new'
    CHECK (stage IN ('new','contacted','qualified','booked','dead')),
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS qualification JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_stage_changed ON leads(stage_changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_last_contact ON leads(last_contact_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);

-- ============================================
-- CALL RECORDS
-- ============================================
CREATE TABLE IF NOT EXISTS call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  direction TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed','no_answer','voicemail','busy','failed')),
  duration_seconds INTEGER DEFAULT 0,
  transcript JSONB DEFAULT '[]'::jsonb,
  recording_url TEXT,
  sentiment TEXT DEFAULT 'neutral'
    CHECK (sentiment IN ('positive','neutral','negative','mixed')),
  ai_summary TEXT,
  objections_raised TEXT[] DEFAULT '{}',
  outcome TEXT
    CHECK (outcome IN ('appointment_set','follow_up_needed','not_interested','callback_requested','qualified','escalated')),
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_records_realtor ON call_records(realtor_id);
CREATE INDEX IF NOT EXISTS idx_call_records_lead ON call_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_records_agent ON call_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_records_status ON call_records(status);
CREATE INDEX IF NOT EXISTS idx_call_records_outcome ON call_records(outcome);
CREATE INDEX IF NOT EXISTS idx_call_records_started ON call_records(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_records_sentiment ON call_records(sentiment);

-- ============================================
-- FOLLOW-UP ACTIVITIES
-- ============================================
CREATE TABLE IF NOT EXISTS follow_up_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('call','sms','email')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','opened','replied','failed')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  content TEXT,
  sequence_step INTEGER DEFAULT 1,
  sequence_name TEXT,
  response_text TEXT,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_followups_realtor ON follow_up_activities(realtor_id);
CREATE INDEX IF NOT EXISTS idx_followups_lead ON follow_up_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_followups_agent ON follow_up_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_followups_status ON follow_up_activities(status);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled ON follow_up_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followups_channel ON follow_up_activities(channel);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  booked_by_agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_type TEXT DEFAULT 'consultation'
    CHECK (meeting_type IN ('consultation','showing','listing_presentation','follow_up','closing')),
  location TEXT,
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','cancelled','completed','no_show')),
  conversation_summary TEXT,
  qualification_snapshot JSONB DEFAULT '{}'::jsonb,
  key_talking_points TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_realtor ON appointments(realtor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_agent ON appointments(booked_by_agent_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- ============================================
-- OBJECTION SCRIPTS
-- ============================================
CREATE TABLE IF NOT EXISTS objection_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  category TEXT NOT NULL
    CHECK (category IN ('price','timing','competition','financing','location','general')),
  objection_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  effectiveness_score INTEGER DEFAULT 50
    CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objections_realtor ON objection_scripts(realtor_id);
CREATE INDEX IF NOT EXISTS idx_objections_agent ON objection_scripts(agent_id);
CREATE INDEX IF NOT EXISTS idx_objections_category ON objection_scripts(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_scripts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "call_records_own" ON call_records;
  DROP POLICY IF EXISTS "followups_own" ON follow_up_activities;
  DROP POLICY IF EXISTS "appointments_own" ON appointments;
  DROP POLICY IF EXISTS "objection_scripts_own" ON objection_scripts;
END $$;

CREATE POLICY "call_records_own" ON call_records
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

CREATE POLICY "followups_own" ON follow_up_activities
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

CREATE POLICY "appointments_own" ON appointments
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

CREATE POLICY "objection_scripts_own" ON objection_scripts
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );
