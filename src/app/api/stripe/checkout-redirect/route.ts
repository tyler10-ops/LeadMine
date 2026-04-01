import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stripe, getStripePriceId } from "@/lib/stripe";
import type { PaidPlan, BillingInterval } from "@/lib/stripe";

/**
 * GET handler used after Google OAuth when plan intent is encoded in the
 * auth callback's `next=` param.
 *
 * Flow:
 *   1. User clicks paid plan CTA (not logged in, uses Google OAuth)
 *   2. signInWithOAuth redirectTo includes: ?next=/api/stripe/checkout-redirect?plan=miner&billing=month
 *   3. After auth, callback redirects here
 *   4. We create a Stripe session and redirect to it
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const plan           = searchParams.get("plan") as PaidPlan | null;
  const billingInterval = (searchParams.get("billing") ?? "month") as BillingInterval;

  if (!plan || plan === ("free" as string)) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`);
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id, business_name")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    // Client record not yet created — send to onboarding with plan preserved
    return NextResponse.redirect(
      `${origin}/onboarding?plan=${plan}&billing=${billingInterval}`
    );
  }

  // Check for existing customer
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
      metadata: { client_id: client.id, user_id: user.id },
    });
    customerId = customer.id;
  }

  const priceId = getStripePriceId(plan, billingInterval);

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "subscription",
    payment_method_types: ["card"],
    line_items:           [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        client_id: client.id, user_id: user.id,
        plan, billing_interval: billingInterval,
      },
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/checkout/cancel`,
    metadata: {
      client_id: client.id, user_id: user.id,
      plan, billing_interval: billingInterval,
    },
  });

  return NextResponse.redirect(session.url!);
}
