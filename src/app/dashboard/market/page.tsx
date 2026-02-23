"use client";

import { useEffect, useState, useCallback } from "react";
import { SignalCard } from "@/components/hub/signal-card";
import { SignalTicker } from "@/components/hub/signal-ticker";
import { SignalStats } from "@/components/hub/signal-stats";
import { SignalFilters } from "@/components/hub/signal-filters";
import { Loader2, Radio } from "lucide-react";
import type {
  MarketSignal,
  SignalCategory,
  SignalDirection,
  SignalGeography,
} from "@/types";

export default function MarketIntelPage() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [activeCategory, setActiveCategory] = useState<SignalCategory | null>(null);
  const [activeDirection, setActiveDirection] = useState<SignalDirection | null>(null);
  const [activeGeography, setActiveGeography] = useState<SignalGeography | null>(null);
  const [highImpactOnly, setHighImpactOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchSignals = useCallback(
    async (reset = false) => {
      const currentOffset = reset ? 0 : offset;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams();
      if (activeCategory) params.set("category", activeCategory);
      if (activeDirection) params.set("direction", activeDirection);
      if (activeGeography) params.set("geography", activeGeography);
      if (highImpactOnly) params.set("highImpactOnly", "true");
      if (search) params.set("search", search);
      params.set("limit", limit.toString());
      params.set("offset", currentOffset.toString());

      try {
        const res = await fetch(`/api/signals?${params}`);
        const data = await res.json();

        if (reset) {
          setSignals(data.signals || []);
        } else {
          setSignals((prev) => [...prev, ...(data.signals || [])]);
        }
        setTotal(data.total || 0);
        setOffset(currentOffset + limit);
      } catch {
        // silent
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeCategory, activeDirection, activeGeography, highImpactOnly, search, offset]
  );

  // Fetch on filter change
  useEffect(() => {
    setOffset(0);
    fetchSignals(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeDirection, activeGeography, highImpactOnly, search]);

  // Track signal interaction
  const handleInteraction = async (signalId: string, type: string) => {
    try {
      await fetch("/api/signals/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal_id: signalId, interaction_type: type }),
      });
    } catch {
      // silent
    }
  };

  // High-impact signals for ticker
  const tickerSignals = signals.filter((s) => s.is_high_impact).slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
              Market Intelligence
            </h1>
          </div>
          <p className="text-sm text-neutral-600 mt-1">
            Real-time market signals with AI-powered analysis and actionable recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[11px] text-neutral-600">Live</span>
        </div>
      </div>

      {/* Ticker */}
      {tickerSignals.length > 0 && <SignalTicker signals={tickerSignals} />}

      {/* Stats bar */}
      <SignalStats signals={signals} total={total} />

      {/* Filters */}
      <SignalFilters
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeDirection={activeDirection}
        setActiveDirection={setActiveDirection}
        activeGeography={activeGeography}
        setActiveGeography={setActiveGeography}
        highImpactOnly={highImpactOnly}
        setHighImpactOnly={setHighImpactOnly}
        search={search}
        setSearch={setSearch}
      />

      {/* Signal feed */}
      <div className="space-y-2">
        {signals.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-neutral-600">
              No signals match your filters
            </p>
            <p className="text-xs text-neutral-700 mt-1">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
        {signals.map((signal) => (
          <SignalCard
            key={signal.id}
            signal={signal}
            onInteraction={handleInteraction}
          />
        ))}
      </div>

      {/* Load more */}
      {signals.length < total && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchSignals(false)}
            disabled={loadingMore}
            className="px-6 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-xl text-sm text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `Load more (${signals.length} of ${total})`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
