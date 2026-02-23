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

for (const table of ['realtors', 'leads', 'conversations', 'events', 'content', 'daily_metrics', 'ai_assets', 'automations', 'automation_logs', 'market_news', 'analytics_snapshots']) {
  const { data, error } = await supabase.from(table).select('id').limit(1);
  console.log(`${table}: ${error ? 'MISSING' : 'OK (' + (data?.length || 0) + ' rows)'}`);
}
