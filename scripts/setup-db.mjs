import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envFile.split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq > 0) env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // 1. Create missing tables using the REST API (insert dummy + check)
  // Since we can't run raw SQL, we'll create the realtor profile and all data
  // using the Supabase client directly.

  const userId = '0e85ee8f-97b6-4333-a312-00cdd4430a5e';

  // Create realtor profile
  console.log('Creating realtor profile...');
  const { data: realtor, error: re } = await supabase.from('realtors').upsert({
    user_id: userId,
    name: 'Test Agent',
    slug: 'test-agent-austin',
    city: 'Austin',
    state: 'TX',
    tagline: 'Your trusted real estate expert in Austin',
  }, { onConflict: 'user_id' }).select('id').single();

  if (re) {
    console.error('Realtor error:', re.message);
    // Try insert without upsert
    const { data: r2, error: re2 } = await supabase.from('realtors').insert({
      user_id: userId,
      name: 'Test Agent',
      slug: 'test-agent-austin',
      city: 'Austin',
      state: 'TX',
      tagline: 'Your trusted real estate expert in Austin',
    }).select('id').single();
    if (re2) {
      console.error('Insert also failed:', re2.message);
      return;
    }
    console.log('Realtor created (insert):', r2.id);
    await seedData(supabase, r2.id);
  } else {
    console.log('Realtor created:', realtor.id);
    await seedData(supabase, realtor.id);
  }
}

