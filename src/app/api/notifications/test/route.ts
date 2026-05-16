import { NextResponse } from "next/server";
import webpush from "web-push";
import { createServerSupabase, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const auth = await createServerSupabase();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
      return NextResponse.json({
        error: "VAPID keys not configured in this environment",
      }, { status: 500 });
    }
    webpush.setVapidDetails(
      `mailto:${process.env.NOTIFICATION_FROM_EMAIL ?? "briefs@leadmineapp.com"}`,
      pub, priv
    );

    const supabase = createServiceClient();
    const { data: realtor } = await supabase
      .from("realtors").select("id").eq("user_id", user.id).single();
    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("realtor_id", realtor.id);

    if (!subs || subs.length === 0) {
      return NextResponse.json({
        error: "No push subscription found. Enable notifications first.",
      }, { status: 400 });
    }

    const payload = JSON.stringify({
      title: "LeadMine — Test Notification",
      body:  "Push notifications are working. You're all set.",
      icon:  "/icon-192.png",
      badge: "/badge-72.png",
      url:   "/dashboard/hub",
      data:  { url: "/dashboard/hub", test: true },
    });

    const results = await Promise.allSettled(subs.map((s: { endpoint: string; p256dh: string; auth: string }) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 60 }
      )
    ));

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return NextResponse.json({ sent, failed, total: results.length });
  } catch (err) {
    console.error("[notifications/test] Error:", err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Internal error",
    }, { status: 500 });
  }
}