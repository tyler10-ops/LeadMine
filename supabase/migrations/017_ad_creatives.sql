-- Migration 017: ad_creatives table for the creative worker output

create table if not exists public.ad_creatives (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- Source context
  county          text,
  state           text,
  lead_type       text,
  equity_band     text,
  property_type   text,
  lead_count      integer default 0,

  -- Generated content
  copy            jsonb,       -- { headlines, primaryText, ctas, localHook, hashtags, articleBody }
  images          jsonb,       -- [{ url, variant, composited }]
  video_url       text,        -- Luma Dream Machine animated video URL
  platforms       jsonb,       -- ["instagram_post", "facebook_feed", etc.]
  status          text not null default 'pending'
);

-- Index for querying by status and recency
create index if not exists ad_creatives_status_created
  on public.ad_creatives (status, created_at desc);

-- RLS: service role only (worker writes, dashboard reads via service role)
alter table public.ad_creatives enable row level security;

create policy "Service role full access"
  on public.ad_creatives
  for all
  to service_role
  using (true)
  with check (true);
