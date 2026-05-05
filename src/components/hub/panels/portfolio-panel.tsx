"use client";

import { useState } from "react";
import { Home, DollarSign, Clock, Plus, ExternalLink, Loader2, ChevronRight, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GEM, CAVE } from "@/lib/cave-theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type ListingStatus = "active" | "under_contract" | "pending" | "sold" | "expired";

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: ListingStatus;
  days_on_market: number;
  list_date: string;
  mls_number: string | null;
  notes: string | null;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ListingStatus, { label: string; color: string }> = {
  active:          { label: "Active",           color: GEM.green  },
  under_contract:  { label: "Under Contract",   color: GEM.yellow },
  pending:         { label: "Pending",          color: "#60a5fa"  },
  sold:            { label: "Sold",             color: "#a855f7"  },
  expired:         { label: "Expired",          color: "#6b7280"  },
};

const STATUS_FILTERS: { value: "" | ListingStatus; label: string }[] = [
  { value: "",               label: "All"            },
  { value: "active",         label: "Active"         },
  { value: "under_contract", label: "Under Contract" },
  { value: "pending",        label: "Pending"        },
  { value: "sold",           label: "Sold"           },
];

// ── Mock listings ─────────────────────────────────────────────────────────────
// Replace with real API data once listings table is set up

const MOCK_LISTINGS: Listing[] = [
  {
    id: "1",
    address: "4821 Westbrook Dr",
    city: "Sacramento",
    state: "CA",
    zip: "95835",
    price: 589000,
    beds: 4,
    baths: 3,
    sqft: 2240,
    status: "active",
    days_on_market: 12,
    list_date: "2026-04-22",
    mls_number: "ML-2024-4821",
    notes: null,
  },
  {
    id: "2",
    address: "1093 Creekside Ln",
    city: "Elk Grove",
    state: "CA",
    zip: "95757",
    price: 475000,
    beds: 3,
    baths: 2,
    sqft: 1820,
    status: "under_contract",
    days_on_market: 28,
    list_date: "2026-04-06",
    mls_number: "ML-2024-1093",
    notes: "Offer accepted — closing Jun 1",
  },
  {
    id: "3",
    address: "730 Sycamore Ave",
    city: "Roseville",
    state: "CA",
    zip: "95678",
    price: 710000,
    beds: 5,
    baths: 3,
    sqft: 3100,
    status: "active",
    days_on_market: 5,
    list_date: "2026-04-29",
    mls_number: "ML-2024-0730",
    notes: null,
  },
  {
    id: "4",
    address: "2255 Harbor View Ct",
    city: "Folsom",
    state: "CA",
    zip: "95630",
    price: 865000,
    beds: 4,
    baths: 3.5,
    sqft: 3480,
    status: "pending",
    days_on_market: 19,
    list_date: "2026-04-15",
    mls_number: "ML-2024-2255",
    notes: null,
  },
  {
    id: "5",
    address: "318 Maple Ridge Rd",
    city: "Lincoln",
    state: "CA",
    zip: "95648",
    price: 399000,
    beds: 3,
    baths: 2,
    sqft: 1540,
    status: "sold",
    days_on_market: 7,
    list_date: "2026-03-18",
    mls_number: "ML-2024-0318",
    notes: "Closed $12k over ask",
  },
];

// ── Street View thumbnail ─────────────────────────────────────────────────────

function PropertyThumb({ address }: { address: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  const encoded = encodeURIComponent(address);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: CAVE.stoneDeep }}>
        <Home className="w-6 h-6 text-neutral-700" />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: CAVE.stoneDeep }}>
          <Loader2 className="w-4 h-4 animate-spin text-neutral-700" />
        </div>
      )}
      <img
        src={`/api/property/streetview?address=${encoded}&heading=0&fov=90&size=480x200`}
        alt={address}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.3s ease" }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────

