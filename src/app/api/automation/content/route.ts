/**
 * POST /api/automation/content
 *
 * AI content generation for realtors.
 * Generates: social_post | listing_description | market_summary | email_newsletter | cold_script
 *
 * Body: {
 *   type: ContentType
 *   context?: string        // free-form context (neighborhood, property details, etc.)
 *   platform?: string       // for social_post: "linkedin" | "instagram" | "facebook"
 *   tone?: "professional" | "casual" | "urgent"
 *   saveAsDraft?: boolean   // save to outreach_drafts if true
 *   leadId?: string         // required if saveAsDraft = true
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ContentType =
  | "social_post"
  | "listing_description"
  | "market_summary"
  | "email_newsletter"
  | "cold_script";

function buildContentPrompt(
  type: ContentType,
  realtor: { name: string; city: string; state: string },
  context: string,
  platform: string,
  tone: string
): { system: string; user: string } {
  const agentName   = realtor.name          ?? "your agent";
  const market      = [realtor.city, realtor.state].filter(Boolean).join(", ") || "your area";
  const business    = "LeadMine Realty";

  const toneMap: Record<string, string> = {
    professional: "polished, authoritative, and data-driven",
    casual:       "warm, conversational, and approachable — like a neighbor",
    urgent:       "timely, opportunity-focused, with clear market momentum",
  };
  const toneDesc = toneMap[tone] ?? toneMap.professional;

  const system = `You are an expert real estate content writer for ${agentName} at ${business}, serving the ${market} market. Write ${toneDesc} content. Never use filler phrases or clichés. Be specific and human.`;

  const prompts: Record<ContentType, string> = {
    social_post: `Write a ${platform ?? "LinkedIn"} post for a real estate agent.
Context: ${context || `Market update for ${market}`}
Requirements:
- 150-250 words for LinkedIn, 80-120 for Instagram/Facebook
- Hook in first line that stops the scroll
- 1-2 specific data points or insights
- Clear call to action at the end
- For LinkedIn: 3-5 relevant hashtags at the end
- Do NOT use emojis unless it's Instagram
Output only the post text.`,

    listing_description: `Write a compelling property listing description.
Property details: ${context || "3BR/2BA single family home, updated kitchen, large backyard"}
Requirements:
- 150-200 words
- Lead with the strongest selling point
- Mention neighborhood lifestyle, not just features
- End with urgency or call to action
- No generic phrases like "must see" or "won't last long"
Output only the listing description.`,

    market_summary: `Write a brief market intelligence summary for ${market}.
Context: ${context || `Current real estate market conditions in ${market}`}
Requirements:
- 200-250 words
- Written for a realtor to share with clients
- 3 sections: Current Conditions, Key Trends, What It Means for You
- Include at least 2 specific data points (you can use plausible estimates)
- Actionable takeaway at the end
Output only the market summary.`,

    email_newsletter: `Write a real estate newsletter email for ${agentName}'s client list.
Context: ${context || `Monthly market update for ${market}`}
Requirements:
- Subject line on line 1: "Subject: [compelling subject]"
- Blank line, then the body
- 300-400 word body
- Sections: Market Pulse, Opportunity Spotlight, One Actionable Tip
- Personal, advisory tone — not a press release
- Sign off with ${agentName}
Output only the email (subject + body).`,

    cold_script: `Write a cold outreach phone script for a real estate agent.
Context: ${context || "Calling a homeowner who hasn't listed but may be interested in selling"}
Requirements:
- Sections labeled: OPENING, HOOK, QUALIFYING QUESTIONS (2-3), SOFT CLOSE
- Conversational, not robotic
- Hook = one compelling reason they should care right now
- Qualifying questions reveal: timeline, motivation, current situation
- Soft close = ask for a 15-min call or walkthrough
- Total length: ~200-250 words
Output only the script.`,
  };

  return { system, user: prompts[type] };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      type:         ContentType;
      context?:     string;
      platform?:    string;
      tone?:        string;
      saveAsDraft?: boolean;
      leadId?:      string;
    };

    const { type, context = "", platform = "linkedin", tone = "professional", saveAsDraft = false, leadId } = body;

    const validTypes: ContentType[] = ["social_post", "listing_description", "market_summary", "email_newsletter", "cold_script"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id, name, city, state")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor profile not found" }, { status: 404 });

    const { system, user: userPrompt } = buildContentPrompt(
      type,
      realtor as unknown as { name: string; city: string; state: string },
      context,
      platform,
      tone
    );

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 800,
      system,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // Parse subject for email types
    let subject: string | null = null;
    let contentBody = text;
    if (type === "email_newsletter") {
      const match = text.match(/^Subject:\s*(.+)\n/i);
      if (match) {
        subject = match[1].trim();
        contentBody = text.replace(/^Subject:\s*.+\n\n?/i, "").trim();
      }
    }

    // Optionally save as outreach draft
    let draft = null;
    if (saveAsDraft && leadId) {
      const channelMap: Partial<Record<ContentType, string>> = {
        email_newsletter: "email",
        cold_script:      "call_script",
        social_post:      "email", // closest match
      };
      const channel = channelMap[type] ?? "email";

      const { data: savedDraft } = await supabase
        .from("outreach_drafts")
        .insert({
          realtor_id: realtor.id,
          lead_id:    leadId,
          channel,
          tone,
          subject,
          body:       contentBody,
          status:     "draft",
          ai_model:   "claude-sonnet-4-20250514",
        })
        .select()
        .single();

      draft = savedDraft;
    }

    return NextResponse.json({
      type,
      subject,
      body:     contentBody,
      fullText: text,
      draft,
      model:    "claude-sonnet-4-20250514",
    });
  } catch (err) {
    console.error("[automation/content]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
