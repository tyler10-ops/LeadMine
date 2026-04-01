-- ── Activity Log ────────────────────────────────────────────────────────────
-- Tracks every meaningful event in LeadMine for audit, trust, and transparency.

CREATE TABLE IF NOT EXISTS activity_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id    UUID        REFERENCES clients(id)    ON DELETE CASCADE,
  event_type   TEXT        NOT NULL,
  -- e.g. mine_started | mine_completed | mine_failed
  --      lead_scored   | lead_stage_changed | lead_created
  --      outreach_drafted | outreach_sent
  --      settings_updated | market_added | market_removed
  --      login | plan_upgraded | export_downloaded
  entity_type  TEXT,        -- 'lead' | 'mining_job' | 'outreach_draft' | 'settings' | 'subscription'
  entity_id    TEXT,        -- UUID or identifier of the related record
  title        TEXT NOT NULL,   -- Human-readable summary e.g. "Mine completed — 14 gems found"
  description  TEXT,            -- Optional detail
  metadata     JSONB DEFAULT '{}',
  icon         TEXT,            -- emoji or icon hint for the UI: 'pickaxe' | 'gem' | 'outreach' | 'settings' | 'shield'
  severity     TEXT DEFAULT 'info',  -- 'info' | 'success' | 'warning' | 'error'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast dashboard queries
CREATE INDEX IF NOT EXISTS activity_log_user_id_idx      ON activity_log (user_id);
CREATE INDEX IF NOT EXISTS activity_log_client_id_idx    ON activity_log (client_id);
CREATE INDEX IF NOT EXISTS activity_log_created_at_idx   ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS activity_log_event_type_idx   ON activity_log (event_type);

-- RLS: users can only see their own activity
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (true);