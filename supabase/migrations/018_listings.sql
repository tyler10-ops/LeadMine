-- 018_listings.sql
-- Portfolio listings for realtors

CREATE TABLE IF NOT EXISTS listings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address          TEXT        NOT NULL,
  city             TEXT        NOT NULL,
  state            TEXT        NOT NULL DEFAULT 'CA',
  zip              TEXT,
  price            INTEGER,
  beds             NUMERIC(3,1),
  baths            NUMERIC(3,1),
  sqft             INTEGER,
  status           TEXT        NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'under_contract', 'pending', 'sold', 'expired')),
  list_date        DATE        DEFAULT CURRENT_DATE,
  mls_number       TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status   ON listings (status);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own listings"
  ON listings FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
