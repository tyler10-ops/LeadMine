"use client";

import { useEffect, useState } from "react";
import { AssetCard } from "@/components/hub/asset-card";
import { Loader2 } from "lucide-react";
import type { AIAsset, AssetType } from "@/types";

const ASSET_TYPES: { value: AssetType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "voice", label: "Voice" },
  { value: "sms", label: "SMS" },
  { value: "email", label: "Email" },
  { value: "social", label: "Social" },
  { value: "listing", label: "Listing" },
  { value: "booking", label: "Booking" },
];

export default function AssetsPage() {
  const [assets, setAssets] = useState<AIAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((data) => {
        setAssets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered =
    filter === "all" ? assets : assets.filter((a) => a.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          AI Assets
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          {assets.length} systems deployed
        </p>
      </div>

      {/* Type filters */}
      <div className="flex gap-1.5">
        {ASSET_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-md transition-colors ${
              filter === t.value
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-neutral-800/30"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-12 text-center">
          <p className="text-sm text-neutral-600">
            {assets.length === 0
              ? "No AI assets have been configured."
              : "No assets match this filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}
    </div>
  );
}
