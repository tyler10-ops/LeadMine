"use client";

import { cn } from "@/lib/utils";
import { Search, Filter, TrendingUp, TrendingDown, Zap } from "lucide-react";
import type { SignalCategory, SignalDirection, SignalGeography } from "@/types";

const categories: { value: SignalCategory; label: string; color: string }[] = [
  { value: "rates", label: "Rates", color: "text-blue-400 bg-blue-400/10" },
  { value: "inventory", label: "Inventory", color: "text-emerald-400 bg-emerald-400/10" },
  { value: "demand", label: "Demand", color: "text-amber-400 bg-amber-400/10" },
  { value: "policy", label: "Policy", color: "text-purple-400 bg-purple-400/10" },
  { value: "local_market", label: "Local", color: "text-cyan-400 bg-cyan-400/10" },
  { value: "macro", label: "Macro", color: "text-rose-400 bg-rose-400/10" },
];

interface SignalFiltersProps {
  activeCategory: SignalCategory | null;
  setActiveCategory: (cat: SignalCategory | null) => void;
  activeDirection: SignalDirection | null;
  setActiveDirection: (dir: SignalDirection | null) => void;
  activeGeography: SignalGeography | null;
  setActiveGeography: (geo: SignalGeography | null) => void;
  highImpactOnly: boolean;
  setHighImpactOnly: (v: boolean) => void;
  search: string;
  setSearch: (v: string) => void;
}

export function SignalFilters({
  activeCategory,
  setActiveCategory,
  activeDirection,
  setActiveDirection,
  activeGeography,
  setActiveGeography,
  highImpactOnly,
  setHighImpactOnly,
  search,
  setSearch,
}: SignalFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search signals..."
          className="w-full bg-[#111111] border border-neutral-800/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-neutral-300 placeholder:text-neutral-700 focus:outline-none focus:border-neutral-700/70 transition-colors"
        />
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5 text-neutral-600" />
          <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
            Filters
          </span>
        </div>

        {/* Category pills */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
              !activeCategory
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() =>
                setActiveCategory(activeCategory === cat.value ? null : cat.value)
              }
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
                activeCategory === cat.value
                  ? cat.color
                  : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-800" />

        {/* Direction filters */}
        <div className="flex gap-1">
          <button
            onClick={() =>
              setActiveDirection(activeDirection === "bullish" ? null : "bullish")
            }
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
              activeDirection === "bullish"
                ? "bg-emerald-400/10 text-emerald-400"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
            )}
          >
            <TrendingUp className="w-3 h-3" /> Bull
          </button>
          <button
            onClick={() =>
              setActiveDirection(activeDirection === "bearish" ? null : "bearish")
            }
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
              activeDirection === "bearish"
                ? "bg-red-400/10 text-red-400"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
            )}
          >
            <TrendingDown className="w-3 h-3" /> Bear
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-800" />

        {/* Geography filter */}
        <div className="flex gap-1">
          {(["national", "state", "local"] as SignalGeography[]).map((geo) => (
            <button
              key={geo}
              onClick={() =>
                setActiveGeography(activeGeography === geo ? null : geo)
              }
              className={cn(
                "px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
                activeGeography === geo
                  ? "bg-neutral-800 text-neutral-200"
                  : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
              )}
            >
              {geo}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-800" />

        {/* High impact toggle */}
        <button
          onClick={() => setHighImpactOnly(!highImpactOnly)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors",
            highImpactOnly
              ? "bg-amber-400/10 text-amber-400"
              : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
          )}
        >
          <Zap className="w-3 h-3" /> High Impact
        </button>
      </div>
    </div>
  );
}
