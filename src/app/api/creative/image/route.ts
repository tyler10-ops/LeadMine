import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const REPLICATE_API = "https://api.replicate.com/v1";
const MODEL = "black-forest-labs/flux-1.1-pro";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured" }, { status: 500 });

    const { prompt, aspectRatio = "16:9", style } = await request.json() as {
      prompt: string;
      aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3";
      style?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const fullPrompt = style
      ? `${prompt}, ${style}, highly detailed, professional photography, 8k`
      : `${prompt}, highly detailed, professional photography, 8k`;

    // Kick off prediction
    const createRes = await fetch(`${REPLICATE_API}/models/${MODEL}/predictions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait=60", // wait up to 60s synchronously
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          aspect_ratio: aspectRatio,
          output_format: "webp",
          output_quality: 90,
          safety_tolerance: 2,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Replicate error:", err);
      return NextResponse.json({ error: "Image generation failed" }, { status: 502 });
    }

    const prediction = await createRes.json();

    // If synchronous wait completed
    if (prediction.status === "succeeded" && prediction.output) {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return NextResponse.json({ imageUrl, predictionId: prediction.id });
    }

    // Still processing — poll up to 60s more
    if (prediction.id && prediction.status !== "failed") {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`${REPLICATE_API}/predictions/${prediction.id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const polled = await pollRes.json();
        if (polled.status === "succeeded" && polled.output) {
          const imageUrl = Array.isArray(polled.output) ? polled.output[0] : polled.output;
          return NextResponse.json({ imageUrl, predictionId: polled.id });
        }
        if (polled.status === "failed") break;
      }
    }

    return NextResponse.json({ error: "Image generation timed out" }, { status: 504 });
  } catch (err) {
    console.error("Creative image error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}