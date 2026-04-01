import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client record not found" }, { status: 404 });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("client_id", client.id)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
      customer:   sub.stripe_customer_id,
      return_url: `${origin}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/portal] Error:", err);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}
