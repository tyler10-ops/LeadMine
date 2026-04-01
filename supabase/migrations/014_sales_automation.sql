-- ── LeadMine Sales Automation Schema ──────────────────────────────────────
-- Tracks prospects for LeadMine's own B2B sales pipeline.
-- Prospects are realtors/brokerages discovered via mining or manual entry.

-- ── Prospects — potential LeadMine customers ──────────────────────────────
CREATE TABLE IF NOT EXISTS prospects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  name              TEXT,                          -- contact name (agent or owner)
  business_name     TEXT NOT NULL,                 -- brokerage or solo agent business
  email             TEXT,
  phone             TEXT,
  website           TEXT,

  -- Location
  city              TEXT,
  state             TEXT,
  zip               TEXT,

  -- Source
  source            TEXT NOT NULL DEFAULT 'google_places',
  -- 'google_places', 'manual', 'referral', 'inbound', 'linkedin'
  google_place_id   TEXT UNIQUE,
  google_rating     NUMERIC(2,1),
  google_reviews    INTEGER,

  -- Pipeline stage
  stage             TEXT NOT NULL DEFAULT 'discovered',
  -- 'discovered' → 'emailed' → 'replied' → 'demo_booked' → 'trial' → 'paid' → 'churned' → 'dead'
  stage_changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scoring
  score             INTEGER NOT NULL DEFAULT 0,    -- 0-100, higher = better prospect
  score_reason      TEXT,

  -- Outreach state
  sequence_id       UUID,                          -- which email sequence they're in
  sequence_step     INTEGER NOT NULL DEFAULT 0,    -- which step they're on
  last_emailed_at   TIMESTAMPTZ,
  next_email_at     TIMESTAMPTZ,
  email_opens       INTEGER NOT NULL DEFAULT 0,
  email_clicks      INTEGER NOT NULL DEFAULT 0,
  replied_at        TIMESTAMPTZ,
  unsubscribed_at   TIMESTAMPTZ,
  unsubscribed      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Demo / close tracking
  demo_booked_at    TIMESTAMPTZ,
  demo_notes        TEXT,
  trial_started_at  TIMESTAMPTZ,
  converted_at      TIMESTAMPTZ,
  stripe_customer_id TEXT,

  -- Notes
  notes             TEXT,
  tags              TEXT[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_prospects_stage       ON prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_next_email  ON prospects(next_email_at) WHERE next_email_at IS NOT NULL AND unsubscribed = FALSE;
CREATE INDEX IF NOT EXISTS idx_prospects_state       ON prospects(state);
CREATE INDEX IF NOT EXISTS idx_prospects_score       ON prospects(score DESC);

-- ── Email sequences — drip campaign definitions ────────────────────────────
CREATE TABLE IF NOT EXISTS email_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT NOT NULL,
  description TEXT,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  target_stage TEXT NOT NULL DEFAULT 'discovered'  -- auto-enroll prospects at this stage
);

-- ── Sequence steps — individual emails in a sequence ──────────────────────
CREATE TABLE IF NOT EXISTS sequence_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id   UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number   INTEGER NOT NULL,
  delay_days    INTEGER NOT NULL DEFAULT 0,   -- days after previous step (0 = same day)
  subject       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  body_text     TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(sequence_id, step_number)
);

-- ── Outreach log — every email sent ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prospect_id   UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  sequence_id   UUID REFERENCES email_sequences(id),
  step_number   INTEGER,
  email_to      TEXT NOT NULL,
  subject       TEXT NOT NULL,
  resend_id     TEXT,                         -- Resend message ID
  status        TEXT NOT NULL DEFAULT 'sent', -- 'sent','delivered','opened','clicked','bounced','failed'
  opened_at     TIMESTAMPTZ,
  clicked_at    TIMESTAMPTZ,
  bounced_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outreach_log_prospect ON outreach_log(prospect_id);

-- ── SEO pages — programmatic landing pages ────────────────────────────────
CREATE TABLE IF NOT EXISTS seo_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  slug          TEXT NOT NULL UNIQUE,           -- e.g. 'ai-calling-realtors-houston-tx'
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  state_abbr    TEXT NOT NULL,
  title         TEXT NOT NULL,
  meta_desc     TEXT NOT NULL,
  h1            TEXT NOT NULL,
  hero_copy     TEXT NOT NULL,
  published     BOOLEAN NOT NULL DEFAULT FALSE,
  views         INTEGER NOT NULL DEFAULT 0,
  leads_from_page INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_seo_pages_slug      ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_published ON seo_pages(published) WHERE published = TRUE;

-- ── Campaign tracking — UTM / source attribution ──────────────────────────
CREATE TABLE IF NOT EXISTS campaign_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id    TEXT,
  event_type    TEXT NOT NULL,  -- 'pageview','signup','demo_request','trial_start'
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  page_slug     TEXT,
  prospect_id   UUID REFERENCES prospects(id),
  metadata      JSONB DEFAULT '{}'
);

-- ── Auto-update updated_at ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prospects_updated_at ON prospects;
CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed the core outreach sequence ───────────────────────────────────────
INSERT INTO email_sequences (id, name, description, target_stage) VALUES
  ('a1000000-0000-0000-0000-000000000001',
   'Cold Realtor Outreach',
   'Automated 5-step sequence for newly discovered realtor prospects',
   'discovered')
ON CONFLICT DO NOTHING;

INSERT INTO sequence_steps (sequence_id, step_number, delay_days, subject, body_text, body_html) VALUES

