import Link from "next/link";
import { stripe } from "@/lib/stripe";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

const PLAN_DISPLAY: Record<string, string> = {
  miner:     "Miner",
  operator:  "Operator",
  brokerage: "Brokerage",
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  let planName = "your plan";
  let trialEnd: string | null = null;

  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });
      const rawPlan = session.metadata?.plan;
      if (rawPlan) planName = PLAN_DISPLAY[rawPlan] ?? rawPlan;

      const sub = session.subscription as import("stripe").Stripe.Subscription | null;
      if (sub?.trial_end) {
        trialEnd = new Date(sub.trial_end * 1000).toLocaleDateString("en-US", {
          month: "long", day: "numeric", year: "numeric",
        });
      }
    } catch {
      // Non-critical — render generic success message
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#07070d" }}
    >
      <div className="max-w-sm w-full text-center">
        {/* Success icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.2)",
            boxShadow: "0 0 40px rgba(0,255,136,0.08)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="#00FF88"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-black text-neutral-100 mb-2 tracking-tight">
          Welcome to {planName}
        </h1>

        {/* Trial info */}
        {trialEnd ? (
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            Your 14-day trial is active.{" "}
            <span className="text-neutral-300">No charge until {trialEnd}.</span>
            {" "}Cancel anytime before that — no questions asked.
          </p>
        ) : (
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            Your subscription is active. Start mining leads right away.
          </p>
        )}

        {/* CTA */}
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
          style={{
            background: "#00FF88",
            boxShadow: "0 0 24px rgba(0,255,136,0.25)",
          }}
        >
          Go to Dashboard
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        <p className="mt-4 text-[11px] text-neutral-700">
          Questions? Reply to your confirmation email.
        </p>
      </div>
    </div>
  );
}
