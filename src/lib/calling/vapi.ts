/**
 * Vapi.ai API Client
 *
 * Handles outbound AI phone calls for lead qualification and appointment booking.
 * Sign up at https://app.vapi.ai — get your API key + buy/import a phone number.
 *
 * Docs: https://docs.vapi.ai
 * Pricing: ~$0.07/min (includes STT + LLM + TTS)
 */

const VAPI_BASE = "https://api.vapi.ai";

// ── Types ──────────────────────────────────────────────────────────────────

export interface VapiCallRequest {
  phoneNumberId: string;
  customer: {
    number: string;       // E.164 format: +15551234567
    name?: string;
  };
  assistant: VapiAssistant;
  metadata?: Record<string, string>; // passed back in webhooks
}

export interface VapiAssistant {
  name: string;
  model: {
    provider: "openai" | "anthropic" | "groq";
    model: string;
    systemPrompt: string;
    temperature?: number;
  };
  voice: {
    provider: "playht" | "11labs" | "azure" | "rime-ai" | "deepgram" | "openai";
    voiceId: string;
  };
  firstMessage: string;
  endCallPhrases?: string[];
  endCallMessage?: string;
  serverUrl?: string;           // webhook URL for this call
  analysisPlan?: VapiAnalysisPlan;
  maxDurationSeconds?: number;
}

export interface VapiAnalysisPlan {
  summaryPrompt?: string;
  structuredDataPrompt?: string;
  structuredDataSchema?: object;
  successEvaluationPrompt?: string;
  successEvaluationRubric?: "NumericScale" | "DescriptiveScale" | "Checklist" | "Matrix" | "PercentageScale";
}

export interface VapiCall {
  id: string;
  status: "queued" | "ringing" | "in-progress" | "forwarding" | "ended";
  type: "outboundPhoneCall";
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  cost?: number;
  phoneNumberId: string;
  customer: { number: string; name?: string };
  metadata?: Record<string, string>;
}

// ── Webhook event types ────────────────────────────────────────────────────

export interface VapiWebhookEvent {
  message: VapiMessage;
}

export type VapiMessage =
  | VapiStatusUpdate
  | VapiEndOfCallReport
  | VapiTranscriptMessage;

export interface VapiStatusUpdate {
  type: "status-update";
  status: "started" | "ended" | "forwarding";
  endedReason?: string;
  call: VapiCall;
}

export interface VapiEndOfCallReport {
  type: "end-of-call-report";
  endedReason: string;
  call: VapiCall;
  transcript?: string;
  recordingUrl?: string;
  summary?: string;
  messages?: Array<{ role: "assistant" | "user" | "tool_calls" | "tool_call_result"; message: string; time: number }>;
  analysis?: {
    summary?: string;
    structuredData?: VapiStructuredData;
    successEvaluation?: string;
  };
}

export interface VapiTranscriptMessage {
  type: "transcript";
  role: "user" | "assistant";
  transcriptType: "partial" | "final";
  transcript: string;
  call: VapiCall;
}

// Structured data we extract from every call
export interface VapiStructuredData {
  outcome?: "appointment_set" | "follow_up" | "not_interested" | "voicemail" | "no_answer";
  intent_confirmed?: "seller" | "buyer" | "investor" | "unknown";
  timeline?: "immediate" | "1-3_months" | "3-6_months" | "6-12_months" | "not_sure";
  budget_min?: number;
  budget_max?: number;
  pre_approved?: boolean;
  objections?: string[];
  appointment_description?: string;
  follow_up_notes?: string;
}

// ── Assistant scripts ──────────────────────────────────────────────────────