function ListingCard({ listing }: { listing: Listing }) {
  const cfg       = STATUS_CFG[listing.status];
  const fullAddr  = `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`;
  const priceStr  = listing.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const sqftStr   = listing.sqft ? listing.sqft.toLocaleString() : null;
  const domColor  = listing.days_on_market <= 7 ? GEM.green : listing.days_on_market <= 21 ? GEM.yellow : "#6b7280";

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
      style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}
    >
      {/* Photo */}
      <div className="relative w-full overflow-hidden" style={{ height: 160, background: CAVE.stoneDeep }}>
        <PropertyThumb address={fullAddr} />
        {/* Status badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ color: cfg.color, background: "rgba(0,0,0,0.75)", border: `1px solid ${cfg.color}40` }}
          >
            {cfg.label}
          </span>
        </div>
        {/* DOM overlay */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ color: domColor, background: "rgba(0,0,0,0.75)", border: `1px solid ${domColor}40` }}
          >
            <Clock className="w-2.5 h-2.5" />{listing.days_on_market}d
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2">
        {/* Price */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold text-neutral-100 leading-tight">{priceStr}</p>
          {listing.mls_number && (
            <span className="text-[9px] text-neutral-600 font-mono mt-0.5 flex-shrink-0">{listing.mls_number}</span>
          )}
        </div>

        {/* Address */}
        <div>
          <p className="text-[12px] font-medium text-neutral-200 leading-tight">{listing.address}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">{listing.city}, {listing.state} {listing.zip}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1">
          {listing.beds != null && (
            <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{listing.beds}</span> bd</span>
          )}
          {listing.baths != null && (
            <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{listing.baths}</span> ba</span>
          )}
          {sqftStr && (
            <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{sqftStr}</span> sqft</span>
          )}
        </div>

        {/* Notes */}
        {listing.notes && (
          <p className="text-[10px] text-neutral-500 italic border-t pt-2 mt-1" style={{ borderColor: CAVE.stoneEdge }}>
            {listing.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}
      >
        <button className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
          <Edit2 className="w-3 h-3" />Edit
        </button>
        <button
          className="flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
          style={{ color: GEM.green }}
          onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(fullAddr)}`, "_blank")}
        >
          View Map<ExternalLink className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

// ── Summary stat ──────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border flex-shrink-0"
      style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <p className="text-[10px] text-neutral-600 whitespace-nowrap">{label}</p>
      <p className="text-[13px] font-bold tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PortfolioPanel({ isActive }: { isActive: boolean }) {
  const [statusFilter, setStatusFilter] = useState<"" | ListingStatus>("");

  const listings = MOCK_LISTINGS.filter(l => !statusFilter || l.status === statusFilter);

  const activeCount    = MOCK_LISTINGS.filter(l => l.status === "active").length;
  const contractCount  = MOCK_LISTINGS.filter(l => l.status === "under_contract" || l.status === "pending").length;
  const soldCount      = MOCK_LISTINGS.filter(l => l.status === "sold").length;
  const totalVolume    = MOCK_LISTINGS.filter(l => l.status !== "expired").reduce((sum, l) => sum + l.price, 0);
  const volumeStr      = `$${(totalVolume / 1_000_000).toFixed(1)}M`;

  return (
    <div
      className={cn("h-full flex flex-col transition-all duration-500", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none")}
      style={{ background: CAVE.deep }}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3.5 space-y-3" style={{ borderBottom: `1px solid ${CAVE.stoneMid}` }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" style={{ color: GEM.green }} />
              <h2 className="text-[13px] font-bold text-neutral-200">Portfolio</h2>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider" style={{ color: GEM.yellow, background: `${GEM.yellow}14`, border: `1px solid ${GEM.yellow}28` }}>
                Demo
              </span>
            </div>
            <p className="text-[10px] text-neutral-600 mt-0.5">Your active listings and recent sales</p>
          </div>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: `${GEM.green}14`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
          >
            <Plus className="w-3 h-3" />Add Listing
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <StatChip label="Active"       value={activeCount}   color={GEM.green}  />
          <StatChip label="In Contract"  value={contractCount} color={GEM.yellow} />
          <StatChip label="Sold (90d)"   value={soldCount}     color="#a855f7"    />
          <StatChip label="Portfolio Vol" value={volumeStr}    color="#60a5fa"    />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border"
              style={statusFilter === f.value
                ? { color: GEM.green, background: `${GEM.green}12`, borderColor: `${GEM.green}30` }
                : { color: "#525252", background: "transparent", borderColor: CAVE.stoneEdge }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Home className="w-7 h-7 text-neutral-700" />
            <p className="text-[12px] text-neutral-500">No listings match this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] text-neutral-700">
          {listings.length} listing{listings.length !== 1 ? "s" : ""}{statusFilter ? " (filtered)" : ""} · Connect MLS to sync live data
        </span>
        <button className="ml-auto flex items-center gap-1 text-[10px] transition-colors hover:opacity-80" style={{ color: GEM.green }}>
          Connect MLS<ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
