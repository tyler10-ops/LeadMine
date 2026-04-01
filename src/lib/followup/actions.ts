/**
 * Follow-Up Action Executors
 *
 * One function per sequence step channel.
 * These run inside the BullMQ worker — no Next.js request context.
 * All Supabase access uses the service-role client.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { initiateVapiCall, normalizePhone } from "@/lib/calling/vapi";
import { calculateHeatScore } from "@/lib/scoring/heat-score";
import type { PropertyLead, SearchArea } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Shared lead/realtor fetch ─────────────────────────────────────────────────

async function fetchLead(leadId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();
  return data as PropertyLead | null;
}

async function fetchRealtor(realtorId: string, supabase: SupabaseClient) {
  const { data } = await supabase
    .from("realtors")
    .select("id, name, city, state")
    .eq("id", realtorId)
    .single();
  return data as { id: string; name: string; city: string; state: string } | null;
}

// ── Email step ────────────────────────────────────────────────────────────────

export async function executeEmailStep(
  leadId:    string,
  realtorId: string,
  supabase:  SupabaseClient
): Promise<{ draftId: string | null }> {
  const [lead, realtor] = await Promise.all([
    fetchLead(leadId, supabase),
    fetchRealtor(realtorId, supabase),
  ]);
  if (!lead || !realtor) return { draftId: null };

  const name        = lead.owner_name ?? lead.company_name ?? "there";
  const location    = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "your area";
  const agentName   = realtor.name  ?? "your agent";
  const agentMarket = [realtor.city, realtor.state].filter(Boolean).join(", ") || "your area";

  const systemPrompt = `You are an expert real estate copywriter helping ${agentName}, a realtor in ${agentMarket}, write personalized cold outreach to leads. Messages are human, specific, and never generic.`;

  const prompt = `Write a cold outreach email for this real estate lead:

Lead name: ${name}
Location: ${location}
Lead type: ${lead.opportunity_type ?? "seller"}
${lead.signal_flags?.length ? `Key signals: ${lead.signal_flags.slice(0, 3).join(", ")}` : ""}

Agent: ${agentName} (${agentMarket})

Start with "Subject: [compelling subject line]" on line 1, blank line, then body under 150 words. Sign off with the agent's name. Professional tone. No filler phrases.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const subjectMatch = text.match(/^Subject:\s*(.+)\n/i);
  const subject  = subjectMatch?.[1].trim() ?? null;
  const body     = text.replace(/^Subject:\s*.+\n\n?/i, "").trim();

  const { data: draft } = await supabase
    .from("outreach_drafts")
    .insert({
      realtor_id: realtorId,
      lead_id:    leadId,
      channel:    "email",
      tone:       "professional",
      subject,
      body,
      status:     "queued_to_send",
      ai_model:   "claude-sonnet-4-20250514",
    })
    .select("id")
    .single();

  return { draftId: draft?.id ?? null };
}

// ── Call step ─────────────────────────────────────────────────────────────────

export async function executeCallStep(
  leadId:    string,
  realtorId: string,
  supabase:  SupabaseClient
): Promise<{ callRecordId: string | null; skipped?: string }> {
  const [lead, realtor] = await Promise.all([
    fetchLead(leadId, supabase),
    fetchRealtor(realtorId, supabase),
  ]);
  if (!lead || !realtor) return { callRecordId: null, skipped: "Lead or realtor not found" };

  // Skip if already contacted or beyond
  if (lead.stage && !["new", "contacted"].includes(lead.stage)) {
    return { callRecordId: null, skipped: `Lead stage is ${lead.stage} — skipping call` };
  }

  if (!lead.phone) {
    return { callRecordId: null, skipped: "Lead has no phone number" };
  }

  const normalized = normalizePhone(lead.phone);
  if (!normalized.match(/^\+\d{10,15}$/)) {
    return { callRecordId: null, skipped: `Invalid phone: ${lead.phone}` };
  }

  // Create call record
  const { data: callRecord } = await supabase
    .from("call_records")
    .insert({
      realtor_id: realtorId,
      lead_id:    leadId,
      direction:  "outbound",
      status:     "initiated",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (!callRecord) return { callRecordId: null, skipped: "Failed to create call record" };

  try {
    const vapiCall = await initiateVapiCall({
      leadPhone:       normalized,
      leadName:        lead.owner_name ?? lead.company_name ?? "",
      leadIntent:      lead.intent ?? "seller",
      realtorName:     realtor.name   ?? "your agent",
      realtorBusiness: "LeadMine Realty",
      callRecordId:    callRecord.id,
      webhookUrl:      `${APP_URL}/api/calling/webhook`,
    });

    await supabase
      .from("call_records")
      .update({ status: "ringing", vapi_call_id: vapiCall.id })
      .eq("id", callRecord.id);

    await supabase
      .from("leads")
      .update({ stage: "contacted", stage_changed_at: new Date().toISOString(), last_contact_at: new Date().toISOString() })
      .eq("id", leadId);

    return { callRecordId: callRecord.id };
  } catch (err) {
    await supabase
      .from("call_records")
      .update({ status: "failed", ai_summary: `Auto-call failed: ${err instanceof Error ? err.message : String(err)}` })
      .eq("id", callRecord.id);

    return { callRecordId: callRecord.id, skipped: `Vapi error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── SMS step ──────────────────────────────────────────────────────────────────

export async function executeSmsStep(
  leadId:    string,
  realtorId: string,
  supabase:  SupabaseClient
): Promise<{ draftId: string | null }> {
  const [lead, realtor] = await Promise.all([
    fetchLead(leadId, supabase),
    fetchRealtor(realtorId, supabase),
  ]);
  if (!lead || !realtor) return { draftId: null };

  const name      = (lead.owner_name ?? lead.company_name ?? "").split(" ")[0] || "there";
  const agentName = realtor.name ?? "your agent";

  const prompt = `Write a short real estate SMS follow-up (160 chars max) from ${agentName} to ${name}. Lead type: ${lead.opportunity_type ?? "seller"}. Quick, human, friendly. No links. Just the message text — no labels.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: prompt }],
  });

  const body = response.content[0].type === "text"
    ? response.content[0].text.trim().slice(0, 160)
    : "";

  const { data: draft } = await supabase
    .from("outreach_drafts")
    .insert({
      realtor_id: realtorId,
      lead_id:    leadId,
      channel:    "sms",
      tone:       "casual",
      body,
      status:     "queued_to_send",
      ai_model:   "claude-haiku-4-5-20251001",
    })
    .select("id")
    .single();

  return { draftId: draft?.id ?? null };
}

// ── Re-score step ─────────────────────────────────────────────────────────────

export async function executeRescoreStep(
  leadId:    string,
  realtorId: string,
  supabase:  SupabaseClient
): Promise<{ newScore: number | null; newTier: string | null }> {
  const [lead, profile] = await Promise.all([
    fetchLead(leadId, supabase),
    supabase
      .from("search_areas")
      .select("*")
      .eq("realtor_id", realtorId)
      .eq("is_onboarding_profile", true)
      .single()
      .then(r => r.data),
  ]);

  if (!lead || !profile) return { newScore: null, newTier: null };

  const result = await calculateHeatScore(lead, profile as SearchArea);

  await supabase
    .from("leads")
    .update({
      heat_score:     result.score,
      heat_tier:      result.tier,
      heat_breakdown: result.breakdown,
      heat_reasoning: result.reasoning,
      heat_scored_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  console.log(`[followup] Re-scored lead ${leadId}: ${result.tier} (${result.score})`);
  return { newScore: result.score, newTier: result.tier };
}
