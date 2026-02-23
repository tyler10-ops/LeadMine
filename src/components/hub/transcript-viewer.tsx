"use client";

import { cn } from "@/lib/utils";
import type { TranscriptEntry, CallSentiment } from "@/types";

interface TranscriptViewerProps {
  transcript: TranscriptEntry[];
}

const sentimentDots: Record<CallSentiment, string> = {
  positive: "bg-emerald-400",
  neutral: "bg-neutral-500",
  negative: "bg-red-400",
  mixed: "bg-amber-400",
};

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TranscriptViewer({ transcript }: TranscriptViewerProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-neutral-600">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {transcript.map((entry, i) => {
        const isAI = entry.speaker === "ai";
        return (
          <div
            key={i}
            className={cn("flex", isAI ? "justify-start" : "justify-end")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-3.5 py-2.5 relative",
                isAI
                  ? "bg-neutral-800/60 text-neutral-300 rounded-bl-sm"
                  : "bg-blue-600/20 text-blue-200 rounded-br-sm"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-60">
                  {isAI ? "AI Agent" : "Lead"}
                </span>
                <span className="text-[10px] opacity-40">
                  {formatTimestamp(entry.timestamp_ms)}
                </span>
                {entry.sentiment && (
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      sentimentDots[entry.sentiment]
                    )}
                  />
                )}
              </div>
              <p className="text-sm leading-relaxed">{entry.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
