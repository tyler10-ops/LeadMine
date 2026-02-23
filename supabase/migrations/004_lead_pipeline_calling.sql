-- ============================================
-- LEAD PIPELINE & AI CALLING SYSTEM
-- ============================================

-- Extend leads table with pipeline fields
ALTER TABLE leads
  ADD COLUMN stage TEXT DEFAULT 'new'
    CHECK (stage IN ('new','contacted','qualified','booked','dead')),
  ADD COLUMN stage_changed_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN last_contact_at TIMESTAMPTZ,
  ADD COLUMN assigned_agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  ADD COLUMN qualification JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN tags TEXT[] DEFAULT '{}';

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_stage_changed ON leads(stage_changed_at DESC);
CREATE INDEX idx_leads_last_contact ON leads(last_contact_at DESC);
CREATE INDEX idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX idx_leads_tags ON leads USING gin(tags);

-- ============================================
-- CALL RECORDS
-- ============================================
CREATE TABLE call_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  -- Call metadata
  direction TEXT NOT NULL DEFAULT 'outbound'
    CHECK (direction IN ('inbound','outbound')),
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed','no_answer','voicemail','busy','failed')),
  duration_seconds INTEGER DEFAULT 0,
  -- Content
  transcript JSONB DEFAULT '[]'::jsonb,
  recording_url TEXT,
  -- AI analysis
  sentiment TEXT DEFAULT 'neutral'
    CHECK (sentiment IN ('positive','neutral','negative','mixed')),
  ai_summary TEXT,
  objections_raised TEXT[] DEFAULT '{}',
  -- Outcome
  outcome TEXT
    CHECK (outcome IN ('appointment_set','follow_up_needed','not_interested','callback_requested','qualified','escalated')),
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_call_records_realtor ON call_records(realtor_id);
CREATE INDEX idx_call_records_lead ON call_records(lead_id);
CREATE INDEX idx_call_records_agent ON call_records(agent_id);
CREATE INDEX idx_call_records_status ON call_records(status);
CREATE INDEX idx_call_records_outcome ON call_records(outcome);
CREATE INDEX idx_call_records_started ON call_records(started_at DESC);
CREATE INDEX idx_call_records_sentiment ON call_records(sentiment);

-- ============================================
-- FOLLOW-UP ACTIVITIES
-- ============================================
CREATE TABLE follow_up_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  -- Activity details
  channel TEXT NOT NULL CHECK (channel IN ('call','sms','email')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','opened','replied','failed')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  content TEXT,
  -- Sequence tracking
  sequence_step INTEGER DEFAULT 1,
  sequence_name TEXT,
  -- Response tracking
  response_text TEXT,
  response_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_followups_realtor ON follow_up_activities(realtor_id);
CREATE INDEX idx_followups_lead ON follow_up_activities(lead_id);
CREATE INDEX idx_followups_agent ON follow_up_activities(agent_id);
CREATE INDEX idx_followups_status ON follow_up_activities(status);
CREATE INDEX idx_followups_scheduled ON follow_up_activities(scheduled_at);
CREATE INDEX idx_followups_channel ON follow_up_activities(channel);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  booked_by_agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  -- Appointment details
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_type TEXT DEFAULT 'consultation'
    CHECK (meeting_type IN ('consultation','showing','listing_presentation','follow_up','closing')),
  location TEXT,
  -- Status
  status TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','confirmed','cancelled','completed','no_show')),
  -- Handoff content
  conversation_summary TEXT,
  qualification_snapshot JSONB DEFAULT '{}'::jsonb,
  key_talking_points TEXT[] DEFAULT '{}',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointments_realtor ON appointments(realtor_id);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_agent ON appointments(booked_by_agent_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================
-- OBJECTION SCRIPTS
-- ============================================
CREATE TABLE objection_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id UUID NOT NULL REFERENCES realtors(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_assets(id) ON DELETE SET NULL,
  -- Script content
  category TEXT NOT NULL
    CHECK (category IN ('price','timing','competition','financing','location','general')),
  objection_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  -- Effectiveness tracking
  effectiveness_score INTEGER DEFAULT 50
    CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_objections_realtor ON objection_scripts(realtor_id);
CREATE INDEX idx_objections_agent ON objection_scripts(agent_id);
CREATE INDEX idx_objections_category ON objection_scripts(category);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE call_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE objection_scripts ENABLE ROW LEVEL SECURITY;

-- Call records: owner-only
CREATE POLICY "call_records_own" ON call_records
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Follow-up activities: owner-only
CREATE POLICY "followups_own" ON follow_up_activities
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Appointments: owner-only
CREATE POLICY "appointments_own" ON appointments
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );

-- Objection scripts: owner-only
CREATE POLICY "objection_scripts_own" ON objection_scripts
  FOR ALL USING (
    realtor_id IN (SELECT id FROM realtors WHERE user_id = auth.uid())
  );
