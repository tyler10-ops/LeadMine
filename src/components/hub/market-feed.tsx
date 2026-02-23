"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import type { MarketNews, NewsCategory } from "@/types";

const categoryStyles: Record<NewsCategory, { bg: string; text: string }> = {
  rates: { bg: "bg-blue-400/10", text: "text-blue-400" },
  inventory: { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  policy: { bg: "bg-purple-400/10", text: "text-purple-400" },
  local: { bg: "bg-amber-400/10", text: "text-amber-400" },
  economy: { bg: "bg-cyan-400/10", text: "text-cyan-400" },
  forecast: { bg: "bg-rose-400/10", text: "text-rose-400" },
};

interface MarketFeedProps {
  news: MarketNews[];
}

export function MarketFeed({ news }: MarketFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<NewsCategory | null>(null);

  const filtered = activeCategory
    ? news.filter((n) => n.category === activeCategory)
    : news;

  return (
    <div>
      {/* Category filters */}
      <div className="flex gap-1.5 mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
            !activeCategory
              ? "bg-neutral-800 text-neutral-200"
              : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
          )}
        >
          All
        </button>
        {(Object.keys(categoryStyles) as NewsCategory[]).map((cat) => {
          const style = categoryStyles[cat];
          return (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={cn(
                "px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
                activeCategory === cat
                  ? cn(style.bg, style.text)
                  : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* News feed */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-600 py-8 text-center">
            No market intelligence available
          </p>
        )}
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;
          const catStyle = categoryStyles[item.category];

          return (
            <div
              key={item.id}
              className="bg-[#111111] border border-neutral-800/50 rounded-xl overflow-hidden hover:border-neutral-700/50 transition-colors"
            >
              {/* Collapsed row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* Timestamp */}
                <span className="text-[10px] text-neutral-600 font-mono w-20 shrink-0">
                  {new Date(item.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                {/* Category tag */}
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded shrink-0",
                    catStyle.bg,
                    catStyle.text
                  )}
                >
                  {item.category}
                </span>

                {/* Title + summary */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm text-neutral-300 font-medium truncate">
                    {item.title}
                  </h4>
                </div>

                {/* Region */}
                <span className="text-[10px] text-neutral-600 uppercase tracking-wider shrink-0">
                  {item.region}
                </span>

                {/* Expand toggle */}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-neutral-600 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-600 shrink-0" />
                )}
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-neutral-800/30">
                  <p className="text-sm text-neutral-400 leading-relaxed mt-4">
                    {item.summary}
                  </p>

                  {item.ai_analysis && (
                    <div className="mt-4 bg-neutral-800/20 rounded-lg p-4">
                      <p className="text-[10px] text-neutral-600 uppercase tracking-wider mb-2">
                        AI Analysis — Why This Matters
                      </p>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {item.ai_analysis}
                      </p>
                    </div>
                  )}

                  {item.body && (
                    <div
                      className="mt-4 text-sm text-neutral-500 leading-relaxed [&_p]:mb-3"
                      dangerouslySetInnerHTML={{ __html: item.body }}
                    />
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-800/30">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-neutral-600 uppercase tracking-wider"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.source_url && (
                      <a
                        href={item.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {item.source || "Source"}{" "}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
