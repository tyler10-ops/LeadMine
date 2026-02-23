import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { realtorId, type, metadata } = await request.json();

    if (!realtorId || !type) {
      return NextResponse.json(
        { error: "realtorId and type are required" },
        { status: 400 }
      );
    }

    const validTypes = ["page_view", "chat_start", "lead_capture", "content_view"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    await supabase.from("events").insert({
      realtor_id: realtorId,
      type,
      metadata: metadata || {},
    });

    // Upsert daily metrics
    const today = new Date().toISOString().split("T")[0];
    const incrementField =
      type === "page_view"
        ? "page_views"
        : type === "chat_start"
        ? "chat_starts"
        : type === "lead_capture"
        ? "leads_captured"
        : null;

    if (incrementField) {
      // Try to increment existing row
      const { data: existing } = await supabase
        .from("daily_metrics")
        .select("id, " + incrementField)
        .eq("realtor_id", realtorId)
        .eq("date", today)
        .single();

      if (existing) {
        await supabase
          .from("daily_metrics")
          .update({
            [incrementField]: (existing[incrementField as keyof typeof existing] as number) + 1,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("daily_metrics").insert({
          realtor_id: realtorId,
          date: today,
          [incrementField]: 1,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
