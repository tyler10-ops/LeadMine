import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getAuthenticatedRealtorId } from "@/lib/hub/helpers";

// Deterministic mock transcript generator — no external API needed
function generateMockTranscript(leadName: string, intent: string) {
  const name = leadName || "there";
  const now = Date.now();

  const buyerConvo = [
    { speaker: "ai" as const, text: `Hi, this is Sarah from RE Autopilot. Am I speaking with ${name}?`, timestamp_ms: 0 },
    { speaker: "lead" as const, text: "Yes, that's me. Who's calling?", timestamp_ms: 3200 },
    { speaker: "ai" as const, text: "I'm following up on your recent inquiry about homes in the area. You mentioned you were interested in buying. Is that still the case?", timestamp_ms: 5800 },
    { speaker: "lead" as const, text: "Yeah, we've been looking for a few months now. Haven't found the right place yet.", timestamp_ms: 12400 },
    { speaker: "ai" as const, text: "I understand. What's been the biggest challenge so far — pricing, location, or finding the right features?", timestamp_ms: 18200 },
    { speaker: "lead" as const, text: "Honestly, it's the prices. Everything in our target area is above our budget.", timestamp_ms: 24600 },
    { speaker: "ai" as const, text: "That's a common concern right now. Can you share your budget range so I can see what options we might have?", timestamp_ms: 31000 },
    { speaker: "lead" as const, text: "We're looking at $350K to $450K ideally.", timestamp_ms: 36800, sentiment: "neutral" as const },
    { speaker: "ai" as const, text: "Got it. And are you pre-approved for a mortgage yet?", timestamp_ms: 40200 },
    { speaker: "lead" as const, text: "Yes, we got pre-approved last month for up to $475K.", timestamp_ms: 44600, sentiment: "positive" as const },
    { speaker: "ai" as const, text: "That's great — you're in a strong position. I'd love to set up a consultation with one of our agents who specializes in your target area. Would Thursday or Friday work better for you?", timestamp_ms: 48800 },
    { speaker: "lead" as const, text: "Thursday afternoon would work. Around 2pm?", timestamp_ms: 56200, sentiment: "positive" as const },
    { speaker: "ai" as const, text: "Perfect. I'll get that booked for Thursday at 2pm. You'll receive a confirmation text shortly. Is there anything else you'd like us to prepare for the meeting?", timestamp_ms: 60400 },
    { speaker: "lead" as const, text: "No, that sounds good. Looking forward to it.", timestamp_ms: 67800 },
    { speaker: "ai" as const, text: "Wonderful. We'll see you Thursday. Have a great rest of your day!", timestamp_ms: 71200 },
  ];

  const sellerConvo = [
    { speaker: "ai" as const, text: `Good afternoon! This is Alex from RE Autopilot. May I speak with ${name}?`, timestamp_ms: 0 },
    { speaker: "lead" as const, text: "Speaking. What's this about?", timestamp_ms: 3400 },
    { speaker: "ai" as const, text: "I noticed you recently submitted an inquiry about selling your property. I wanted to follow up and see if you're still considering listing.", timestamp_ms: 6200 },
    { speaker: "lead" as const, text: "I'm thinking about it, but I'm not sure about the timing. The market seems uncertain.", timestamp_ms: 13800 },
    { speaker: "ai" as const, text: "I completely understand that concern. Actually, in your area, inventory is still quite low which means sellers are in a favorable position. What's driving your interest in selling?", timestamp_ms: 20200 },
    { speaker: "lead" as const, text: "We're looking to downsize. Kids moved out and the house is too big for just the two of us.", timestamp_ms: 28600, sentiment: "neutral" as const },
    { speaker: "ai" as const, text: "That makes sense. A lot of our clients are in a similar situation. Would you be open to a free market analysis of your property? It can help you understand what your home might sell for in today's market.", timestamp_ms: 34800 },
    { speaker: "lead" as const, text: "Sure, that would be helpful. No obligation, right?", timestamp_ms: 42200 },
    { speaker: "ai" as const, text: "Absolutely no obligation. Just information to help you make the best decision. Can we schedule a walkthrough sometime this week?", timestamp_ms: 46600 },
    { speaker: "lead" as const, text: "How about Wednesday morning?", timestamp_ms: 52800, sentiment: "positive" as const },
    { speaker: "ai" as const, text: "Wednesday morning works perfectly. I'll have our listing specialist reach out to confirm the time. Thank you for your time today!", timestamp_ms: 56200 },
  ];

  const defaultConvo = [
    { speaker: "ai" as const, text: `Hi ${name}, this is the RE Autopilot team following up on your recent inquiry. Do you have a moment?`, timestamp_ms: 0 },
    { speaker: "lead" as const, text: "Sure, what's this regarding?", timestamp_ms: 4200 },
    { speaker: "ai" as const, text: "You recently expressed interest in real estate services. I wanted to learn more about what you're looking for so we can best help you.", timestamp_ms: 7800 },
    { speaker: "lead" as const, text: "I'm just exploring my options right now. Not ready to commit to anything.", timestamp_ms: 14600, sentiment: "neutral" as const },
    { speaker: "ai" as const, text: "No pressure at all. Are you leaning more toward buying, selling, or investing?", timestamp_ms: 20200 },
    { speaker: "lead" as const, text: "Probably buying eventually. Maybe in 6 months or so.", timestamp_ms: 25800 },
    { speaker: "ai" as const, text: "That's a great timeline. I can keep you updated on market trends in your area. Would it be helpful if I sent you a weekly market update?", timestamp_ms: 30400 },
    { speaker: "lead" as const, text: "Yeah, that would actually be nice.", timestamp_ms: 36200, sentiment: "positive" as const },
    { speaker: "ai" as const, text: "I'll get that set up for you. And when you're ready to get more serious, we'll be here. Have a great day!", timestamp_ms: 40600 },
  ];

  const convos: Record<string, typeof buyerConvo> = { buyer: buyerConvo, seller: sellerConvo };
  return convos[intent] || defaultConvo;
}

