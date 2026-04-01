import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import type { PropertyLead, OutreachChannel, OutreachTone } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── POST — generate a draft ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      leadId: string;
      channel: OutreachChannel;
      tone: OutreachTone;
    };
    const { leadId, channel, tone } = body;
    if (!leadId || !channel || !tone) {
      return NextResponse.json({ error: "Missing leadId, channel, or tone" }, { status: 400 });
    }

    // Get realtor
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id, name, city, state")
      .eq("user_id", user.id)
      .single();

    if (!realtor) {
      return NextResponse.json({ error: "Realtor profile not found" }, { status: 404 });
    }

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const typedLead = lead as PropertyLead;

    // Build generation prompt
    const { prompt, systemPrompt } = buildPrompt(typedLead, realtor, channel, tone);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse subject + body from email responses
    let subject: string | null = null;
    let messageBody = text;

    if (channel === "email") {
      const subjectMatch = text.match(/^Subject:\s*(.+)\n/i);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        messageBody = text.replace(/^Subject:\s*.+\n\n?/i, "").trim();
      }
    }

    // Save draft to Supabase
    const { data: draft, error: insertError } = await supabase
      .from("outreach_drafts")
      .insert({
        realtor_id: realtor.id,
        lead_id:    leadId,
        subject,
        body:       messageBody,
        channel,
        tone,
        status:     "draft",
        ai_model:   "claude-sonnet-4-20250514",
      })
      .select()
      .single();

    if (insertError) {
      // Return generated content even if save fails
      return NextResponse.json({
        draft: { id: null, realtor_id: realtor.id, lead_id: leadId, subject, body: messageBody, channel, tone, status: "draft", ai_model: "claude-sonnet-4-20250514", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      });
    }

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("Outreach generate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── PATCH — update draft status or body ────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      draftId: string;
      status?: string;
      body?: string;
      subject?: string;
    };
    const { draftId, status, body: msgBody, subject } = body;
    if (!draftId) return NextResponse.json({ error: "Missing draftId" }, { status: 400 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status)  updates.status  = status;
    if (msgBody) updates.body    = msgBody;
    if (subject !== undefined) updates.subject = subject;

    const { data: draft, error } = await supabase
      .from("outreach_drafts")
      .update(updates)
      .eq("id", draftId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ draft });
  } catch (err) {
    console.error("Outreach patch error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildPrompt(
  lead: PropertyLead,
  realtor: { name: string; city: string; state: string | null },
  channel: OutreachChannel,
  tone: OutreachTone
): { prompt: string; systemPrompt: string } {
  const name        = lead.owner_name || lead.business_name || "there";
  const location    = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "your area";
  const value       = lead.estimated_value ?? lead.assessed_value;
  const valueStr    = value ? `$${(value / 1000).toFixed(0)}K` : null;
  const leadType    = lead.opportunity_type ?? "seller";
  const signals     = (lead.signal_flags ?? []).slice(0, 3).join(", ") || null;
  const agentName   = realtor.name || "your agent";
  const agentMarket = [realtor.city, realtor.state].filter(Boolean).join(", ") || "your area";

  const toneInstructions: Record<OutreachTone, string> = {
    professional: "Write in a polished, professional tone. Be direct and respectful of their time.",
    casual:       "Write in a warm, conversational tone. Feel approachable and genuine — like a neighbor, not a salesperson.",
    urgent:       "Write with a sense of appropriate urgency. Mention current market timing or a limited opportunity angle without being pushy.",
  };

  const channelInstructions: Record<OutreachChannel, string> = {
    email:
      "Write a cold outreach email. Start with 'Subject: [compelling subject line]' on line 1, then a blank line, then the email body. Keep body under 150 words. Sign off with the agent's name.",
    sms:
      "Write a short SMS message. 160 characters max. Conversational, no formal sign-off. Just a quick, human intro. No links.",
    call_script:
      "Write a natural phone call script. Include: opening intro, reason for calling, one compelling hook, 2-3 qualifying questions to ask, and a soft close asking for a time to talk. Format with labeled sections: OPENING, HOOK, QUESTIONS, CLOSE.",
  };

  const systemPrompt = `You are an expert real estate copywriter helping ${agentName}, a realtor based in ${agentMarket}, write personalized outreach to leads. Your messages are human, specific, and never sound like spam. Never use the word "synergy" or generic phrases like "I hope this message finds you well."`;

  const prompt = `Write a ${channel.replace("_", " ")} for this real estate lead:

Lead name: ${name}
Location: ${location}
${valueStr ? `Estimated property value: ${valueStr}` : ""}
${signals ? `Key signals: ${signals}` : ""}
Lead type: ${leadType}

Agent: ${agentName} (${agentMarket})

Tone: ${toneInstructions[tone]}
Format: ${channelInstructions[channel]}

Write only the message — no explanations or meta-commentary.`;

  return { prompt, systemPrompt };
}
