-- ============================================
-- SEED DATA: Realistic sample data for demo
-- Run AFTER creating a realtor account via signup.
-- Replace REALTOR_ID below with your actual realtor ID.
-- ============================================

-- To find your realtor ID, run:
-- SELECT id FROM realtors LIMIT 1;

-- Then replace all occurrences of 'REPLACE_REALTOR_ID' below.

-- STEP 1: Paste your realtor ID here
-- Example: DO $$ DECLARE rid UUID := '12345678-abcd-...'; $$

DO $$
DECLARE
  rid UUID;
BEGIN
  -- Auto-detect first realtor
  SELECT id INTO rid FROM realtors LIMIT 1;

  IF rid IS NULL THEN
    RAISE NOTICE 'No realtor found. Create an account first, then run this seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding data for realtor: %', rid;

  -- ==================
  -- AI ASSETS
  -- ==================
  INSERT INTO ai_assets (realtor_id, name, type, status, description, performance_score, response_success_rate, engagement_rate, completion_rate, error_rate, key_metric_label, key_metric_value, config, last_active_at) VALUES
  (rid, 'Inbound Call AI', 'voice', 'active', 'Handles incoming buyer and seller calls with AI-powered conversation', 87, 92.5, 78.3, 85.1, 2.1, 'Calls Handled', 342, '{"auto_answer": true, "voicemail_fallback": true, "record_calls": true, "sentiment_analysis": true}'::jsonb, now() - interval '3 minutes'),
  (rid, 'SMS Follow-Up AI', 'sms', 'active', 'Automated SMS follow-up sequences for lead nurturing', 91, 95.2, 67.8, 88.4, 1.3, 'Messages Sent', 1847, '{"personalization": true, "smart_timing": true, "opt_out_handling": true}'::jsonb, now() - interval '12 minutes'),
  (rid, 'Email Drip Engine', 'email', 'active', 'AI-powered email campaigns with dynamic content', 79, 88.1, 42.5, 76.9, 3.8, 'Emails Delivered', 4291, '{"ab_testing": true, "dynamic_content": true, "unsubscribe_management": true}'::jsonb, now() - interval '1 hour'),
  (rid, 'Social Engagement AI', 'social', 'paused', 'Monitors and responds to social media interactions', 64, 71.2, 55.3, 62.1, 8.7, 'Responses', 523, '{"platforms": ["instagram", "facebook"], "auto_respond": false, "sentiment_filter": true}'::jsonb, now() - interval '2 days'),
  (rid, 'Listing Optimizer', 'listing', 'active', 'AI-enhanced listing descriptions and pricing recommendations', 93, 97.1, 81.4, 91.2, 0.8, 'Listings Enhanced', 89, '{"auto_description": true, "price_suggestion": true, "photo_analysis": true}'::jsonb, now() - interval '45 minutes'),
  (rid, 'Booking Scheduler AI', 'booking', 'active', 'Automated showing and meeting scheduling', 85, 90.3, 73.6, 82.7, 2.9, 'Appointments Set', 267, '{"calendar_sync": true, "confirmation_sms": true, "reschedule_handling": true}'::jsonb, now() - interval '8 minutes');

  -- ==================
  -- AUTOMATIONS
  -- ==================
  INSERT INTO automations (realtor_id, asset_id, name, description, trigger_type, trigger_config, actions, status, success_rate, failure_rate, total_runs, modules) VALUES
  (rid, (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1),
   'Inbound Call Qualification', 'Qualifies incoming calls and routes to appropriate response', 'incoming_call', '{"source": "any"}'::jsonb,
   '[{"type": "qualify", "label": "AI Qualification", "config": {}}, {"type": "route", "label": "Smart Routing", "config": {}}, {"type": "notify", "label": "Agent Notification", "config": {}}]'::jsonb,
   'active', 94.2, 5.8, 342,
   '{"call_routing": {"enabled": true, "rules": ["Route buyers to buyer agent", "Route sellers to listing agent", "Route investors to team lead"]}, "escalation": {"enabled": true, "threshold": 3, "target": "team_lead"}, "human_takeover": {"enabled": true, "trigger": "low_confidence"}}'::jsonb),

  (rid, (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'sms' LIMIT 1),
   'Lead Follow-Up Sequence', 'Multi-step SMS follow-up for new leads', 'new_lead', '{"delay_minutes": 5}'::jsonb,
   '[{"type": "sms", "label": "Initial Follow-Up", "config": {}}, {"type": "wait", "label": "Wait 24h", "config": {}}, {"type": "sms", "label": "Value Add Message", "config": {}}, {"type": "wait", "label": "Wait 48h", "config": {}}, {"type": "sms", "label": "Appointment Offer", "config": {}}]'::jsonb,
   'active', 89.7, 10.3, 1847,
   '{"follow_up_timing": {"enabled": true, "delay_minutes": 5, "max_attempts": 5}, "stop_conditions": {"enabled": true, "conditions": ["Lead replied", "Lead opted out", "Appointment booked"]}, "human_takeover": {"enabled": true, "trigger": "negative_sentiment"}}'::jsonb),

  (rid, (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'email' LIMIT 1),
   'Email Nurture Campaign', 'Long-term email nurture for cold leads', 'lead_stale_7d', '{"days_inactive": 7}'::jsonb,
   '[{"type": "email", "label": "Market Update Email", "config": {}}, {"type": "wait", "label": "Wait 3 days", "config": {}}, {"type": "email", "label": "Listing Alert", "config": {}}, {"type": "evaluate", "label": "Check Engagement", "config": {}}]'::jsonb,
   'active', 82.4, 17.6, 4291,
   '{"follow_up_timing": {"enabled": true, "delay_minutes": 10080, "max_attempts": 8}, "stop_conditions": {"enabled": true, "conditions": ["Unsubscribed", "Bounced", "Converted"]}}'::jsonb),

  (rid, (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'booking' LIMIT 1),
   'Showing Auto-Scheduler', 'Automatically schedules property showings based on availability', 'showing_request', '{"source": "website"}'::jsonb,
   '[{"type": "check_availability", "label": "Check Calendar", "config": {}}, {"type": "propose_times", "label": "Suggest Times", "config": {}}, {"type": "confirm", "label": "Confirm Booking", "config": {}}, {"type": "notify", "label": "Send Reminders", "config": {}}]'::jsonb,
   'active', 91.5, 8.5, 267,
   '{"call_routing": {"enabled": false, "rules": []}, "escalation": {"enabled": true, "threshold": 2, "target": "admin"}, "human_takeover": {"enabled": true, "trigger": "scheduling_conflict"}}'::jsonb),

  (rid, (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1),
   'Missed Call Recovery', 'Re-engages missed calls with automated callback', 'missed_call', '{"delay_minutes": 2}'::jsonb,
   '[{"type": "sms", "label": "Missed Call SMS", "config": {}}, {"type": "wait", "label": "Wait 30min", "config": {}}, {"type": "call", "label": "AI Callback", "config": {}}]'::jsonb,
   'active', 76.3, 23.7, 198,
   '{"follow_up_timing": {"enabled": true, "delay_minutes": 2, "max_attempts": 3}, "stop_conditions": {"enabled": true, "conditions": ["Contact answered", "Voicemail left", "Max attempts reached"]}}'::jsonb),

  (rid, NULL,
   'Seller Opportunity Detector', 'Identifies potential sellers based on property data signals', 'daily_scan', '{"time": "06:00"}'::jsonb,
   '[{"type": "scan", "label": "Property Data Scan", "config": {}}, {"type": "score", "label": "Likelihood Scoring", "config": {}}, {"type": "alert", "label": "Generate Alerts", "config": {}}]'::jsonb,
   'draft', 0, 0, 0,
   '{"stop_conditions": {"enabled": false, "conditions": []}}'::jsonb);

  -- ==================
  -- AUTOMATION LOGS (last 7 days of realistic data)
  -- ==================
  INSERT INTO automation_logs (realtor_id, automation_id, asset_id, timestamp, trigger_source, action_executed, outcome, reason, ai_decision_summary, duration_ms) VALUES
  -- Today
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Inbound Call Qualification' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '3 minutes', 'Incoming call: +1-512-555-0142', 'AI Qualification + Smart Routing', 'success', NULL, 'Caller identified as motivated buyer. Budget range $350-450K. Routed to buyer agent with context summary.', 2340),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Lead Follow-Up Sequence' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'sms' LIMIT 1), now() - interval '12 minutes', 'New lead: sarah.m@email.com', 'Initial Follow-Up SMS', 'success', NULL, 'Personalized SMS sent. Lead intent: buyer. Referenced Westlake Hills interest from chat.', 890),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Showing Auto-Scheduler' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'booking' LIMIT 1), now() - interval '25 minutes', 'Showing request: 1204 Oak Lane', 'Calendar Check + Time Proposal', 'success', NULL, 'Found 3 available slots. Proposed Tuesday 2pm, Wednesday 10am, Thursday 4pm. Client selected Tuesday.', 1560),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Email Nurture Campaign' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'email' LIMIT 1), now() - interval '1 hour', 'Lead stale 7d: john.d@email.com', 'Market Update Email', 'success', NULL, 'Generated personalized market update for Downtown Austin area. Open rate prediction: 34%.', 3200),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Missed Call Recovery' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '2 hours', 'Missed call: +1-512-555-0198', 'Missed Call SMS', 'success', NULL, 'Sent immediate follow-up SMS with callback scheduling link.', 450),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Inbound Call Qualification' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '3 hours', 'Incoming call: +1-512-555-0333', 'AI Qualification', 'failure', 'Call dropped after 8 seconds. Insufficient audio for qualification.', 'Unable to complete qualification due to call quality. Flagged for manual follow-up.', 8200),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Lead Follow-Up Sequence' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'sms' LIMIT 1), now() - interval '4 hours', 'New lead: mike.r@email.com', 'Value Add Message', 'success', NULL, 'Sent comparable sales data for Mueller neighborhood. Lead engagement score: 72.', 1100),
  -- Yesterday
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Showing Auto-Scheduler' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'booking' LIMIT 1), now() - interval '1 day 2 hours', 'Showing request: 892 Elm St', 'Calendar Check', 'partial', 'No available slots within requested timeframe. Offered alternative dates.', 'Buyer requested Saturday showing but no agent availability. Offered Sunday 11am and Monday 3pm as alternatives.', 2100),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Email Nurture Campaign' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'email' LIMIT 1), now() - interval '1 day 4 hours', 'Lead stale 7d: lisa.w@email.com', 'Listing Alert', 'success', NULL, 'Matched 4 new listings to lead preferences. Sent curated listing digest.', 2800),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Inbound Call Qualification' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '1 day 6 hours', 'Incoming call: +1-512-555-0421', 'AI Qualification + Routing', 'success', NULL, 'Seller lead identified. Property at 445 Pine Dr. Estimated value $520K. Motivation: relocating for work. Routed to listing agent.', 3100),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Lead Follow-Up Sequence' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'sms' LIMIT 1), now() - interval '1 day 8 hours', 'New lead: tom.k@email.com', 'Appointment Offer', 'skipped', 'Lead already booked appointment via website.', 'Skipped SMS follow-up. Lead converted independently through booking widget.', 120),
  -- 2 days ago
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Missed Call Recovery' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '2 days 1 hour', 'Missed call: +1-512-555-0567', 'AI Callback', 'success', NULL, 'Successful callback. Identified as investor looking for multi-family. Scheduled meeting with team lead.', 45000),
  (rid, (SELECT id FROM automations WHERE realtor_id = rid AND name = 'Inbound Call Qualification' LIMIT 1), (SELECT id FROM ai_assets WHERE realtor_id = rid AND type = 'voice' LIMIT 1), now() - interval '2 days 5 hours', 'Incoming call: +1-512-555-0789', 'AI Qualification', 'failure', 'Spam call detected. Auto-blocked.', 'Call flagged as robocall/spam with 98% confidence. No action taken.', 1200);

  -- ==================
  -- MARKET NEWS
  -- ==================
  INSERT INTO market_news (title, summary, body, source, category, tags, ai_analysis, region, published_at) VALUES
  ('Federal Reserve Holds Rates Steady at January Meeting', 'The Federal Reserve maintained its benchmark interest rate, signaling a cautious approach amid cooling inflation and steady employment data.', '<p>The Federal Open Market Committee voted unanimously to keep the federal funds rate unchanged at its current target range. Chair Powell emphasized the committee remains data-dependent and will monitor economic indicators closely before making further adjustments.</p><p>Housing market participants had largely priced in this decision, with mortgage rates showing minimal movement in the days leading up to the announcement.</p>', 'Federal Reserve', 'rates', '{"fed", "interest-rates", "monetary-policy"}', 'Stable rates provide predictability for both buyers and sellers. Buyers can lock rates with confidence in the near term. Sellers benefit from sustained demand as affordability remains within recent ranges. This is a neutral-to-positive signal for transaction volume.', 'national', now() - interval '2 hours'),

  ('Housing Inventory Rises 12% Year-Over-Year in Major Metro Areas', 'New listing activity increased across the 50 largest metro areas, providing relief for buyers who have faced constrained supply for the past two years.', '<p>According to the latest data, active listings rose 12.3% compared to the same period last year, marking the largest year-over-year increase since 2019. The gains were most pronounced in Sun Belt markets.</p><p>Despite the increase, inventory remains approximately 25% below pre-pandemic norms in most markets, suggesting the recovery toward balance is gradual rather than abrupt.</p>', 'National Association of Realtors', 'inventory', '{"supply", "listings", "market-balance"}', 'Rising inventory is constructive for market health. Agents should position this as an opportunity for buyers who previously felt locked out. For sellers, the message is clear: pricing accuracy matters more now. Overpriced listings will sit longer as buyers gain alternatives.', 'national', now() - interval '8 hours'),

  ('Austin Market: Median Price Stabilizes After 18-Month Correction', 'The Austin metropolitan area median home price has stabilized near $420,000, following a correction from the 2022 peak of approximately $550,000.', NULL, 'Austin Board of Realtors', 'local', '{"austin", "pricing", "correction"}', 'Price stabilization signals the end of the correction phase in Austin. This creates a foundation for renewed buyer confidence. Agents should emphasize that current prices represent a more sustainable baseline compared to the speculative peak. Sellers who bought pre-2021 still hold significant equity.', 'austin', now() - interval '1 day'),

  ('New Construction Permits Up 8% as Builders Respond to Demand', 'Single-family building permits rose for the third consecutive month, with builders reporting improved buyer traffic and normalized material costs.', '<p>The Census Bureau reported single-family permits increased 8.1% month-over-month and 15.4% year-over-year. Builders cited improved supply chain conditions and stabilized lumber prices as factors enabling increased production.</p>', 'US Census Bureau', 'inventory', '{"construction", "new-homes", "supply"}', 'New construction activity reduces future supply pressure. Agents working with buyers should present new construction as a viable option, especially in suburban markets where builder incentives remain competitive. For existing home sellers, the increased competition from new builds reinforces the need for competitive pricing and property condition.', 'national', now() - interval '1 day 4 hours'),

  ('FHA Loan Limits Increase for 2026, Expanding Buyer Access', 'The Federal Housing Administration raised conforming loan limits to $524,225 for most markets, with high-cost area limits reaching $1,149,825.', NULL, 'HUD', 'policy', '{"fha", "loan-limits", "affordability"}', 'Higher FHA limits expand the buyer pool, particularly for first-time buyers in mid-range markets. Agents should proactively communicate this to leads who may have been previously priced out of FHA eligibility. This is directly actionable for lead conversion.', 'national', now() - interval '2 days'),

  ('Mortgage Applications Rise 6% on Rate Stability', 'The Mortgage Bankers Association reported a 6.2% increase in total mortgage applications, driven primarily by purchase activity rather than refinancing.', NULL, 'MBA', 'rates', '{"mortgage", "applications", "demand"}', 'Purchase-driven application growth is a strong forward indicator of transaction volume. Agents should expect increased showing activity and faster-moving inventory in the coming weeks. This is a signal to accelerate lead follow-up cadence.', 'national', now() - interval '2 days 6 hours'),

  ('Institutional Investor Activity Declines to 2019 Levels', 'Large-scale institutional buying of single-family homes has dropped to pre-pandemic levels, reducing competitive pressure on individual buyers.', NULL, 'CoreLogic', 'economy', '{"investors", "institutional", "competition"}', 'Reduced institutional competition is favorable for retail buyers and agents. This removes a significant objection that many potential buyers have cited. Agents should address this directly in conversations with hesitant buyers who assumed they could not compete.', 'national', now() - interval '3 days'),

  ('Remote Work Trends Continue to Shape Suburban Demand', 'Survey data indicates hybrid and remote work arrangements remain stable, sustaining elevated demand for suburban properties with home office space.', NULL, 'Bureau of Labor Statistics', 'forecast', '{"remote-work", "suburban", "demand-drivers"}', 'The persistence of remote work supports continued suburban demand. Agents in suburban markets should emphasize home office features, outdoor space, and connectivity in listings. This is a structural demand driver that shows no signs of reverting.', 'national', now() - interval '4 days');

  -- ==================
  -- ANALYTICS SNAPSHOTS (30 days)
  -- ==================
  INSERT INTO analytics_snapshots (realtor_id, date, ai_handled_leads, appointments_booked, estimated_commission, avg_response_time_ms, total_automations_run, success_count, failure_count, conversations_started)
  SELECT
    rid,
    d::date,
    (random() * 8 + 2)::int,
    (random() * 4 + 1)::int,
    (random() * 8000 + 2000)::numeric(12,2),
    (random() * 1500 + 500)::int,
    (random() * 40 + 15)::int,
    (random() * 35 + 12)::int,
    (random() * 5 + 1)::int,
    (random() * 12 + 3)::int
  FROM generate_series(now() - interval '30 days', now(), interval '1 day') d;

  RAISE NOTICE 'Seed data inserted successfully.';
END $$;
