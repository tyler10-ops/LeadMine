import { cn } from "@/lib/utils";
import type { CallSentiment } from "@/types";

const sentimentConfig: Record<CallSentiment, { label: string; bg: string; text: string }> = {
  positive: { label: "Positive", bg: "bg-emerald-500/15", text: "text-emerald-400" },
  neutral: { label: "Neutral", bg: "bg-neutral-500/15", text: "text-neutral-400" },
  negative: { label: "Negative", bg: "bg-red-500/15", text: "text-red-400" },
  mixed: { label: "Mixed", bg: "bg-amber-500/15", text: "text-amber-400" },
};

interface SentimentBadgeProps {
  sentiment: CallSentiment;
  className?: string;
}

export function SentimentBadge({ sentiment, className }: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
        config.bg,
        config.text,
        className
      )}
    >
      {config.label}
    </span>
  );
}
