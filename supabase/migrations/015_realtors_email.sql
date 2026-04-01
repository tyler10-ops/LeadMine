-- Add email column to realtors so outreach emails can use reply-to
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS email TEXT;
