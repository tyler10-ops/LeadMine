import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { chatCompletion, classifyIntent, summarizeConversation } from "@/lib/ai/claude";
import {
  chatSystemPrompt,
  classifyIntentPrompt,
  summarizeConversationPrompt,
} from "@/lib/ai/prompts";
import type { ChatMessage, ChatRequest, ChatResponse } from "@/types";

const GATE_AFTER_MESSAGES = 3;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationId, realtorId } = body;

    if (!message || !realtorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get realtor info
    const { data: realtor, error: realtorError } = await supabase
      .from("realtors")
      .select("name, city, state")
      .eq("id", realtorId)
      .single();

    if (realtorError || !realtor) {
      return NextResponse.json(
        { error: "Realtor not found" },
        { status: 404 }
      );
    }

    // Load or create conversation
    let convoId = conversationId;
    let existingMessages: ChatMessage[] = [];

    if (convoId) {
      const { data: convo } = await supabase
        .from("conversations")
        .select("messages, gated")
        .eq("id", convoId)
        .single();

      if (convo) {
        existingMessages = convo.messages || [];
      }
    } else {
      const { data: newConvo } = await supabase
        .from("conversations")
        .insert({ realtor_id: realtorId, messages: [] })
        .select("id")
        .single();

      convoId = newConvo?.id;

      // Track chat start event
      await supabase.from("events").insert({
        realtor_id: realtorId,
        type: "chat_start",
      });
    }

    if (!convoId) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    // Build messages for Claude
    const newUserMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const allMessages = [...existingMessages, newUserMessage];
    const claudeMessages = allMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Get AI response
    const systemPrompt = chatSystemPrompt(realtor.name, realtor.city);
    const reply = await chatCompletion(systemPrompt, claudeMessages);

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...allMessages, assistantMessage];
    const userMessageCount = updatedMessages.filter(
      (m) => m.role === "user"
    ).length;
    const shouldGate = userMessageCount >= GATE_AFTER_MESSAGES;

    // Update conversation
    await supabase
      .from("conversations")
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", convoId);

    // If gating threshold reached, classify intent in background
    if (shouldGate) {
      const convoText = updatedMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      Promise.all([
        classifyIntent(convoText, classifyIntentPrompt()),
        summarizeConversation(summarizeConversationPrompt(), convoText),
      ]).then(async ([classification, summary]) => {
        await supabase
          .from("conversations")
          .update({
            intent: classification.intent,
            summary,
            gated: true,
          })
          .eq("id", convoId);
      });
    }

    const response: ChatResponse = {
      reply,
      conversationId: convoId,
      shouldGate,
      messageCount: userMessageCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
