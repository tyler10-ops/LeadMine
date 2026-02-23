import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateContent } from "@/lib/ai/claude";
import { contentGenerationPrompt } from "@/lib/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    if (!type || !["market_pulse", "buyer_tip", "seller_warning"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Get realtor profile
    const { data: realtor } = await supabase
      .from("realtors")
      .select("id, city, state")
      .eq("user_id", user.id)
      .single();

    if (!realtor) {
      return NextResponse.json(
        { error: "Realtor profile not found" },
        { status: 404 }
      );
    }

    const prompt = contentGenerationPrompt(type, realtor.city, realtor.state);
    const { title, body } = await generateContent(prompt);

    // Save to database
    const { data: content, error } = await supabase
      .from("content")
      .insert({
        realtor_id: realtor.id,
        title,
        body,
        type,
        published: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Content save error:", error);
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
