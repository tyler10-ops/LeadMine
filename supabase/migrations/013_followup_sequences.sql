-- ============================================
-- FOLLOW-UP SEQUENCES
-- Adds sequence_id to group activities belonging
-- to the same automated follow-up sequence.
-- ============================================

ALTER TABLE follow_up_activities
  ADD COLUMN IF NOT EXISTS sequence_id UUID;

CREATE INDEX IF NOT EXISTS idx_followups_sequence_id
  ON follow_up_activities(sequence_id);

-- Index for dedup check: find active sequences per lead
CREATE INDEX IF NOT EXISTS idx_followups_lead_status_seq
  ON follow_up_activities(lead_id, status, sequence_name);