function buildSystemPrompt(realtorName: string, realtorBusiness: string): string {
  return `You are Jordan, a professional real estate assistant calling on behalf of ${realtorName} at ${realtorBusiness}.

Your mission: have a warm, natural conversation — understand why the lead reached out, qualify their situation, and book a meeting with ${realtorName}.

TONE: Friendly, calm, confident. Never robotic. Never read from a script. Ask one question at a time and actually listen to the answer.

STEP 1 — OPEN STRONG:
Greet them warmly, introduce yourself as Jordan calling for ${realtorName}, and ask what prompted them to reach out.

STEP 2 — UNDERSTAND THEIR SITUATION:
Let them explain what they need. Based on what they say:

If SELLING:
- What property are they thinking about selling?
- What's driving the decision? (moving, investment, downsizing, life change)
- When are they hoping to have it on the market?
- Have they had any conversations with other agents yet?

If BUYING:
- What area or neighborhoods are they focused on?
- What's their approximate budget?
- Are they working with a lender yet / pre-approved?
- Are they actively searching now or still in early stages?

If INVESTING:
- What type of investment? (rental, flip, commercial)
- Do they have a target area or price range in mind?

STEP 3 — BOOK THE APPOINTMENT:
Once you understand their situation, say something like:
"That makes a lot of sense. ${realtorName} would be the perfect person to walk you through this — he/she has helped a lot of people in exactly your situation. I can get you on the calendar for a quick 20-minute call with no pressure. He/she has Thursday at 2pm or Friday at 10am — which works better for you?"

If they pick a time: "Perfect — I've got you down for [day] at [time] with ${realtorName}. You'll get a confirmation shortly. Is this the best number to reach you?"

STEP 4 — WRAP UP PROFESSIONALLY:
Confirm the appointment details, thank them sincerely, and end the call warmly.

IMPORTANT RULES:
- If they ask if you're AI: "Yes, I'm an AI assistant — ${realtorName} uses me to make sure every inquiry gets a fast, personal response."
- If voicemail: Leave a short, friendly message with a callback number and end the call.
- If not interested: Thank them graciously, wish them well, and hang up — no pressure ever.
- Never quote prices, make commitments, or speak to specific listings — route all of that to ${realtorName}.
- If they want to talk to ${realtorName} now: "He/she is with a client right now, but I can have them call you back within the hour — does that work?"

END the call naturally after booking an appointment, confirming a follow-up, or the lead declining.`;
}

function buildFirstMessage(leadName: string, leadIntent: string, realtorName: string): string {
  const name = leadName?.split(" ")[0] || "there";
  if (leadIntent === "seller") {
    return `Hi, is this ${name}? This is an assistant calling on behalf of ${realtorName}. You recently expressed interest in potentially selling your home — I just wanted to follow up and see if you had a quick moment to chat?`;
  }
  if (leadIntent === "buyer") {
    return `Hi ${name}, I'm calling on behalf of ${realtorName}. You recently inquired about finding a home in the area — do you have a couple minutes to talk about what you're looking for?`;
  }
  return `Hi, is this ${name}? I'm calling on behalf of ${realtorName} regarding your recent inquiry about real estate. Do you have just a moment?`;
}

// ── Analysis plan — what we extract from every call ───────────────────────

const ANALYSIS_PLAN: VapiAnalysisPlan = {
  summaryPrompt: "Summarize this call in 2-3 sentences. Include: what the lead wants, their timeline, and what was agreed upon (appointment, follow-up, or no action).",
  structuredDataSchema: {
    type: "object",
    properties: {
      outcome: {
        type: "string",
        enum: ["appointment_set", "follow_up", "not_interested", "voicemail", "no_answer"],
        description: "The result of the call",
      },
      intent_confirmed: {
        type: "string",
        enum: ["seller", "buyer", "investor", "unknown"],
        description: "What the lead wants to do",
      },
      timeline: {
        type: "string",
        enum: ["immediate", "1-3_months", "3-6_months", "6-12_months", "not_sure"],
        description: "When they plan to act",
      },
      budget_min: { type: "number", description: "Minimum budget in USD (buyers only)" },
      budget_max: { type: "number", description: "Maximum budget in USD (buyers only)" },
      pre_approved: { type: "boolean", description: "Whether the buyer is pre-approved for a mortgage" },
      objections: {
        type: "array",
        items: { type: "string" },
        description: "Objections raised (e.g. 'price', 'timing', 'not ready')",
      },
      appointment_description: { type: "string", description: "Description of the booked appointment if one was set" },
      follow_up_notes: { type: "string", description: "Notes for the follow-up if no appointment was set" },
    },
    required: ["outcome"],
  },
  successEvaluationRubric: "DescriptiveScale",
  successEvaluationPrompt: "Did the call result in a booked appointment or a qualified follow-up? Score as: perfect (appointment booked), good (interested, follow-up set), average (some interest, no commitment), poor (not interested or no connection).",
};

