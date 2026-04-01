import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#07070d" }}
    >
      <div className="max-w-sm w-full text-center">
        {/* Icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-neutral-100 mb-2 tracking-tight">
          Checkout canceled
        </h1>
        <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
          No charge was made. Your account is still active on the free plan.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/#pricing"
            className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "#00FF88", color: "#000" }}
          >
            View Pricing
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            Continue with Free Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