async function seedData(supabase, realtorId) {
  console.log('Realtor ID:', realtorId);

  // Check if ai_assets table exists
  const { error: assetCheck } = await supabase.from('ai_assets').select('id').limit(1);
  if (assetCheck) {
    console.error('ai_assets table missing. You need to run migration 002 in Supabase SQL Editor.');
    console.log('Copying migration SQL to clipboard is not possible from script.');
    console.log('Please go to Supabase Dashboard > SQL Editor and run:');
    console.log('File: supabase/migrations/002_automation_hub.sql');
    return;
  }

  // Seed AI Assets
  console.log('Seeding AI assets...');
  const assets = [
    { realtor_id: realtorId, name: 'Inbound Call AI', type: 'voice', status: 'active', description: 'Handles incoming buyer and seller calls with AI-powered conversation', performance_score: 87, response_success_rate: 92.5, engagement_rate: 78.3, completion_rate: 85.1, error_rate: 2.1, key_metric_label: 'Calls Handled', key_metric_value: 342, config: { auto_answer: true, voicemail_fallback: true, record_calls: true, sentiment_analysis: true }, last_active_at: new Date(Date.now() - 180000).toISOString() },
    { realtor_id: realtorId, name: 'SMS Follow-Up AI', type: 'sms', status: 'active', description: 'Automated SMS follow-up sequences for lead nurturing', performance_score: 91, response_success_rate: 95.2, engagement_rate: 67.8, completion_rate: 88.4, error_rate: 1.3, key_metric_label: 'Messages Sent', key_metric_value: 1847, config: { personalization: true, smart_timing: true, opt_out_handling: true }, last_active_at: new Date(Date.now() - 720000).toISOString() },
    { realtor_id: realtorId, name: 'Email Drip Engine', type: 'email', status: 'active', description: 'AI-powered email campaigns with dynamic content', performance_score: 79, response_success_rate: 88.1, engagement_rate: 42.5, completion_rate: 76.9, error_rate: 3.8, key_metric_label: 'Emails Delivered', key_metric_value: 4291, config: { ab_testing: true, dynamic_content: true, unsubscribe_management: true }, last_active_at: new Date(Date.now() - 3600000).toISOString() },
    { realtor_id: realtorId, name: 'Social Engagement AI', type: 'social', status: 'paused', description: 'Monitors and responds to social media interactions', performance_score: 64, response_success_rate: 71.2, engagement_rate: 55.3, completion_rate: 62.1, error_rate: 8.7, key_metric_label: 'Responses', key_metric_value: 523, config: { platforms: ['instagram', 'facebook'], auto_respond: false, sentiment_filter: true }, last_active_at: new Date(Date.now() - 172800000).toISOString() },
    { realtor_id: realtorId, name: 'Listing Optimizer', type: 'listing', status: 'active', description: 'AI-enhanced listing descriptions and pricing recommendations', performance_score: 93, response_success_rate: 97.1, engagement_rate: 81.4, completion_rate: 91.2, error_rate: 0.8, key_metric_label: 'Listings Enhanced', key_metric_value: 89, config: { auto_description: true, price_suggestion: true, photo_analysis: true }, last_active_at: new Date(Date.now() - 2700000).toISOString() },
    { realtor_id: realtorId, name: 'Booking Scheduler AI', type: 'booking', status: 'active', description: 'Automated showing and meeting scheduling', performance_score: 85, response_success_rate: 90.3, engagement_rate: 73.6, completion_rate: 82.7, error_rate: 2.9, key_metric_label: 'Appointments Set', key_metric_value: 267, config: { calendar_sync: true, confirmation_sms: true, reschedule_handling: true }, last_active_at: new Date(Date.now() - 480000).toISOString() },
  ];

  const { data: insertedAssets, error: assetError } = await supabase.from('ai_assets').insert(assets).select('id, name, type');
  if (assetError) { console.error('Asset seed error:', assetError.message); return; }
  console.log(`Inserted ${insertedAssets.length} assets`);

  const assetMap = {};
  for (const a of insertedAssets) { assetMap[a.type] = a.id; }

  // Seed Automations
  console.log('Seeding automations...');
  const automations = [
    { realtor_id: realtorId, asset_id: assetMap.voice, name: 'Inbound Call Qualification', description: 'Qualifies incoming calls and routes to appropriate response', trigger_type: 'incoming_call', actions: [{ type: 'qualify', label: 'AI Qualification', config: {} }, { type: 'route', label: 'Smart Routing', config: {} }, { type: 'notify', label: 'Agent Notification', config: {} }], status: 'active', success_rate: 94.2, failure_rate: 5.8, total_runs: 342, modules: { call_routing: { enabled: true, rules: ['Route buyers to buyer agent', 'Route sellers to listing agent'] }, escalation: { enabled: true, threshold: 3, target: 'team_lead' }, human_takeover: { enabled: true, trigger: 'low_confidence' } } },
    { realtor_id: realtorId, asset_id: assetMap.sms, name: 'Lead Follow-Up Sequence', description: 'Multi-step SMS follow-up for new leads', trigger_type: 'new_lead', actions: [{ type: 'sms', label: 'Initial Follow-Up', config: {} }, { type: 'wait', label: 'Wait 24h', config: {} }, { type: 'sms', label: 'Value Add Message', config: {} }, { type: 'sms', label: 'Appointment Offer', config: {} }], status: 'active', success_rate: 89.7, failure_rate: 10.3, total_runs: 1847, modules: { follow_up_timing: { enabled: true, delay_minutes: 5, max_attempts: 5 }, stop_conditions: { enabled: true, conditions: ['Lead replied', 'Lead opted out', 'Appointment booked'] }, human_takeover: { enabled: true, trigger: 'negative_sentiment' } } },
    { realtor_id: realtorId, asset_id: assetMap.email, name: 'Email Nurture Campaign', description: 'Long-term email nurture for cold leads', trigger_type: 'lead_stale_7d', actions: [{ type: 'email', label: 'Market Update Email', config: {} }, { type: 'wait', label: 'Wait 3 days', config: {} }, { type: 'email', label: 'Listing Alert', config: {} }, { type: 'evaluate', label: 'Check Engagement', config: {} }], status: 'active', success_rate: 82.4, failure_rate: 17.6, total_runs: 4291, modules: { follow_up_timing: { enabled: true, delay_minutes: 10080, max_attempts: 8 }, stop_conditions: { enabled: true, conditions: ['Unsubscribed', 'Bounced', 'Converted'] } } },
    { realtor_id: realtorId, asset_id: assetMap.booking, name: 'Showing Auto-Scheduler', description: 'Automatically schedules property showings', trigger_type: 'showing_request', actions: [{ type: 'check_availability', label: 'Check Calendar', config: {} }, { type: 'propose_times', label: 'Suggest Times', config: {} }, { type: 'confirm', label: 'Confirm Booking', config: {} }], status: 'active', success_rate: 91.5, failure_rate: 8.5, total_runs: 267, modules: { escalation: { enabled: true, threshold: 2, target: 'admin' }, human_takeover: { enabled: true, trigger: 'scheduling_conflict' } } },
    { realtor_id: realtorId, asset_id: assetMap.voice, name: 'Missed Call Recovery', description: 'Re-engages missed calls with automated callback', trigger_type: 'missed_call', actions: [{ type: 'sms', label: 'Missed Call SMS', config: {} }, { type: 'wait', label: 'Wait 30min', config: {} }, { type: 'call', label: 'AI Callback', config: {} }], status: 'active', success_rate: 76.3, failure_rate: 23.7, total_runs: 198, modules: { follow_up_timing: { enabled: true, delay_minutes: 2, max_attempts: 3 }, stop_conditions: { enabled: true, conditions: ['Contact answered', 'Voicemail left'] } } },
  ];

  const { data: insertedAutos, error: autoError } = await supabase.from('automations').insert(automations).select('id, name');
  if (autoError) { console.error('Automation seed error:', autoError.message); return; }
  console.log(`Inserted ${insertedAutos.length} automations`);

  const autoMap = {};
  for (const a of insertedAutos) { autoMap[a.name] = a.id; }

  // Seed Logs
  console.log('Seeding logs...');
  const logs = [
    { realtor_id: realtorId, automation_id: autoMap['Inbound Call Qualification'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 180000).toISOString(), trigger_source: 'Incoming call: +1-512-555-0142', action_executed: 'AI Qualification + Smart Routing', outcome: 'success', ai_decision_summary: 'Caller identified as motivated buyer. Budget $350-450K. Routed to buyer agent.', duration_ms: 2340 },
    { realtor_id: realtorId, automation_id: autoMap['Lead Follow-Up Sequence'], asset_id: assetMap.sms, timestamp: new Date(Date.now() - 720000).toISOString(), trigger_source: 'New lead: sarah.m@email.com', action_executed: 'Initial Follow-Up SMS', outcome: 'success', ai_decision_summary: 'Personalized SMS sent. Lead intent: buyer. Referenced Westlake Hills interest.', duration_ms: 890 },
    { realtor_id: realtorId, automation_id: autoMap['Showing Auto-Scheduler'], asset_id: assetMap.booking, timestamp: new Date(Date.now() - 1500000).toISOString(), trigger_source: 'Showing request: 1204 Oak Lane', action_executed: 'Calendar Check + Time Proposal', outcome: 'success', ai_decision_summary: 'Found 3 available slots. Client selected Tuesday 2pm.', duration_ms: 1560 },
    { realtor_id: realtorId, automation_id: autoMap['Email Nurture Campaign'], asset_id: assetMap.email, timestamp: new Date(Date.now() - 3600000).toISOString(), trigger_source: 'Lead stale 7d: john.d@email.com', action_executed: 'Market Update Email', outcome: 'success', ai_decision_summary: 'Generated personalized market update for Downtown Austin. Open rate prediction: 34%.', duration_ms: 3200 },
    { realtor_id: realtorId, automation_id: autoMap['Missed Call Recovery'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 7200000).toISOString(), trigger_source: 'Missed call: +1-512-555-0198', action_executed: 'Missed Call SMS', outcome: 'success', ai_decision_summary: 'Sent immediate follow-up SMS with callback scheduling link.', duration_ms: 450 },
    { realtor_id: realtorId, automation_id: autoMap['Inbound Call Qualification'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 10800000).toISOString(), trigger_source: 'Incoming call: +1-512-555-0333', action_executed: 'AI Qualification', outcome: 'failure', reason: 'Call dropped after 8 seconds. Insufficient audio.', ai_decision_summary: 'Unable to complete qualification. Flagged for manual follow-up.', duration_ms: 8200 },
    { realtor_id: realtorId, automation_id: autoMap['Lead Follow-Up Sequence'], asset_id: assetMap.sms, timestamp: new Date(Date.now() - 14400000).toISOString(), trigger_source: 'New lead: mike.r@email.com', action_executed: 'Value Add Message', outcome: 'success', ai_decision_summary: 'Sent comparable sales data for Mueller neighborhood. Engagement score: 72.', duration_ms: 1100 },
    { realtor_id: realtorId, automation_id: autoMap['Showing Auto-Scheduler'], asset_id: assetMap.booking, timestamp: new Date(Date.now() - 93600000).toISOString(), trigger_source: 'Showing request: 892 Elm St', action_executed: 'Calendar Check', outcome: 'partial', reason: 'No available slots within requested timeframe.', ai_decision_summary: 'Offered Sunday 11am and Monday 3pm as alternatives.', duration_ms: 2100 },
    { realtor_id: realtorId, automation_id: autoMap['Inbound Call Qualification'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 108000000).toISOString(), trigger_source: 'Incoming call: +1-512-555-0421', action_executed: 'AI Qualification + Routing', outcome: 'success', ai_decision_summary: 'Seller lead identified. Property at 445 Pine Dr. Estimated $520K. Routed to listing agent.', duration_ms: 3100 },
    { realtor_id: realtorId, automation_id: autoMap['Lead Follow-Up Sequence'], asset_id: assetMap.sms, timestamp: new Date(Date.now() - 115200000).toISOString(), trigger_source: 'New lead: tom.k@email.com', action_executed: 'Appointment Offer', outcome: 'skipped', reason: 'Lead already booked appointment via website.', ai_decision_summary: 'Skipped. Lead converted independently through booking widget.', duration_ms: 120 },
    { realtor_id: realtorId, automation_id: autoMap['Missed Call Recovery'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 176400000).toISOString(), trigger_source: 'Missed call: +1-512-555-0567', action_executed: 'AI Callback', outcome: 'success', ai_decision_summary: 'Successful callback. Investor looking for multi-family. Scheduled meeting.', duration_ms: 45000 },
    { realtor_id: realtorId, automation_id: autoMap['Inbound Call Qualification'], asset_id: assetMap.voice, timestamp: new Date(Date.now() - 190800000).toISOString(), trigger_source: 'Incoming call: +1-512-555-0789', action_executed: 'AI Qualification', outcome: 'failure', reason: 'Spam call detected. Auto-blocked.', ai_decision_summary: 'Call flagged as robocall with 98% confidence. No action taken.', duration_ms: 1200 },
  ];

  const { error: logError } = await supabase.from('automation_logs').insert(logs);
  if (logError) { console.error('Log seed error:', logError.message); return; }
  console.log(`Inserted ${logs.length} log entries`);

  // Seed Market News
  console.log('Seeding market news...');
  const news = [
    { title: 'Federal Reserve Holds Rates Steady at January Meeting', summary: 'The Federal Reserve maintained its benchmark interest rate, signaling a cautious approach amid cooling inflation.', category: 'rates', tags: ['fed', 'interest-rates', 'monetary-policy'], ai_analysis: 'Stable rates provide predictability for both buyers and sellers. Buyers can lock rates with confidence. This is neutral-to-positive for transaction volume.', region: 'national', source: 'Federal Reserve', published_at: new Date(Date.now() - 7200000).toISOString() },
    { title: 'Housing Inventory Rises 12% Year-Over-Year', summary: 'New listing activity increased across the 50 largest metro areas, providing relief for buyers.', category: 'inventory', tags: ['supply', 'listings', 'market-balance'], ai_analysis: 'Rising inventory is constructive for market health. Agents should position this as an opportunity for buyers. For sellers, pricing accuracy matters more now.', region: 'national', source: 'NAR', published_at: new Date(Date.now() - 28800000).toISOString() },
    { title: 'Austin: Median Price Stabilizes After Correction', summary: 'Austin metro median price has stabilized near $420,000 following a correction from the 2022 peak.', category: 'local', tags: ['austin', 'pricing', 'correction'], ai_analysis: 'Price stabilization signals the end of the correction phase. Current prices represent a sustainable baseline. Sellers who bought pre-2021 still hold significant equity.', region: 'austin', source: 'Austin Board of Realtors', published_at: new Date(Date.now() - 86400000).toISOString() },
    { title: 'New Construction Permits Up 8%', summary: 'Single-family building permits rose for the third consecutive month.', category: 'inventory', tags: ['construction', 'new-homes', 'supply'], ai_analysis: 'New construction reduces future supply pressure. For existing home sellers, increased competition from new builds reinforces the need for competitive pricing.', region: 'national', source: 'US Census Bureau', published_at: new Date(Date.now() - 100800000).toISOString() },
    { title: 'FHA Loan Limits Increase for 2026', summary: 'FHA raised conforming loan limits to $524,225 for most markets.', category: 'policy', tags: ['fha', 'loan-limits', 'affordability'], ai_analysis: 'Higher FHA limits expand the buyer pool, particularly for first-time buyers. This is directly actionable for lead conversion.', region: 'national', source: 'HUD', published_at: new Date(Date.now() - 172800000).toISOString() },
    { title: 'Mortgage Applications Rise 6%', summary: 'MBA reported 6.2% increase in total mortgage applications driven by purchase activity.', category: 'rates', tags: ['mortgage', 'applications', 'demand'], ai_analysis: 'Purchase-driven growth is a strong forward indicator. Expect increased showing activity and faster-moving inventory.', region: 'national', source: 'MBA', published_at: new Date(Date.now() - 194400000).toISOString() },
    { title: 'Institutional Investor Activity Declines to 2019 Levels', summary: 'Large-scale institutional buying of single-family homes dropped to pre-pandemic levels.', category: 'economy', tags: ['investors', 'institutional', 'competition'], ai_analysis: 'Reduced institutional competition is favorable for retail buyers. Address this directly with hesitant buyers who assumed they could not compete.', region: 'national', source: 'CoreLogic', published_at: new Date(Date.now() - 259200000).toISOString() },
    { title: 'Remote Work Trends Continue to Shape Suburban Demand', summary: 'Hybrid and remote work arrangements remain stable, sustaining elevated suburban demand.', category: 'forecast', tags: ['remote-work', 'suburban', 'demand-drivers'], ai_analysis: 'Persistence of remote work supports continued suburban demand. Emphasize home office features and outdoor space in listings.', region: 'national', source: 'BLS', published_at: new Date(Date.now() - 345600000).toISOString() },
  ];

  const { error: newsError } = await supabase.from('market_news').insert(news);
  if (newsError) { console.error('News seed error:', newsError.message); return; }
  console.log(`Inserted ${news.length} market news articles`);

  // Seed Analytics Snapshots (30 days)
  console.log('Seeding analytics snapshots...');
  const snapshots = [];
  for (let i = 30; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    snapshots.push({
      realtor_id: realtorId,
      date: d.toISOString().split('T')[0],
      ai_handled_leads: Math.floor(Math.random() * 8) + 2,
      appointments_booked: Math.floor(Math.random() * 4) + 1,
      estimated_commission: Math.round((Math.random() * 8000 + 2000) * 100) / 100,
      avg_response_time_ms: Math.floor(Math.random() * 1500) + 500,
      total_automations_run: Math.floor(Math.random() * 40) + 15,
      success_count: Math.floor(Math.random() * 35) + 12,
      failure_count: Math.floor(Math.random() * 5) + 1,
      conversations_started: Math.floor(Math.random() * 12) + 3,
    });
  }

  const { error: snapError } = await supabase.from('analytics_snapshots').insert(snapshots);
  if (snapError) { console.error('Snapshot seed error:', snapError.message); return; }
  console.log(`Inserted ${snapshots.length} daily snapshots`);

  console.log('\nSeed complete. All data ready.');
}

run();
