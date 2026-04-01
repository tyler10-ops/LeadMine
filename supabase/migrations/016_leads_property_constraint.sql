-- Add unique constraint on external_property_id for upsert deduplication
-- Allows re-mining the same county without creating duplicate lead records

ALTER TABLE leads
  ADD CONSTRAINT leads_external_property_id_key
  UNIQUE (external_property_id);
