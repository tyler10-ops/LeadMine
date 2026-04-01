-- 010_notifications.sql
-- Daily notification preferences and web push subscriptions

-- ── Notification preferences ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id      UUID REFERENCES realtors(id) ON DELETE CASCADE UNIQUE,
  email_enabled   BOOLEAN DEFAULT true,
  push_enabled    BOOLEAN DEFAULT false,
  send_time       TEXT DEFAULT '08:00',   -- HH:MM in user's timezone
  timezone        TEXT DEFAULT 'America/Chicago',
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Realtors manage own notification prefs" ON notification_preferences;
  DROP POLICY IF EXISTS "Realtors manage own push subscriptions" ON push_subscriptions;
END $$;

CREATE POLICY "Realtors manage own notification prefs" ON notification_preferences
  FOR ALL USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

CREATE INDEX IF NOT EXISTS idx_notif_prefs_realtor ON notification_preferences (realtor_id);

-- ── Web push subscriptions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id  UUID REFERENCES realtors(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (realtor_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Realtors manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = (SELECT user_id FROM realtors WHERE id = realtor_id));

CREATE INDEX IF NOT EXISTS idx_push_subs_realtor ON push_subscriptions (realtor_id);
