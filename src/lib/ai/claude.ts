import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function chatCompletion(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }
  return "I apologize, but I was unable to generate a response.";
}

export async function classifyIntent(
  conversationText: string,
  systemPrompt: string
): Promise<{ intent: string; score: number; summary: string }> {
  const response = await chatCompletion(systemPrompt, [
    { role: "user", content: conversationText },
  ]);

  try {
    return JSON.parse(response);
  } catch {
    return { intent: "unknown", score: 0, summary: "Unable to classify" };
  }
}

export async function generateContent(
  prompt: string
): Promise<{ title: string; body: string }> {
  const response = await chatCompletion(
    "You are a professional real estate content writer.",
    [{ role: "user", content: prompt }]
  );

  try {
    return JSON.parse(response);
  } catch {
    return { title: "Market Update", body: `<p>${response}</p>` };
  }
}

export async function generateMarketPulse(prompt: string): Promise<string> {
  return chatCompletion(
    "You are a professional real estate market analyst.",
    [{ role: "user", content: prompt }]
  );
}

export async function summarizeConversation(
  systemPrompt: string,
  conversationText: string
): Promise<string> {
  return chatCompletion(systemPrompt, [
    { role: "user", content: conversationText },
  ]);
}
