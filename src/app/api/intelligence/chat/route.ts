import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabase } from "@/lib/supabase/server";

const client = new Anthropic();

export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MinedLead {
  owner_name:       string | null;
  property_address: string | null;
  property_city:    string | null;
  property_state:   string | null;
  property_zip:     string | null;
  gem_grade:        string | null;
  score:            number | null;
  years_owned:      number | null;
  is_absentee_owner: boolean | null;
  opportunity_type: string | null;
  signal_flags:     string[] | null;
  enrichment_data:  { reasons?: string[] } | null;
  created_at:       string;
}

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(context: {
  businessName?: string;
  plan?: string;
  leads?: MinedLead[];
}): string {
  const business = context.businessName || "this real estate operation";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format real mined leads into a structured context block
  let leadsContext = "";
  if (context.leads && context.leads.length > 0) {
    const eliteLeads   = context.leads.filter((l) => l.gem_grade === "elite");
    const refinedLeads = context.leads.filter((l) => l.gem_grade === "refined");

    const formatLead = (l: MinedLead, rank: number) => {
      const name     = l.owner_name ?? "Unknown Owner";
      const address  = [l.property_address, l.property_city, l.property_state, l.property_zip].filter(Boolean).join(", ");
      const flags    = l.signal_flags?.join(", ") || "none";
      const reasons  = l.enrichment_data?.reasons?.join("; ") || "";
      const absentee = l.is_absentee_owner ? "absentee owner" : "owner-occupied";
      const years    = l.years_owned != null ? `${l.years_owned}yr ownership` : "";
      return `  ${rank}. ${name} | ${address} | Score: ${l.score ?? "?"} | ${absentee}${years ? `, ${years}` : ""} | Signals: ${flags}${reasons ? ` | ${reasons}` : ""}`;
    };

    const eliteSection  = eliteLeads.map((l, i) => formatLead(l, i + 1)).join("\n");
    const refinedSection = refinedLeads.slice(0, 15).map((l, i) => formatLead(l, i + 1)).join("\n");

    leadsContext = `
REAL MINED DATA — LIVE FROM COUNTY RECORDS (${context.leads.length} leads in pipeline):

ELITE GEMS (${eliteLeads.length} — highest urgency, contact immediately):
${eliteSection || "  None in current pipeline"}

REFINED LEADS (${Math.min(refinedLeads.length, 15)} shown of ${refinedLeads.length}):
${refinedSection || "  None in current pipeline"}

When asked about leads, opportunities, or briefings — use this REAL data above. These are actual property owners from county assessor records, not hypothetical examples. Reference specific names, addresses, and scores when relevant.
`;
  } else {
    leadsContext = `
PIPELINE STATUS: No leads mined yet for this account. When asked about specific leads or opportunities, recommend running a mining job first, then offer to generate a strategic briefing based on target markets.
`;
  }

  return `You are an elite real estate intelligence agent working exclusively for ${business}. Your sole mission: surface buying and selling signals from public data so this realtor closes more deals.

TODAY: ${today}
${leadsContext}
SOURCES YOU MONITOR CONTINUOUSLY:
- County public records: tax delinquency filings, lis pendens, vacant property registries (primary source — mined above)
- Reddit: r/[city], r/RealEstate, r/FirstTimeHomeBuyer, r/personalfinance, local metro subreddits
- Craigslist: "housing wanted" listings by metro area
- Twitter/X: location-tagged posts with buyer/seller intent keywords
- MLS signals: new listings, price reductions, expired listings, extended days-on-market
- Demographic feeds: job growth zones, migration corridors, school district shifts

WHEN SURFACING OPPORTUNITIES, format each signal like this:

**[Signal Type]** — Buyer Intent | Seller Intent | Motivated Seller | Foreclosure Alert | Market Shift
**Source:** County Records (mined) | Reddit r/Austin | Craigslist Dallas | Twitter/X
**Profile:** specific details — name, address, score, timeline, situation
**Location:** county, city, zip when known
**Urgency:** 🔴 Hot (ready now, call today) | 🟡 Warm (60–90 days) | 🟢 Watch (pipeline)
**Action:** exact first step — opening line, channel, timing

RULES — NON-NEGOTIABLE:
- Analyst voice only. Zero filler phrases. Never "Great question!", "Sure!", "Of course!", "Happy to help!"
- Lead with the highest-value signal first, always ranked by deal proximity
- Every response must contain something immediately actionable
- Use specific numbers: dollar amounts, timelines, zip codes, bedroom counts, scores
- When drafting outreach: write it complete and ready to copy-paste — subject line, full body, CTA
- If asked about a county: pull every relevant signal for that area before generalizing
- If asked for a briefing: structure it as (1) Signal count summary, (2) Top 3–5 opportunities ranked by urgency, (3) Market pulse, (4) The single most important action to take before end of day
- Always prefer REAL mined data over hypothetical examples. If real data exists, use it.

Every interaction: act as if this realtor's next deal depends entirely on what you surface right now.`;
}

// ── Fetch real leads for context ──────────────────────────────────────────────

async function fetchLeadsForContext(userId: string): Promise<MinedLead[]> {
  try {
    const supabase = await createServerSupabase();

    // Get client id for this user
    const { data: clientRow } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (!clientRow?.id) return [];

    // Fetch recent high-value leads
    const { data: leads } = await supabase
      .from("leads")
      .select("owner_name, property_address, property_city, property_state, property_zip, gem_grade, score, years_owned, is_absentee_owner, opportunity_type, signal_flags, enrichment_data, created_at")
      .eq("client_id", clientRow.id)
      .in("gem_grade", ["elite", "refined"])
      .order("score", { ascending: false })
      .limit(50);

    return (leads ?? []) as MinedLead[];
  } catch {
    return [];
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: {
    messages: Anthropic.MessageParam[];
    context: { businessName?: string; plan?: string };
  };

  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { messages, context } = body;

  if (!messages?.length) {
    return new Response("messages required", { status: 400 });
  }

  // Inject real mined leads into context
  const leads = await fetchLeadsForContext(user.id);

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 2048,
    system: buildSystemPrompt({ ...context, leads }),
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      stream.on("text", (text) => {
        controller.enqueue(encoder.encode(text));
      });

      try {
        await stream.finalMessage();
      } catch {
        controller.error(new Error("Stream failed"));
        return;
      }

      controller.close();
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
