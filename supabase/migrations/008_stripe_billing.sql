-- 008_stripe_billing.sql

-- 1. Update clients.plan CHECK constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_plan_check;
ALTER TABLE clients
  ADD CONSTRAINT clients_plan_check
    CHECK (plan IN ('free', 'miner', 'operator', 'brokerage'));

-- Migrate legacy values
UPDATE clients SET plan = 'miner'    WHERE plan = 'pro';
UPDATE clients SET plan = 'operator' WHERE plan = 'enterprise';

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id              UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id        TEXT,
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'miner', 'operator', 'brokerage')),
  billing_interval       TEXT
                           CHECK (billing_interval IN ('month', 'year') OR billing_interval IS NULL),
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN NOT NULL DEFAULT false,
  trial_end              TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_client_id ON subscriptions (client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions (stripe_subscription_id);

-- 3. RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read own subscription" ON subscriptions;
END $$;

CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
