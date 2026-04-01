import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Pipeline data fetcher ──────────────────────────────────────────────────

async function fetchPipelineContext(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const [prospectsRes, statsRes] = await Promise.all([
    supabase.from("prospects").select("id,business_name,name,email,stage,score,city,state,last_emailed_at,email_opens,email_clicks,google_rating,created_at").order("score", { ascending: false }).limit(50),
    supabase.from("prospects").select("stage").then(({ data }) => {
      if (!data) return {};
      return data.reduce((acc: Record<string, number>, r) => {
        acc[r.stage] = (acc[r.stage] ?? 0) + 1;
        return acc;
      }, {});
    }),
  ]);

  const prospects  = prospectsRes.data ?? [];
  const stageCounts = statsRes;

  const hotLeads  = prospects.filter(p => p.score >= 80).slice(0, 10);
  const dueFollow = prospects.filter(p => p.stage === "emailed" && p.score >= 60).slice(0, 10);
  const demos     = prospects.filter(p => p.stage === "demo_booked");
  const trials    = prospects.filter(p => p.stage === "trial");
  const paid      = prospects.filter(p => p.stage === "paid");

  return {
    total:       prospects.length,
    stageCounts,
    hotLeads,
    dueFollow,
    demos,
    trials,
    paid,
    recentlyEngaged: prospects.filter(p => p.email_opens > 0).slice(0, 5),
  };
}

// ── System prompt builder ──────────────────────────────────────────────────

function buildSystemPrompt(ctx: Awaited<ReturnType<typeof fetchPipelineContext>>) {
  return `You are the LeadMine Sales Intelligence Agent — a sharp, data-driven AI assistant helping Tyler (the founder) manage and grow the LeadMine B2B sales pipeline.

You have real-time access to the LeadMine prospect pipeline. Here is the current state:

PIPELINE SUMMARY:
- Total prospects: ${ctx.total}
- Stage breakdown: ${JSON.stringify(ctx.stageCounts, null, 2)}
- Demos booked: ${ctx.demos.length}
- Active trials: ${ctx.trials.length}
- Paid customers: ${ctx.paid.length}

HOT LEADS (score ≥ 80):
${ctx.hotLeads.map(p => `• ${p.business_name} (${p.city}, ${p.state}) — score: ${p.score}, stage: ${p.stage}, opens: ${p.email_opens}`).join("\n") || "None yet"}

READY FOR FOLLOW-UP (emailed, score ≥ 60):
${ctx.dueFollow.map(p => `• ${p.business_name} — score: ${p.score}, last emailed: ${p.last_emailed_at ? new Date(p.last_emailed_at).toLocaleDateString() : "never"}`).join("\n") || "None"}

RECENTLY ENGAGED (opened emails):
${ctx.recentlyEngaged.map(p => `• ${p.business_name} — ${p.email_opens} opens, ${p.email_clicks} clicks`).join("\n") || "None"}

Your job:
- Give Tyler sharp, specific recommendations on who to contact next and why
- Identify patterns in what's working and what isn't
- Help prioritize time — Tyler is one person running a SaaS
- Suggest specific messaging angles based on lead scores and engagement
- Answer questions about the pipeline with exact data
- Be direct and concise — no fluff, no pleasantries beyond what's needed
- Use the data above to give real, actionable answers

Tone: Confident co-pilot. Like a sharp sales analyst who knows the business.`;
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messages } = await request.json() as {
      messages: { role: "user" | "assistant"; content: string }[];
    };

    if (!messages?.length) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    // Fetch live pipeline context
    const ctx = await fetchPipelineContext(supabase);

    // Call Claude
    const response = await anthropic.messages.create({
      model:      "claude-opus-4-5-20251101",
      max_tokens: 1024,
      system:     buildSystemPrompt(ctx),
      messages:   messages.map(m => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Agent error:", err);
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}