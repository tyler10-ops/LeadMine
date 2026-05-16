-- ============================================
-- SMS opt-out tracking (TCPA compliance)
-- Required for A2P 10DLC carriers
-- ============================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_opt_out_at TIMESTAMPTZ;

-- Allow new stage value "do_not_contact" — drop old check if present, re-add
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads
  ADD CONSTRAINT leads_stage_check
    CHECK (stage IS NULL OR stage IN ('new','contacted','qualified','booked','dead','do_not_contact'));

CREATE INDEX IF NOT EXISTS idx_leads_sms_opt_out
  ON leads (sms_opt_out)
  WHERE sms_opt_out = TRUE;

-- Auto-fill sms_opt_out_at on flip to TRUE
CREATE OR REPLACE FUNCTION set_sms_opt_out_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sms_opt_out = TRUE AND (OLD.sms_opt_out IS DISTINCT FROM TRUE) THEN
    NEW.sms_opt_out_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_sms_opt_out_at ON leads;
CREATE TRIGGER trg_set_sms_opt_out_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_sms_opt_out_at();