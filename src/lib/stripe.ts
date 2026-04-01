import Stripe from "stripe";

// Shared Stripe server-side instance. Import only from API routes / server code.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export type BillingInterval = "month" | "year";
export type PaidPlan = "miner" | "operator" | "brokerage";

/**
 * Returns the Stripe Price ID for a given plan + billing interval.
 * Price IDs are created in the Stripe Dashboard and stored as env vars.
 */
export function getStripePriceId(plan: PaidPlan, billingInterval: BillingInterval): string {
  const suffix = billingInterval === "month" ? "MONTHLY" : "ANNUAL";
  const key = `STRIPE_PRICE_${plan.toUpperCase()}_${suffix}`;
  const priceId = process.env[key];
  if (!priceId) {
    throw new Error(`Missing env var: ${key}. Create the price in Stripe Dashboard and set this variable.`);
  }
  return priceId;
}

/**
 * Reverse-maps a Stripe Price ID back to a plan name.
 * Used in the webhook handler to determine which plan a subscription event applies to.
 */
export function getPlanFromPriceId(priceId: string): PaidPlan | null {
  const map: Record<string, PaidPlan> = {
    [process.env.STRIPE_PRICE_MINER_MONTHLY    ?? ""]: "miner",
    [process.env.STRIPE_PRICE_MINER_ANNUAL     ?? ""]: "miner",
    [process.env.STRIPE_PRICE_OPERATOR_MONTHLY ?? ""]: "operator",
    [process.env.STRIPE_PRICE_OPERATOR_ANNUAL  ?? ""]: "operator",
    [process.env.STRIPE_PRICE_BROKERAGE_MONTHLY ?? ""]: "brokerage",
    [process.env.STRIPE_PRICE_BROKERAGE_ANNUAL  ?? ""]: "brokerage",
  };
  return map[priceId] ?? null;
}
