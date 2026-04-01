-- 006_clients.sql
-- Clients table: maps authenticated users to their business profile.

CREATE TABLE IF NOT EXISTS clients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name    TEXT NOT NULL,
  industry         TEXT,
  target_locations TEXT[] DEFAULT '{}',
  plan             TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients (user_id);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own client" ON clients;
  DROP POLICY IF EXISTS "Users can update own client" ON clients;
  DROP POLICY IF EXISTS "Users can insert own client" ON clients;
END $$;

CREATE POLICY "Users can read own client"
  ON clients FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own client"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own client"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);
