import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { classifyIntent } from "@/lib/ai/claude";
import { classifyIntentPrompt } from "@/lib/ai/prompts";
import type { LeadCaptureRequest } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: LeadCaptureRequest = await request.json();
    const { email, name, conversationId, realtorId } = body;

    if (!email || !realtorId) {
      return NextResponse.json(
        { error: "Email and realtorId are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get conversation to classify intent
    let intent = "unknown";
    let score = 0;
    let notes = "";

    if (conversationId) {
      const { data: convo } = await supabase
        .from("conversations")
        .select("messages, intent, summary")
        .eq("id", conversationId)
        .single();

      if (convo) {
        if (convo.intent) {
          intent = convo.intent;
        } else {
          const convoText = (convo.messages || [])
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join("\n");

          const classification = await classifyIntent(
            convoText,
            classifyIntentPrompt()
          );
          intent = classification.intent;
          score = classification.score;
          notes = classification.summary;
        }
      }
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        realtor_id: realtorId,
        email,
        name: name || null,
        intent,
        score,
        notes,
        source: "chat",
      })
      .select("id")
      .single();

    if (leadError) {
      console.error("Lead creation error:", leadError);
      return NextResponse.json(
        { error: "Failed to capture lead" },
        { status: 500 }
      );
    }

    // Link lead to conversation
    if (conversationId && lead) {
      await supabase
        .from("conversations")
        .update({ lead_id: lead.id })
        .eq("id", conversationId);
    }

    // Track lead capture event
    await supabase.from("events").insert({
      realtor_id: realtorId,
      type: "lead_capture",
      metadata: { intent, email },
    });

    return NextResponse.json({ success: true, leadId: lead?.id });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
