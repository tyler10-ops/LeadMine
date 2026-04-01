import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, getStripePriceId } from "@/lib/stripe";
import type { PaidPlan, BillingInterval } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as { plan: PaidPlan; billingInterval: BillingInterval };
    const { plan, billingInterval } = body;

    if (!plan || !billingInterval) {
      return NextResponse.json({ error: "plan and billingInterval are required" }, { status: 400 });
    }

    if (!["miner", "operator", "brokerage"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Fetch client record
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, business_name")
      .eq("user_id", user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client record not found. Please complete onboarding first." }, { status: 404 });
    }

    // Check for existing Stripe customer to avoid duplicates
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("client_id", client.id)
      .maybeSingle();

    let customerId: string;

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  client.business_name,
        metadata: {
          client_id: client.id,
          user_id:   user.id,
        },
      });
      customerId = customer.id;
    }

    const priceId = getStripePriceId(plan, billingInterval);
    const origin  = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      customer:              customerId,
      mode:                  "subscription",
      payment_method_types:  ["card"],
      line_items:            [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          client_id:        client.id,
          user_id:          user.id,
          plan,
          billing_interval: billingInterval,
        },
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/checkout/cancel`,
      metadata: {
        client_id:        client.id,
        user_id:          user.id,
        plan,
        billing_interval: billingInterval,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
