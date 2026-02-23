export function chatSystemPrompt(realtorName: string, city: string): string {
  return `You are an AI real estate assistant for ${realtorName}, a trusted realtor in ${city}.

ROLE:
- Help potential buyers and sellers with questions about real estate in ${city}
- Provide helpful, professional, neutral market information
- Never give specific financial advice or guarantees
- Never fabricate specific property listings or prices

TONE:
- Professional and warm
- Knowledgeable but not pushy
- Concise — keep responses under 150 words
- Use plain language, avoid jargon

BEHAVIOR:
- Answer questions about neighborhoods, market trends, buying/selling process
- If asked about specific listings, explain that ${realtorName} can provide personalized options
- Never disparage other agents or companies
- Stay compliant with fair housing laws — never steer based on protected classes

IMPORTANT: You are representing ${realtorName}. Be helpful, build trust, and position ${realtorName} as the go-to expert in ${city}.`;
}

export function classifyIntentPrompt(): string {
  return `Analyze the following conversation and classify the user's intent.

Return ONLY a JSON object with these fields:
{
  "intent": "buyer" | "seller" | "investor" | "unknown",
  "score": 0-100,
  "summary": "one sentence summary of what the user is looking for"
}

Intent definitions:
- buyer: Looking to purchase a home or property
- seller: Looking to sell their current property
- investor: Looking for investment properties or rental opportunities
- unknown: General questions or unclear intent

Score guidelines:
- 80-100: Clear, strong intent with specific details (timeline, budget, location)
- 50-79: Moderate intent, asking relevant questions but no specifics
- 20-49: Mild interest, exploratory questions
- 0-19: Very unclear or off-topic

Return ONLY valid JSON, no other text.`;
}

export function marketPulsePrompt(city: string, state: string | null): string {
  const location = state ? `${city}, ${state}` : city;
  return `Write a professional "Local Market Pulse" summary for ${location}.

REQUIREMENTS:
- 3-4 short paragraphs
- Cover: current market conditions, buyer/seller dynamics, what to watch
- Professional, neutral tone — like a Bloomberg brief
- Do NOT include specific numbers or statistics (these change constantly)
- Focus on trends, dynamics, and actionable insights
- Include a brief mention of seasonality if relevant
- End with a forward-looking statement

FORMAT: Return clean HTML with <p> tags only. No headings, no lists, no bold.`;
}

export function contentGenerationPrompt(
  type: "market_pulse" | "buyer_tip" | "seller_warning",
  city: string,
  state: string | null
): string {
  const location = state ? `${city}, ${state}` : city;

  const typeInstructions = {
    market_pulse: `Write a weekly market recap for ${location}. Cover current conditions, notable trends, and outlook. 3-4 paragraphs.`,
    buyer_tip: `Write a practical tip for home buyers in ${location}. Focus on one specific, actionable insight. 2-3 paragraphs.`,
    seller_warning: `Write a timely alert for home sellers in ${location}. Highlight something sellers should be aware of right now. 2-3 paragraphs.`,
  };

  return `${typeInstructions[type]}

RULES:
- Professional, neutral tone
- No specific numbers or statistics
- Compliant with fair housing guidelines
- No fear-mongering or hype
- Actionable and useful

Return a JSON object:
{
  "title": "compelling but professional title",
  "body": "the content in clean HTML with <p> tags"
}

Return ONLY valid JSON.`;
}

export function summarizeConversationPrompt(): string {
  return `Summarize this real estate conversation in one concise sentence.
Focus on: what the user is looking for, their timeline, budget range if mentioned, and location preferences.
Return ONLY the summary sentence, nothing else.`;
}