// ── Vapi API calls ─────────────────────────────────────────────────────────

/**
 * Initiate an outbound call via Vapi.
 */
export async function initiateVapiCall(params: {
  leadPhone: string;
  leadName: string;
  leadIntent: string;
  realtorName: string;
  realtorBusiness: string;
  callRecordId: string;   // our internal ID — passed back in webhooks
  webhookUrl: string;     // full URL to /api/calling/webhook
}): Promise<VapiCall> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey) throw new Error("VAPI_API_KEY is not configured");
  if (!phoneNumberId) throw new Error("VAPI_PHONE_NUMBER_ID is not configured");

  const body: VapiCallRequest = {
    phoneNumberId,
    customer: {
      number: normalizePhone(params.leadPhone),
      name: params.leadName || undefined,
    },
    assistant: {
      name: "LeadMine Qualifier",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        systemPrompt: buildSystemPrompt(params.realtorName, params.realtorBusiness),
        temperature: 0.4,
      },
      voice: {
        provider: "openai",
        voiceId: "shimmer",  // OpenAI TTS — warm, professional female
      },
      firstMessage: buildFirstMessage(params.leadName, params.leadIntent, params.realtorName),
      endCallPhrases: [
        "goodbye", "have a great day", "take care", "talk soon",
        "we'll be in touch", "looking forward to it",
      ],
      endCallMessage: "Have a wonderful day. We'll be in touch soon. Goodbye!",
      serverUrl: params.webhookUrl,
      analysisPlan: ANALYSIS_PLAN,
      maxDurationSeconds: 600, // 10-minute cap
    },
    metadata: {
      call_record_id: params.callRecordId,
    },
  };

  const res = await fetch(`${VAPI_BASE}/call`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Vapi API ${res.status}: ${text.slice(0, 300)}`);
  }

  return res.json() as Promise<VapiCall>;
}

/**
 * Fetch a call record from Vapi by call ID.
 */
export async function getVapiCall(vapiCallId: string): Promise<VapiCall> {
  const apiKey = process.env.VAPI_API_KEY;
  if (!apiKey) throw new Error("VAPI_API_KEY is not configured");

  const res = await fetch(`${VAPI_BASE}/call/${vapiCallId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) throw new Error(`Vapi get call ${res.status}`);
  return res.json() as Promise<VapiCall>;
}

// ── Utilities ──────────────────────────────────────────────────────────────

/**
 * Normalize a phone number to E.164 format.
 * Assumes US number if no country code.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length > 10 && !phone.startsWith("+")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${digits}`;
}

/**
 * Map Vapi outcome to our internal call outcome type.
 */
export function mapVapiOutcome(
  structured: VapiStructuredData | undefined,
  endedReason: string
): string {
  if (!structured?.outcome) {
    // Fall back to endedReason
    if (endedReason === "voicemail") return "voicemail";
    if (endedReason === "no-answer") return "no_answer";
    return "follow_up_needed";
  }
  const map: Record<string, string> = {
    appointment_set: "appointment_set",
    follow_up: "follow_up_needed",
    not_interested: "not_interested",
    voicemail: "voicemail",
    no_answer: "no_answer",
  };
  return map[structured.outcome] ?? "follow_up_needed";
}
