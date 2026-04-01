import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// POST — save or remove a push subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      action: "subscribe" | "unsubscribe";
      subscription?: { endpoint: string; keys: { p256dh: string; auth: string } };
      userAgent?: string;
    };

    const { data: realtor } = await supabase
      .from("realtors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    if (body.action === "subscribe" && body.subscription) {
      await supabase
        .from("push_subscriptions")
        .upsert({
          realtor_id: realtor.id,
          endpoint:   body.subscription.endpoint,
          p256dh:     body.subscription.keys.p256dh,
          auth:       body.subscription.keys.auth,
          user_agent: body.userAgent ?? null,
        }, { onConflict: "realtor_id,endpoint" });

      // Auto-enable push in prefs
      await supabase
        .from("notification_preferences")
        .upsert({ realtor_id: realtor.id, push_enabled: true }, { onConflict: "realtor_id" });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "unsubscribe" && body.subscription) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("realtor_id", realtor.id)
        .eq("endpoint", body.subscription.endpoint);

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
