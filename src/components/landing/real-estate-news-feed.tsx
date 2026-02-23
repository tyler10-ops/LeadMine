"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchRealEstateNews } from "@/lib/news/service";
import { ExternalLink, Loader2, Newspaper } from "lucide-react";
import type { NewsArticle, NewsArticleCategory } from "@/types";

const categoryLabels: Record<NewsArticleCategory, string> = {
  housing_market: "Housing Market",
  mortgage_rates: "Mortgage Rates",
  inventory: "Inventory",
  policy: "Policy",
  buyer_seller_trends: "Trends",
};

const categoryColors: Record<NewsArticleCategory, { bg: string; text: string }> = {
  housing_market: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300" },
  mortgage_rates: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300" },
  inventory: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300" },
  policy: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300" },
  buyer_seller_trends: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300" },
};

function formatPublishDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function RealEstateNewsFeed() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealEstateNews()
      .then(setArticles)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Newspaper className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No real estate news available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {articles.map((article) => {
        const colors = categoryColors[article.category];

        return (
          <a
            key={article.id}
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md transition-all duration-200"
          >
            {/* Category + date row */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded",
                  colors.bg,
                  colors.text
                )}
              >
                {categoryLabels[article.category]}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {formatPublishDate(article.publishedAt)}
              </span>
            </div>

            {/* Headline */}
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug mb-2 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
              {article.headline}
            </h3>

            {/* Summary */}
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed flex-1">
              {article.summary}
            </p>

            {/* Source footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <span className="text-[11px] font-medium text-neutral-400">
                {article.source}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors" />
            </div>
          </a>
        );
      })}
    </div>
  );
}