-- Step 1: Day 0 — Cold intro
('a1000000-0000-0000-0000-000000000001', 1, 0,
 'Your leads are going cold while you sleep',
$$Hi {{name}},

Quick question — what happens to a lead that comes in at 11pm on a Friday?

For most agents, it sits until Monday. By then, they've already talked to 2 other realtors.

I built LeadMine to fix that. It's an AI that calls your leads within 60 seconds, qualifies them, and books appointments — 24/7, no staff required.

We're working with a small group of agents in {{city}} right now. Want to see it call a real lead?

Tyler
LeadMine$$,
$$<p>Hi {{name}},</p>
<p>Quick question — what happens to a lead that comes in at 11pm on a Friday?</p>
<p>For most agents, it sits until Monday. By then, they've already talked to 2 other realtors.</p>
<p>I built <strong>LeadMine</strong> to fix that. It's an AI that calls your leads within 60 seconds, qualifies them, and books appointments — 24/7, no staff required.</p>
<p>We're working with a small group of agents in {{city}} right now. Want to see it call a real lead?</p>
<p>Tyler<br>LeadMine</p>$$),

-- Step 2: Day 3 — Social proof angle
('a1000000-0000-0000-0000-000000000001', 2, 3,
 'The agent who stopped chasing leads',
$$Hi {{name}},

Wanted to share something from a realtor we onboarded last month.

She was spending 2 hours a day calling new leads and only reaching about 30% of them. The rest went cold.

After 3 weeks with LeadMine, she said: "I showed up Monday and had 4 appointments already booked. I didn't call anyone."

That's what happens when an AI calls every lead within a minute of them submitting — day or night.

If you want to see how it works for {{business_name}}, I can set up a 15-minute demo this week.

Tyler$$,
$$<p>Hi {{name}},</p>
<p>Wanted to share something from a realtor we onboarded last month.</p>
<p>She was spending 2 hours a day calling new leads and only reaching about 30% of them. The rest went cold.</p>
<p>After 3 weeks with LeadMine, she said: <em>"I showed up Monday and had 4 appointments already booked. I didn't call anyone."</em></p>
<p>That's what happens when an AI calls every lead within a minute of them submitting — day or night.</p>
<p>If you want to see how it works for {{business_name}}, I can set up a 15-minute demo this week.</p>
<p>Tyler</p>$$),

-- Step 3: Day 7 — Demo offer
('a1000000-0000-0000-0000-000000000001', 3, 4,
 'Live demo — watch the AI call a lead right now',
$$Hi {{name}},

I want to do something different.

Instead of telling you what LeadMine does, let me show you in real time.

Give me any phone number — yours, a team member's, anyone — and I'll trigger the AI to call it live on a 15-minute Zoom. You'll hear exactly what your leads hear, and see the qualification summary it generates automatically.

No pitch, no pressure. Just the demo.

If it doesn't impress you, we end the call and you've lost 15 minutes.

Want to book a slot this week?

Tyler$$,
$$<p>Hi {{name}},</p>
<p>I want to do something different.</p>
<p>Instead of telling you what LeadMine does, let me show you in real time.</p>
<p>Give me any phone number — yours, a team member's, anyone — and I'll trigger the AI to call it live on a 15-minute Zoom. You'll hear exactly what your leads hear, and see the qualification summary it generates automatically.</p>
<p><strong>No pitch, no pressure. Just the demo.</strong></p>
<p>If it doesn't impress you, we end the call and you've lost 15 minutes.</p>
<p>Want to book a slot this week?</p>
<p>Tyler</p>$$),

-- Step 4: Day 14 — ROI angle
('a1000000-0000-0000-0000-000000000001', 4, 7,
 'What does one extra deal per month mean to you?',
$$Hi {{name}},

Last email from me on this, I promise.

The math on LeadMine is pretty simple:

If you close one extra deal per month because a lead got called at 11pm instead of sitting cold — what's that worth to you?

For the average agent in {{city}}, that's $6,000-$12,000 in commission.

LeadMine starts at $97/month.

I'm not going to keep emailing. But if the timing ever makes sense, the demo offer stands.

Tyler
leadmine.ai$$,
$$<p>Hi {{name}},</p>
<p>Last email from me on this, I promise.</p>
<p>The math on LeadMine is pretty simple:</p>
<p>If you close one extra deal per month because a lead got called at 11pm instead of sitting cold — what's that worth to you?</p>
<p>For the average agent in {{city}}, that's $6,000–$12,000 in commission.</p>
<p>LeadMine starts at $97/month.</p>
<p>I'm not going to keep emailing. But if the timing ever makes sense, the demo offer stands.</p>
<p>Tyler<br>leadmine.ai</p>$$),

-- Step 5: Day 30 — Re-engage / breakup
('a1000000-0000-0000-0000-000000000001', 5, 16,
 'Closing your file — unless?',
$$Hi {{name}},

I've been reaching out for about a month and haven't heard back — totally fair, you're busy.

I'm going to close your file on my end. But before I do, one last ask:

Is lead follow-up actually a problem for you right now? If not, no worries at all and I'll leave you alone.

If it is, reply "yes" and I'll send you a link to book the demo. That's it.

Either way — good luck out there.

Tyler$$,
$$<p>Hi {{name}},</p>
<p>I've been reaching out for about a month and haven't heard back — totally fair, you're busy.</p>
<p>I'm going to close your file on my end. But before I do, one last ask:</p>
<p>Is lead follow-up actually a problem for you right now? If not, no worries at all and I'll leave you alone.</p>
<p>If it is, reply <strong>"yes"</strong> and I'll send you a link to book the demo. That's it.</p>
<p>Either way — good luck out there.</p>
<p>Tyler</p>$$)

ON CONFLICT DO NOTHING;
