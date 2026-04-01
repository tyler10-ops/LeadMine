import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import type Stripe from "stripe";

// Must be dynamic — no caching or static optimization on webhook routes
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // CRITICAL: Use request.text() — NOT request.json() — to get the raw body
  // Stripe signature verification requires the exact raw bytes before any parsing.
  const rawBody  = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Service client bypasses RLS — webhooks have no user session
  const supabase = createServiceClient();

  try {
    switch (event.type) {

      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          supabase
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
          supabase
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
          supabase
        );
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(
          event.data.object as Stripe.Invoice,
          supabase
        );
        break;

      case "invoice.payment_succeeded":
        // Subscription renewed — subscription.updated fires too, so this is
        // just logged for audit purposes. No additional DB action needed.
        console.log("[webhook] invoice.payment_succeeded received");
        break;

      default:
        // Acknowledge unhandled events — never return 4xx or Stripe stops sending
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[webhook] Error handling ${event.type}:`, err);
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ── Event handlers ─────────────────────────────────────────────────────────────

type SupabaseServiceClient = ReturnType<typeof createServiceClient>;

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: SupabaseServiceClient
) {
  const clientId       = session.metadata?.client_id;
  const plan           = session.metadata?.plan as "miner" | "operator" | "brokerage";
  const billingInterval = session.metadata?.billing_interval as "month" | "year";
  const customerId     = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!clientId || !plan) {
    console.error("[webhook] checkout.session.completed: missing metadata", session.metadata);
    return;
  }

  // Upsert so retried webhook events are idempotent
  await supabase.from("subscriptions").upsert(
    {
      client_id:              clientId,
      stripe_customer_id:     customerId,
      stripe_subscription_id: subscriptionId,
      plan,
      billing_interval:       billingInterval ?? null,
      status:                 "trialing",
    },
    { onConflict: "client_id" }
  );

  await supabase
    .from("clients")
    .update({ plan })
    .eq("id", clientId);
}

async function handleSubscriptionUpdated(
  sub: Stripe.Subscription,
  supabase: SupabaseServiceClient
) {
  const clientId = sub.metadata?.client_id;
  if (!clientId) {
    console.warn("[webhook] customer.subscription.updated: missing client_id in metadata");
    return;
  }

  const priceId = sub.items.data[0]?.price?.id;
  const plan    = priceId ? getPlanFromPriceId(priceId) : null;

  const updatePayload: Record<string, unknown> = {
    stripe_subscription_id: sub.id,
    status:                 sub.status,
    cancel_at_period_end:   sub.cancel_at_period_end,
    trial_end:              sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null,
  };

  if (plan)    { updatePayload.plan = plan; }
  if (priceId) { updatePayload.stripe_price_id = priceId; }

  await supabase
    .from("subscriptions")
    .update(updatePayload)
    .eq("client_id", clientId);

  // Sync clients.plan when subscription becomes active (e.g. trial converts to paid)
  if (plan && (sub.status === "active" || sub.status === "trialing")) {
    await supabase
      .from("clients")
      .update({ plan })
      .eq("id", clientId);
  }
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
  supabase: SupabaseServiceClient
) {
  const clientId = sub.metadata?.client_id;
  if (!clientId) {
    console.warn("[webhook] customer.subscription.deleted: missing client_id in metadata");
    return;
  }

  await supabase
    .from("subscriptions")
    .update({ status: "canceled", plan: "free" })
    .eq("client_id", clientId);

  // Downgrade to free immediately on cancellation
  await supabase
    .from("clients")
    .update({ plan: "free" })
    .eq("id", clientId);
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: SupabaseServiceClient
) {
  const customerId = invoice.customer as string;

  // Look up client via customer ID (metadata not available on invoice)
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("client_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!sub?.client_id) {
    console.warn("[webhook] invoice.payment_failed: no subscription found for customer", customerId);
    return;
  }

  // Mark past_due — do NOT revoke access yet. Stripe will retry.
  // Access is only revoked when customer.subscription.deleted fires.
  await supabase
    .from("subscriptions")
    .update({ status: "past_due" })
    .eq("client_id", sub.client_id);
}
