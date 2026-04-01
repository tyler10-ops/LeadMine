-- ============================================
-- VAPI.AI CALLING INTEGRATION
-- Adds Vapi-specific columns to call_records
-- ============================================

-- Vapi call ID for webhook lookups (unique per call)
ALTER TABLE call_records
  ADD COLUMN IF NOT EXISTS vapi_call_id TEXT;

-- Vapi recording + cost metadata
ALTER TABLE call_records
  ADD COLUMN IF NOT EXISTS vapi_recording_url TEXT,
  ADD COLUMN IF NOT EXISTS vapi_cost          NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS raw_analysis       JSONB,
  ADD COLUMN IF NOT EXISTS ended_at           TIMESTAMPTZ;

-- Index for fast webhook lookups by vapi_call_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_call_records_vapi_call_id
  ON call_records(vapi_call_id)
  WHERE vapi_call_id IS NOT NULL;
