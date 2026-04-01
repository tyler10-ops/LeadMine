import Link from "next/link";

interface UpgradePromptProps {
  feature: string;
  requiredPlan: "Miner" | "Operator" | "Brokerage";
  description?: string;
}

const PLAN_PRICE: Record<string, string> = {
  Miner:     "$97/mo",
  Operator:  "$247/mo",
  Brokerage: "$697/mo",
};

export function UpgradePrompt({ feature, requiredPlan, description }: UpgradePromptProps) {
  const price = PLAN_PRICE[requiredPlan] ?? "";

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      {/* Lock icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style={{
          background: "rgba(0,255,136,0.06)",
          border: "1px solid rgba(0,255,136,0.15)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="#00FF88" strokeWidth="1.5" />
          <path
            d="M7 11V7a5 5 0 0110 0v4"
            stroke="#00FF88"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16" r="1.5" fill="#00FF88" />
        </svg>
      </div>

      {/* Text */}
      <p
        className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
        style={{ color: "rgba(0,255,136,0.5)" }}
      >
        {requiredPlan} Plan Required
      </p>
      <h3 className="text-lg font-black text-neutral-100 mb-2 tracking-tight">
        {feature} is locked
      </h3>
      <p className="text-sm text-neutral-600 max-w-xs leading-relaxed mb-6">
        {description ?? `Upgrade to ${requiredPlan} (${price}) to access ${feature} and start mining at scale.`}
      </p>

      {/* CTA */}
      <Link
        href="/#pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90"
        style={{
          background: "#00FF88",
          boxShadow: "0 0 20px rgba(0,255,136,0.2)",
        }}
      >
        Upgrade to {requiredPlan}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M5 12h14M13 6l6 6-6 6" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}
