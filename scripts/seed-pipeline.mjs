/**
 * Seed pipeline data: leads with stages, call records, transcripts,
 * follow-ups, appointments, and objection scripts.
 * Run: node scripts/seed-pipeline.mjs
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local
const envContent = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Helpers ──────────────────────────────────────────────────────
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const hoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNow = (d) => new Date(Date.now() + d * 86400000).toISOString();

// ─── Lead Data ────────────────────────────────────────────────────
const leadData = [
  // NEW stage (8 leads)
  { name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "+1-555-0101", intent: "buyer", score: 72, source: "website", stage: "new", tags: ["first-time-buyer"] },
  { name: "James Rodriguez", email: "jrod@email.com", phone: "+1-555-0102", intent: "buyer", score: 65, source: "zillow", stage: "new", tags: ["relocation"] },
  { name: "Amanda Chen", email: "a.chen@email.com", phone: "+1-555-0103", intent: "seller", score: 58, source: "referral", stage: "new", tags: ["downsizing"] },
  { name: "David Kim", email: "dkim@email.com", phone: "+1-555-0104", intent: "investor", score: 81, source: "website", stage: "new", tags: ["multi-family"] },
  { name: "Lisa Thompson", email: "lisa.t@email.com", phone: "+1-555-0105", intent: "buyer", score: 45, source: "social", stage: "new", tags: [] },
  { name: "Robert Garcia", email: "rgarcia@email.com", phone: "+1-555-0106", intent: "unknown", score: 30, source: "website", stage: "new", tags: [] },
  { name: "Jennifer Park", email: "jpark@email.com", phone: "+1-555-0107", intent: "buyer", score: 55, source: "chat", stage: "new", tags: ["pre-approved"] },
  { name: "Michael Brown", email: "mbrown@email.com", phone: "+1-555-0108", intent: "seller", score: 62, source: "referral", stage: "new", tags: ["inherited-property"] },

  // CONTACTED stage (8 leads)
  { name: "Emily Watson", email: "ewatson@email.com", phone: "+1-555-0201", intent: "buyer", score: 78, source: "website", stage: "contacted", tags: ["pre-approved", "first-time-buyer"], last_contact_hours_ago: 4 },
  { name: "Chris Johnson", email: "cjohnson@email.com", phone: "+1-555-0202", intent: "seller", score: 70, source: "referral", stage: "contacted", tags: ["upsizing"], last_contact_hours_ago: 12 },
  { name: "Maria Santos", email: "msantos@email.com", phone: "+1-555-0203", intent: "buyer", score: 60, source: "zillow", stage: "contacted", tags: [], last_contact_hours_ago: 24 },
  { name: "Kevin Lee", email: "klee@email.com", phone: "+1-555-0204", intent: "investor", score: 85, source: "website", stage: "contacted", tags: ["rental-property"], last_contact_hours_ago: 6 },
  { name: "Stephanie Davis", email: "sdavis@email.com", phone: "+1-555-0205", intent: "buyer", score: 48, source: "social", stage: "contacted", tags: [], last_contact_hours_ago: 72 },
  { name: "Andrew Wilson", email: "awilson@email.com", phone: "+1-555-0206", intent: "seller", score: 55, source: "website", stage: "contacted", tags: ["vacant-land"], last_contact_hours_ago: 36 },
  { name: "Nicole Taylor", email: "ntaylor@email.com", phone: "+1-555-0207", intent: "buyer", score: 68, source: "chat", stage: "contacted", tags: ["condo"], last_contact_hours_ago: 8 },
  { name: "Brandon Martinez", email: "bmartinez@email.com", phone: "+1-555-0208", intent: "unknown", score: 35, source: "website", stage: "contacted", tags: [], last_contact_hours_ago: 96 },

  // QUALIFIED stage (7 leads)
  { name: "Rachel Green", email: "rgreen@email.com", phone: "+1-555-0301", intent: "buyer", score: 88, source: "referral", stage: "qualified", tags: ["pre-approved", "luxury"], last_contact_hours_ago: 2, qualification: { budget_min: 500000, budget_max: 750000, timeline: "1-3 months", locations: ["Downtown", "Midtown"], property_type: "condo", urgency: "hot", pre_approved: true, motivation: "Relocating for new job" } },
  { name: "Thomas Wright", email: "twright@email.com", phone: "+1-555-0302", intent: "seller", score: 82, source: "website", stage: "qualified", tags: ["downsizing"], last_contact_hours_ago: 5, qualification: { budget_min: 300000, budget_max: 400000, timeline: "3-6 months", property_type: "single_family", urgency: "warm", motivation: "Empty nesters" } },
  { name: "Ashley Clark", email: "aclark@email.com", phone: "+1-555-0303", intent: "buyer", score: 75, source: "zillow", stage: "qualified", tags: ["first-time-buyer"], last_contact_hours_ago: 18, qualification: { budget_min: 250000, budget_max: 350000, timeline: "1-3 months", locations: ["Suburbs"], property_type: "townhouse", urgency: "warm", pre_approved: true } },
  { name: "Daniel Harris", email: "dharris@email.com", phone: "+1-555-0304", intent: "investor", score: 90, source: "referral", stage: "qualified", tags: ["multi-family", "portfolio"], last_contact_hours_ago: 10, qualification: { budget_min: 800000, budget_max: 1200000, timeline: "immediately", property_type: "multi_family", urgency: "hot", pre_approved: true, motivation: "Expanding rental portfolio" } },
  { name: "Jessica Moore", email: "jmoore@email.com", phone: "+1-555-0305", intent: "buyer", score: 70, source: "chat", stage: "qualified", tags: ["relocation"], last_contact_hours_ago: 28, qualification: { budget_min: 350000, budget_max: 500000, timeline: "3-6 months", locations: ["East Side", "West Side"], property_type: "single_family", urgency: "warm" } },
  { name: "Ryan Anderson", email: "randerson@email.com", phone: "+1-555-0306", intent: "seller", score: 78, source: "website", stage: "qualified", tags: ["luxury"], last_contact_hours_ago: 14, qualification: { budget_min: 600000, budget_max: 900000, timeline: "1-3 months", property_type: "single_family", urgency: "warm", motivation: "Relocating out of state" } },
  { name: "Laura White", email: "lwhite@email.com", phone: "+1-555-0307", intent: "buyer", score: 65, source: "social", stage: "qualified", tags: [], last_contact_hours_ago: 48, qualification: { budget_min: 200000, budget_max: 300000, timeline: "6-12 months", property_type: "condo", urgency: "cold" } },

  // BOOKED stage (6 leads)
  { name: "Mark Thompson", email: "mthompson@email.com", phone: "+1-555-0401", intent: "buyer", score: 92, source: "referral", stage: "booked", tags: ["pre-approved", "luxury"], last_contact_hours_ago: 1, qualification: { budget_min: 700000, budget_max: 1000000, timeline: "immediately", locations: ["Waterfront", "Downtown"], property_type: "condo", urgency: "hot", pre_approved: true, motivation: "Investment + personal use" } },
  { name: "Patricia Lewis", email: "plewis@email.com", phone: "+1-555-0402", intent: "seller", score: 85, source: "website", stage: "booked", tags: ["downsizing"], last_contact_hours_ago: 3, qualification: { budget_min: 400000, budget_max: 550000, timeline: "1-3 months", property_type: "single_family", urgency: "hot", motivation: "Moving to retirement community" } },
  { name: "William Robinson", email: "wrobinson@email.com", phone: "+1-555-0403", intent: "buyer", score: 80, source: "zillow", stage: "booked", tags: ["first-time-buyer", "fha"], last_contact_hours_ago: 6, qualification: { budget_min: 200000, budget_max: 350000, timeline: "immediately", locations: ["Suburbs"], property_type: "single_family", urgency: "hot", pre_approved: true } },
  { name: "Karen Hall", email: "khall@email.com", phone: "+1-555-0404", intent: "investor", score: 88, source: "referral", stage: "booked", tags: ["portfolio"], last_contact_hours_ago: 8, qualification: { budget_min: 500000, budget_max: 800000, timeline: "immediately", property_type: "multi_family", urgency: "hot", pre_approved: true, motivation: "Cash buyer, looking for 4-plex" } },
  { name: "Steven Young", email: "syoung@email.com", phone: "+1-555-0405", intent: "buyer", score: 75, source: "chat", stage: "booked", tags: [], last_contact_hours_ago: 12, qualification: { budget_min: 300000, budget_max: 450000, timeline: "1-3 months", property_type: "townhouse", urgency: "warm", pre_approved: true } },
  { name: "Diana Allen", email: "dallen@email.com", phone: "+1-555-0406", intent: "seller", score: 82, source: "website", stage: "booked", tags: ["luxury"], last_contact_hours_ago: 4, qualification: { budget_min: 800000, budget_max: 1100000, timeline: "1-3 months", property_type: "single_family", urgency: "hot", motivation: "Divorce — needs to sell quickly" } },

  // DEAD stage (6 leads)
  { name: "Paul Nelson", email: "pnelson@email.com", phone: "+1-555-0501", intent: "buyer", score: 25, source: "website", stage: "dead", tags: [], last_contact_hours_ago: 168 },
  { name: "Linda Carter", email: "lcarter@email.com", phone: "+1-555-0502", intent: "unknown", score: 15, source: "social", stage: "dead", tags: [], last_contact_hours_ago: 240 },
  { name: "George Scott", email: "gscott@email.com", phone: "+1-555-0503", intent: "buyer", score: 40, source: "zillow", stage: "dead", tags: [], last_contact_hours_ago: 336 },
  { name: "Betty Adams", email: "badams@email.com", phone: "+1-555-0504", intent: "seller", score: 30, source: "website", stage: "dead", tags: [], last_contact_hours_ago: 480 },
  { name: "Frank Baker", email: "fbaker@email.com", phone: "+1-555-0505", intent: "investor", score: 50, source: "referral", stage: "dead", tags: [], last_contact_hours_ago: 200 },
  { name: "Dorothy Gonzalez", email: "dgonzalez@email.com", phone: "+1-555-0506", intent: "buyer", score: 35, source: "chat", stage: "dead", tags: [], last_contact_hours_ago: 360 },
];

// ─── Transcript Templates ─────────────────────────────────────────
function generateBuyerTranscript(name) {
  return [
    { speaker: "ai", text: `Hi ${name}, this is the RE Autopilot team calling. How are you doing today?`, timestamp_ms: 0 },
    { speaker: "lead", text: "I'm good, thanks. I was expecting your call.", timestamp_ms: 4200 },
    { speaker: "ai", text: "Great! I wanted to follow up on your home search. You mentioned you're looking to buy. Are you still actively searching?", timestamp_ms: 7800 },
    { speaker: "lead", text: "Yes, we've been looking but haven't found the right fit yet. The market is tough.", timestamp_ms: 14200, sentiment: "neutral" },
    { speaker: "ai", text: "I hear that a lot. What's been the biggest challenge — is it pricing, location, or finding the right features?", timestamp_ms: 20600 },
    { speaker: "lead", text: "Mostly pricing. Everything in our area is going above asking.", timestamp_ms: 26400, sentiment: "negative" },
    { speaker: "ai", text: "That's a common frustration right now. Can you tell me your budget range so I can narrow down some options?", timestamp_ms: 31800 },
    { speaker: "lead", text: "We're looking between $300K and $450K.", timestamp_ms: 37200 },
    { speaker: "ai", text: "And are you pre-approved yet?", timestamp_ms: 40600 },
    { speaker: "lead", text: "Yes, pre-approved for up to $475K.", timestamp_ms: 44000, sentiment: "positive" },
    { speaker: "ai", text: "That puts you in a strong position. I'd love to connect you with one of our agents who knows your target area really well. Would you be open to a consultation?", timestamp_ms: 48200 },
    { speaker: "lead", text: "Sure, that sounds helpful.", timestamp_ms: 54600, sentiment: "positive" },
    { speaker: "ai", text: "Wonderful! Does later this week work for you? We have availability Thursday or Friday.", timestamp_ms: 58000 },
    { speaker: "lead", text: "Thursday afternoon works best.", timestamp_ms: 63400 },
    { speaker: "ai", text: "I'll get that scheduled for Thursday afternoon. You'll get a confirmation text shortly. Have a great day!", timestamp_ms: 67800 },
  ];
}

function generateSellerTranscript(name) {
  return [
    { speaker: "ai", text: `Good afternoon! This is the RE Autopilot team. Am I speaking with ${name}?`, timestamp_ms: 0 },
    { speaker: "lead", text: "Yes, that's me.", timestamp_ms: 3400 },
    { speaker: "ai", text: "I'm following up on your inquiry about selling your property. Are you still considering listing?", timestamp_ms: 6200 },
    { speaker: "lead", text: "I'm thinking about it, but I'm not sure about the timing.", timestamp_ms: 12800, sentiment: "neutral" },
    { speaker: "ai", text: "That's understandable. What's driving your interest in selling?", timestamp_ms: 18200 },
    { speaker: "lead", text: "We need more space. Growing family.", timestamp_ms: 24600, sentiment: "neutral" },
    { speaker: "ai", text: "Congratulations! In your area, inventory is still low which means you could get strong offers. Would a free market analysis help with your decision?", timestamp_ms: 29000 },
    { speaker: "lead", text: "That would be great, actually. No pressure?", timestamp_ms: 36200, sentiment: "positive" },
    { speaker: "ai", text: "No pressure at all. We can have our listing specialist come by for a walkthrough. What day works best?", timestamp_ms: 40600 },
    { speaker: "lead", text: "How about next Tuesday?", timestamp_ms: 46800, sentiment: "positive" },
    { speaker: "ai", text: "Tuesday works perfectly. We'll send you a confirmation. Thank you for your time!", timestamp_ms: 50200 },
  ];
}

function generateShortTranscript(name) {
  return [
    { speaker: "ai", text: `Hi, this is RE Autopilot calling for ${name}. Is this a good time?`, timestamp_ms: 0 },
    { speaker: "lead", text: "Not really, I'm busy right now.", timestamp_ms: 4200, sentiment: "negative" },
    { speaker: "ai", text: "No problem at all. Would it be better if I called back at a different time?", timestamp_ms: 7800 },
    { speaker: "lead", text: "Maybe next week. I'll think about it.", timestamp_ms: 12400, sentiment: "neutral" },
    { speaker: "ai", text: "Absolutely. I'll follow up next week. Have a great day!", timestamp_ms: 16800 },
  ];
}

// ─── Objection Scripts Data ───────────────────────────────────────
const objectionScripts = [
  { category: "price", objection_text: "The prices are too high in this market", response_text: "I understand that concern. Let me share some recent data — while prices have risen, interest rates are starting to come down, which actually improves your buying power. Plus, we have strategies like rate buydowns that can save you thousands. Would you like me to run some numbers specific to your budget?", effectiveness_score: 78, times_used: 45, times_successful: 35 },
  { category: "timing", objection_text: "I want to wait for prices to drop", response_text: "That's a common thought. However, historically, timing the market is very difficult. While some markets have seen corrections, waiting can mean missing out on homes you love and potentially facing higher rates. Right now, you have good negotiating power with lower competition. Let me show you some comparable scenarios.", effectiveness_score: 72, times_used: 38, times_successful: 27 },
  { category: "competition", objection_text: "We already have a realtor we work with", response_text: "That's great that you have someone you trust! I'm not trying to replace them — I just wanted to share some market insights that might be helpful regardless. If you're ever looking for a second opinion or want to compare approaches, we're always here. Would you like me to send you our latest market report?", effectiveness_score: 45, times_used: 22, times_successful: 10 },
  { category: "financing", objection_text: "I'm not sure I can qualify for a mortgage right now", response_text: "That's a valid concern, and many people feel the same way. But you might be surprised — there are programs available for various credit scores and income levels, including FHA loans with just 3.5% down. Would you be open to a no-obligation pre-qualification check? It only takes about 15 minutes and won't affect your credit score.", effectiveness_score: 82, times_used: 30, times_successful: 25 },
  { category: "location", objection_text: "I can't find anything in the area I want", response_text: "I hear you — popular areas do get competitive. But I've found that many buyers discover neighborhoods they love that they hadn't originally considered. We can also set up alerts for new listings the moment they hit the market in your target area. Would you like me to expand the search a bit to show you some hidden gems?", effectiveness_score: 68, times_used: 25, times_successful: 17 },
  { category: "general", objection_text: "I'm just browsing, not ready to commit", response_text: "No pressure at all! Browsing is actually a smart first step. I can set you up with a personalized market watch so you see what's available without any commitment. When you're ready to take the next step, we'll be here. Would a weekly email with new listings in your price range be helpful?", effectiveness_score: 75, times_used: 52, times_successful: 39 },
  { category: "price", objection_text: "I don't want to overpay in this market", response_text: "Smart thinking. We use comparable market analysis to ensure our clients never overpay. In fact, our AI tools can identify properties that are priced below market value or have room for negotiation. Let me show you some recent deals where our buyers actually got below-asking-price offers accepted.", effectiveness_score: 80, times_used: 33, times_successful: 26 },
  { category: "timing", objection_text: "We need to sell our current home first", response_text: "That's a common situation and very manageable. We have strategies for this — from bridge loans to sale-contingent offers to guaranteed buyout programs. Many of our clients successfully buy and sell simultaneously. Would you like me to explain some of these options?", effectiveness_score: 70, times_used: 18, times_successful: 13 },
];

// ─── Main Seed Function ──────────────────────────────────────────
async function seedPipeline() {
  console.log("Seeding pipeline data...\n");

  // Get first realtor
  const { data: realtors, error: realtorError } = await supabase
    .from("realtors")
    .select("id")
    .limit(1);

  if (realtorError || !realtors?.length) {
    console.error("No realtor found. Run the main setup first.");
    process.exit(1);
  }

  const realtorId = realtors[0].id;
  console.log(`Using realtor: ${realtorId}\n`);

  // Get voice/sms assets for agent assignment
  const { data: assets } = await supabase
    .from("ai_assets")
    .select("id, type, name")
    .eq("realtor_id", realtorId)
    .in("type", ["voice", "sms"]);

  const voiceAgents = (assets || []).filter(a => a.type === "voice");
  const smsAgents = (assets || []).filter(a => a.type === "sms");
  const allAgents = [...voiceAgents, ...smsAgents];

  if (allAgents.length === 0) {
    console.log("No voice/sms assets found. Leads will not have agent assignments.");
  }

  // ─── Insert Leads ───
  console.log("Inserting leads...");
  const leadIds = {};

  for (const ld of leadData) {
    const { last_contact_hours_ago, qualification, ...leadFields } = ld;

    const insertData = {
      realtor_id: realtorId,
      ...leadFields,
      stage_changed_at: daysAgo(randomInt(1, 14)),
      last_contact_at: last_contact_hours_ago ? hoursAgo(last_contact_hours_ago) : null,
      assigned_agent_id: allAgents.length > 0 && ld.stage !== "dead" && ld.stage !== "new"
        ? randomItem(allAgents).id
        : null,
      qualification: qualification || {},
      created_at: daysAgo(randomInt(3, 30)),
    };

    const { data, error } = await supabase
      .from("leads")
      .upsert(insertData, { onConflict: "id" })
      .select("id")
      .single();

    if (error) {
      // Try insert (might fail if duplicate email)
      const { data: insertedData, error: insertError } = await supabase
        .from("leads")
        .insert(insertData)
        .select("id")
        .single();

      if (insertError) {
        console.error(`  Error: ${ld.name}`, insertError.message);
        continue;
      }
      leadIds[ld.email] = insertedData.id;
    } else {
      leadIds[ld.email] = data.id;
    }
    console.log(`  ✓ ${ld.stage.padEnd(10)} ${ld.name}`);
  }

  const insertedLeadEntries = Object.entries(leadIds);
  console.log(`\n${insertedLeadEntries.length} leads inserted.\n`);

  // ─── Insert Call Records ───
  console.log("Inserting call records...");
  let callCount = 0;

  for (const [email, leadId] of insertedLeadEntries) {
    const ld = leadData.find(l => l.email === email);
    if (!ld || ld.stage === "new") continue;

    const numCalls = ld.stage === "dead" ? randomInt(2, 4) : randomInt(1, 3);
    const agent = allAgents.length > 0 ? randomItem(allAgents) : null;

    for (let i = 0; i < numCalls; i++) {
      const statuses = ["completed", "no_answer", "voicemail", "completed", "completed"];
      const status = randomItem(statuses);
      const outcomes = ["appointment_set", "follow_up_needed", "callback_requested", "qualified", "not_interested"];
      const sentiments = ["positive", "neutral", "negative", "mixed"];

      let transcript = [];
      let duration = 0;
      let sentiment = "neutral";
      let outcome = null;
      let aiSummary = null;
      let objectionsRaised = [];

      if (status === "completed") {
        if (ld.intent === "buyer") {
          transcript = generateBuyerTranscript(ld.name);
        } else if (ld.intent === "seller") {
          transcript = generateSellerTranscript(ld.name);
        } else {
          transcript = generateShortTranscript(ld.name);
        }
        duration = Math.round(transcript[transcript.length - 1].timestamp_ms / 1000) + 4;

        if (ld.stage === "booked") {
          outcome = "appointment_set";
          sentiment = "positive";
          aiSummary = `Productive call with ${ld.name}. Lead is ${ld.intent} with strong interest. Appointment booked.`;
        } else if (ld.stage === "qualified") {
          outcome = randomItem(["qualified", "follow_up_needed"]);
          sentiment = "positive";
          aiSummary = `Good conversation with ${ld.name}. Gathered qualification info. ${outcome === "qualified" ? "Lead qualified." : "Follow-up scheduled."}`;
        } else if (ld.stage === "dead") {
          outcome = "not_interested";
          sentiment = "negative";
          aiSummary = `${ld.name} is no longer interested. Lead marked as dead.`;
        } else {
          outcome = randomItem(["follow_up_needed", "callback_requested"]);
          sentiment = randomItem(["neutral", "positive"]);
          aiSummary = `Initial conversation with ${ld.name}. ${outcome === "callback_requested" ? "Requested callback." : "Follow-up needed."}`;
        }

        if (ld.intent === "buyer") objectionsRaised = [randomItem(["price", "timing", "location"])];
      } else {
        duration = randomInt(0, 5);
        sentiment = "neutral";
      }

      const startedAt = hoursAgo(randomInt(1, 200));

      await supabase.from("call_records").insert({
        realtor_id: realtorId,
        lead_id: leadId,
        agent_id: agent?.id || null,
        direction: "outbound",
        status,
        duration_seconds: duration,
        transcript,
        sentiment,
        ai_summary: aiSummary,
        objections_raised: objectionsRaised,
        outcome,
        started_at: startedAt,
        ended_at: new Date(new Date(startedAt).getTime() + duration * 1000).toISOString(),
      });

      callCount++;
    }
  }
  console.log(`${callCount} call records inserted.\n`);

  // ─── Insert Follow-up Activities ───
  console.log("Inserting follow-up activities...");
  let followUpCount = 0;

  for (const [email, leadId] of insertedLeadEntries) {
    const ld = leadData.find(l => l.email === email);
    if (!ld || ld.stage === "new" || ld.stage === "dead") continue;

    const agent = allAgents.length > 0 ? randomItem(allAgents) : null;
    const channels = ["call", "sms", "email"];
    const numSteps = randomInt(2, 4);

    for (let step = 1; step <= numSteps; step++) {
      const channel = channels[(step - 1) % channels.length];
      const statuses = step <= 2
        ? ["sent", "delivered", "opened", "replied"]
        : ["pending", "sent"];
      const status = randomItem(statuses);

      const contentTemplates = {
        sms: [
          `Hi ${ld.name}, just following up on our recent conversation about real estate. Any questions?`,
          `${ld.name}, I found some properties that match what you're looking for. Want me to send details?`,
          `Quick update on the market in your area — let me know if you'd like to chat!`,
        ],
        email: [
          `Subject: Properties matching your criteria\n\nHi ${ld.name},\n\nI've put together a curated list of properties that match your requirements...`,
          `Subject: Market update for your area\n\nHi ${ld.name},\n\nHere's what's happening in the real estate market this week...`,
        ],
        call: [
          `Follow-up call to discuss property options with ${ld.name}`,
        ],
      };

      await supabase.from("follow_up_activities").insert({
        realtor_id: realtorId,
        lead_id: leadId,
        agent_id: agent?.id || null,
        channel,
        status,
        scheduled_at: hoursAgo(randomInt(1, 100)),
        completed_at: status !== "pending" ? hoursAgo(randomInt(1, 100)) : null,
        content: randomItem(contentTemplates[channel]),
        sequence_step: step,
        sequence_name: "Standard Follow-up",
        response_text: status === "replied" ? "Thanks for following up! I'm interested." : null,
        response_at: status === "replied" ? hoursAgo(randomInt(1, 48)) : null,
      });

      followUpCount++;
    }
  }
  console.log(`${followUpCount} follow-up activities inserted.\n`);

  // ─── Insert Appointments ───
  console.log("Inserting appointments...");
  let appointmentCount = 0;

  const bookedLeads = leadData.filter(l => l.stage === "booked");
  const qualifiedLeads = leadData.filter(l => l.stage === "qualified");

  for (const ld of [...bookedLeads, ...qualifiedLeads.slice(0, 3)]) {
    const leadId = leadIds[ld.email];
    if (!leadId) continue;

    const agent = allAgents.length > 0 ? randomItem(allAgents) : null;
    const meetingTypes = ["consultation", "showing", "listing_presentation", "follow_up"];
    const isUpcoming = ld.stage === "booked";

    await supabase.from("appointments").insert({
      realtor_id: realtorId,
      lead_id: leadId,
      booked_by_agent_id: agent?.id || null,
      scheduled_at: isUpcoming ? daysFromNow(randomInt(1, 7)) : daysAgo(randomInt(1, 5)),
      duration_minutes: randomItem([30, 45, 60]),
      meeting_type: ld.intent === "seller" ? "listing_presentation" : randomItem(meetingTypes),
      location: randomItem(["Office", "Property Site", "Virtual/Zoom", "Coffee Shop Meeting", null]),
      status: isUpcoming ? randomItem(["scheduled", "confirmed"]) : "completed",
      conversation_summary: `AI agent conducted ${randomInt(2, 4)} calls with ${ld.name} over ${randomInt(3, 14)} days. ${
        ld.intent === "buyer"
          ? `Lead is a ${ld.qualification?.urgency || "warm"} buyer looking for ${ld.qualification?.property_type || "property"} in the ${(ld.qualification?.locations || ["local area"]).join("/")} area. Budget: $${((ld.qualification?.budget_min || 300000) / 1000).toFixed(0)}K-$${((ld.qualification?.budget_max || 500000) / 1000).toFixed(0)}K. ${ld.qualification?.pre_approved ? "Pre-approved." : "Not yet pre-approved."}`
          : `Lead is looking to ${ld.intent} their property. ${ld.qualification?.motivation || "Motivated to move forward."}`
      }`,
      qualification_snapshot: ld.qualification || {},
      key_talking_points: [
        ld.intent === "buyer" ? "Discuss available properties in target neighborhoods" : "Present comparable market analysis",
        ld.qualification?.pre_approved ? "Leverage strong pre-approval" : "Discuss financing options",
        ld.qualification?.urgency === "hot" ? "Be ready to move quickly — high urgency" : "Build rapport, no pressure",
        ld.qualification?.objections?.length ? `Address concern: ${ld.qualification.objections[0]}` : "Explore any concerns or hesitations",
      ],
    });

    appointmentCount++;
    console.log(`  ✓ ${ld.name} — ${isUpcoming ? "upcoming" : "past"}`);
  }
  console.log(`${appointmentCount} appointments inserted.\n`);

  // ─── Insert Objection Scripts ───
  console.log("Inserting objection scripts...");

  for (const obj of objectionScripts) {
    const agent = voiceAgents.length > 0 ? randomItem(voiceAgents) : null;

    await supabase.from("objection_scripts").insert({
      realtor_id: realtorId,
      agent_id: agent?.id || null,
      ...obj,
    });
  }
  console.log(`${objectionScripts.length} objection scripts inserted.\n`);

  console.log("Pipeline seed complete!");
  console.log(`  ${insertedLeadEntries.length} leads across 5 stages`);
  console.log(`  ${callCount} call records with transcripts`);
  console.log(`  ${followUpCount} follow-up activities`);
  console.log(`  ${appointmentCount} appointments with handoff summaries`);
  console.log(`  ${objectionScripts.length} objection scripts`);
}

seedPipeline().catch(console.error);
