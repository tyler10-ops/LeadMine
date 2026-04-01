import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import LumaAI from "lumaai";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.LUMAAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "LUMAAI_API_KEY not configured" }, { status: 500 });
    }

    const client = new LumaAI({ authToken: apiKey });

    const { imageUrl, prompt, loop = false } = await request.json() as {
      imageUrl: string;
      prompt?: string;
      loop?: boolean;
    };

    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    // Kick off generation — image as first keyframe
    const generation = await client.generations.create({
      model: "ray-2",
      prompt: prompt ?? "Smooth cinematic camera motion, subtle movement, professional real estate feel",
      loop,
      keyframes: {
        frame0: {
          type: "image",
          url: imageUrl,
        },
      },
    });

    const generationId = generation.id;

    // Poll until complete (up to ~3 min)
    let result = generation;
    for (let i = 0; i < 60; i++) {
      if (result.state === "completed") break;
      if (result.state === "failed") {
        return NextResponse.json(
          { error: result.failure_reason ?? "Luma generation failed" },
          { status: 502 }
        );
      }
      await new Promise((r) => setTimeout(r, 3000));
      result = await client.generations.get(generationId!);
    }

    if (result.state !== "completed" || !result.assets?.video) {
      return NextResponse.json({ error: "Animation timed out" }, { status: 504 });
    }

    return NextResponse.json({
      videoUrl: result.assets.video,
      generationId: result.id,
    });
  } catch (err) {
    console.error("Luma animate error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