export async function POST(request: NextRequest) {
  try {
    const realtorId = await getAuthenticatedRealtorId();
    if (!realtorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lead_id, agent_id } = body;

    if (!lead_id || !agent_id) {
      return NextResponse.json(
        { error: "lead_id and agent_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Get lead info for realistic transcript
    const { data: lead } = await supabase
      .from("leads")
      .select("name, intent")
      .eq("id", lead_id)
      .single();

    const transcript = generateMockTranscript(lead?.name || "there", lead?.intent || "unknown");
    const lastEntry = transcript[transcript.length - 1];
    const duration = Math.round((lastEntry.timestamp_ms + 4000) / 1000);

    const outcomes = ["appointment_set", "follow_up_needed", "qualified"];
    const outcome = lead?.intent === "buyer" || lead?.intent === "seller"
      ? "appointment_set"
      : outcomes[Math.floor(Math.random() * outcomes.length)];

    const { data: callRecord, error } = await supabase
      .from("call_records")
      .insert({
        realtor_id: realtorId,
        lead_id,
        agent_id,
        direction: "outbound",
        status: "completed",
        duration_seconds: duration,
        transcript,
        sentiment: "positive",
        ai_summary: `Successful outbound call with ${lead?.name || "lead"}. ${
          outcome === "appointment_set"
            ? "Appointment was booked."
            : "Follow-up scheduled."
        }`,
        objections_raised: lead?.intent === "buyer" ? ["price"] : [],
        outcome,
        started_at: new Date().toISOString(),
        ended_at: new Date(Date.now() + duration * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update lead contact timestamp and stage
    const stageUpdate: Record<string, unknown> = {
      last_contact_at: new Date().toISOString(),
    };
    if (outcome === "appointment_set") {
      stageUpdate.stage = "booked";
      stageUpdate.stage_changed_at = new Date().toISOString();
    } else if (outcome === "qualified") {
      stageUpdate.stage = "qualified";
      stageUpdate.stage_changed_at = new Date().toISOString();
    } else {
      stageUpdate.stage = "contacted";
      stageUpdate.stage_changed_at = new Date().toISOString();
    }

    await supabase
      .from("leads")
      .update(stageUpdate)
      .eq("id", lead_id)
      .eq("realtor_id", realtorId);

    return NextResponse.json(callRecord);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
