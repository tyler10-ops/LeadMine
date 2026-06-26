"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home, Clock, Plus, ExternalLink, Loader2, ChevronRight,
  Trash2, X, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GEM, CAVE } from "@/lib/cave-theme";

// ── Types ─────────────────────────────────────────────────────────────────────

type ListingStatus = "active" | "under_contract" | "pending" | "sold" | "expired";

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  price: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  status: ListingStatus;
  list_date: string | null;
  mls_number: string | null;
  notes: string | null;
  created_at: string;
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ListingStatus, { label: string; color: string }> = {
  active:         { label: "Active",         color: GEM.green  },
  under_contract: { label: "Under Contract", color: GEM.yellow },
  pending:        { label: "Pending",        color: "#60a5fa"  },
  sold:           { label: "Sold",           color: "#a855f7"  },
  expired:        { label: "Expired",        color: "#6b7280"  },
};

const STATUS_FILTERS: { value: "" | ListingStatus; label: string }[] = [
  { value: "",               label: "All"           },
  { value: "active",         label: "Active"        },
  { value: "under_contract", label: "Under Contract"},
  { value: "pending",        label: "Pending"       },
  { value: "sold",           label: "Sold"          },
];

const STATUS_OPTIONS: ListingStatus[] = ["active", "under_contract", "pending", "sold", "expired"];

// ── Street View thumbnail ─────────────────────────────────────────────────────

function PropertyThumb({ address }: { address: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);
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

function ListingCard({ listing, onDelete }: { listing: Listing; onDelete: (id: string) => void }) {
  const cfg      = STATUS_CFG[listing.status];
  const fullAddr = [listing.address, listing.city, listing.state, listing.zip].filter(Boolean).join(", ");
  const priceStr = listing.price
    ? listing.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "Price TBD";
  const sqftStr  = listing.sqft ? listing.sqft.toLocaleString() : null;
  const dom      = listing.list_date
    ? Math.floor((Date.now() - new Date(listing.list_date).getTime()) / 86_400_000)
    : null;
  const domColor = dom == null ? "#6b7280" : dom <= 7 ? GEM.green : dom <= 21 ? GEM.yellow : "#6b7280";

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden transition-transform hover:scale-[1.01]"
      style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}
    >
      {/* Photo */}
      <div className="relative w-full overflow-hidden" style={{ height: 152, background: CAVE.stoneDeep }}>
        <PropertyThumb address={fullAddr} />
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ color: cfg.color, background: "rgba(0,0,0,0.75)", border: `1px solid ${cfg.color}40` }}>
            {cfg.label}
          </span>
        </div>
        {dom != null && (
          <div className="absolute top-2.5 right-2.5">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ color: domColor, background: "rgba(0,0,0,0.75)", border: `1px solid ${domColor}40` }}>
              <Clock className="w-2.5 h-2.5" />{dom}d
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold text-neutral-100 leading-tight">{priceStr}</p>
          {listing.mls_number && (
            <span className="text-[9px] text-neutral-600 font-mono mt-1 flex-shrink-0">{listing.mls_number}</span>
          )}
        </div>
        <div>
          <p className="text-[12px] font-medium text-neutral-200 leading-tight">{listing.address}</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">{listing.city}, {listing.state}{listing.zip ? ` ${listing.zip}` : ""}</p>
        </div>
        <div className="flex items-center gap-3 pt-0.5">
          {listing.beds  != null && <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{listing.beds}</span> bd</span>}
          {listing.baths != null && <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{listing.baths}</span> ba</span>}
          {sqftStr       && <span className="text-[11px] text-neutral-400"><span className="font-semibold text-neutral-200">{sqftStr}</span> sqft</span>}
        </div>
        {listing.notes && (
          <p className="text-[10px] text-neutral-500 italic border-t pt-2 mt-0.5" style={{ borderColor: CAVE.stoneEdge }}>
            {listing.notes}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}>
        <button
          onClick={() => { if (confirm("Remove this listing?")) onDelete(listing.id); }}
          className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />Remove
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

// ── Add Listing Modal ─────────────────────────────────────────────────────────

interface AddForm {
  address: string; city: string; state: string; zip: string;
  price: string; beds: string; baths: string; sqft: string;
  status: ListingStatus; list_date: string; mls_number: string; notes: string;
}

const EMPTY_FORM: AddForm = {
  address: "", city: "", state: "CA", zip: "",
  price: "", beds: "", baths: "", sqft: "",
  status: "active", list_date: new Date().toISOString().slice(0, 10),
  mls_number: "", notes: "",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${CAVE.stoneEdge}`,
  color: "#d4d4d4",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  outline: "none",
  width: "100%",
} as const;

function AddListingModal({ onClose, onSaved }: { onClose: () => void; onSaved: (l: Listing) => void }) {
  const [form, setForm]       = useState<AddForm>(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: keyof AddForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim() || !form.city.trim()) { setError("Address and city are required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:  form.price  ? Number(form.price)  : null,
          beds:   form.beds   ? Number(form.beds)   : null,
          baths:  form.baths  ? Number(form.baths)  : null,
          sqft:   form.sqft   ? Number(form.sqft)   : null,
          mls_number: form.mls_number || null,
          notes:      form.notes     || null,
          zip:        form.zip       || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      onSaved(data as Listing);
      onClose();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          style={{ background: CAVE.deep, border: `1px solid ${CAVE.stoneMid}` }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" style={{ color: GEM.green }} />
              <h3 className="text-[13px] font-bold text-neutral-200">Add Listing</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <Field label="Street Address *">
              <input style={inputStyle} value={form.address} onChange={set("address")} placeholder="123 Main St" required />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="City *">
                  <input style={inputStyle} value={form.city} onChange={set("city")} placeholder="Sacramento" required />
                </Field>
              </div>
              <Field label="State">
                <input style={inputStyle} value={form.state} onChange={set("state")} placeholder="CA" maxLength={2} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ZIP">
                <input style={inputStyle} value={form.zip} onChange={set("zip")} placeholder="95835" />
              </Field>
              <Field label="MLS #">
                <input style={inputStyle} value={form.mls_number} onChange={set("mls_number")} placeholder="ML-2024-0001" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="List Price ($)">
                <input style={inputStyle} type="number" value={form.price} onChange={set("price")} placeholder="499000" min={0} />
              </Field>
              <Field label="Status">
                <select style={inputStyle} value={form.status} onChange={set("status")}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s} style={{ background: "#111" }}>{STATUS_CFG[s].label}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Beds">
                <input style={inputStyle} type="number" value={form.beds} onChange={set("beds")} placeholder="3" min={0} step={1} />
              </Field>
              <Field label="Baths">
                <input style={inputStyle} type="number" value={form.baths} onChange={set("baths")} placeholder="2" min={0} step={0.5} />
              </Field>
              <Field label="Sqft">
                <input style={inputStyle} type="number" value={form.sqft} onChange={set("sqft")} placeholder="1800" min={0} />
              </Field>
            </div>
            <Field label="List Date">
              <input style={inputStyle} type="date" value={form.list_date} onChange={set("list_date")} />
            </Field>
            <Field label="Notes">
              <textarea style={{ ...inputStyle, resize: "none", height: 64 }} value={form.notes} onChange={set("notes")} placeholder="Accepted offer pending inspection..." />
            </Field>

            {error && <p className="text-[11px] text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-50"
              style={{ background: `${GEM.green}18`, border: `1px solid ${GEM.green}40`, color: GEM.green }}
            >
              {saving ? "Saving…" : "Add Listing"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

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
  const [listings,     setListings]   = useState<Listing[]>([]);
  const [loading,      setLoading]    = useState(true);
  const [refreshing,   setRefreshing] = useState(false);
  const [error,        setError]      = useState<string | null>(null);
  const [statusFilter, setFilter]     = useState<"" | ListingStatus>("");
  const [showAdd,      setShowAdd]    = useState(false);

  const fetchListings = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/listings");
      if (!res.ok) throw new Error("Failed to load listings");
      setListings(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) fetchListings();
  }, [isActive, fetchListings]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/listings?id=${id}`, { method: "DELETE" });
    setListings(l => l.filter(x => x.id !== id));
  };

  const handleSaved = (listing: Listing) => setListings(l => [listing, ...l]);

  const filtered = listings.filter(l => !statusFilter || l.status === statusFilter);

  const activeCount   = listings.filter(l => l.status === "active").length;
  const contractCount = listings.filter(l => l.status === "under_contract" || l.status === "pending").length;
  const soldCount     = listings.filter(l => l.status === "sold").length;
  const totalVolume   = listings.filter(l => l.status !== "expired").reduce((s, l) => s + (l.price ?? 0), 0);
  const volumeStr     = totalVolume >= 1_000_000
    ? `$${(totalVolume / 1_000_000).toFixed(1)}M`
    : totalVolume > 0 ? `$${(totalVolume / 1000).toFixed(0)}K` : "$0";

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
            </div>
            <p className="text-[10px] text-neutral-600 mt-0.5">Your active listings and recent sales</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchListings(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${CAVE.stoneEdge}`, color: "#525252" }}
            >
              <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />Refresh
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{ background: `${GEM.green}14`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
            >
              <Plus className="w-3 h-3" />Add Listing
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          <StatChip label="Active"        value={activeCount}   color={GEM.green}  />
          <StatChip label="In Contract"   value={contractCount} color={GEM.yellow} />
          <StatChip label="Sold"          value={soldCount}     color="#a855f7"    />
          <StatChip label="Portfolio Vol" value={volumeStr}     color="#60a5fa"    />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
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

      {/* Grid / states */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: `${GEM.green}60` }} />
            <p className="text-[12px] text-neutral-600">Loading listings…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-[12px] text-neutral-500">{error}</p>
            <button onClick={() => fetchListings()} className="text-[11px] hover:underline" style={{ color: GEM.green }}>Retry</button>
          </div>
        )}

        {!loading && !error && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${GEM.green}10`, border: `1px solid ${GEM.green}20` }}>
              <Home className="w-6 h-6" style={{ color: `${GEM.green}60` }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-semibold text-neutral-300">No listings yet</p>
              <p className="text-[11px] text-neutral-600 mt-1">Add your first active listing to track your portfolio.</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium transition-all"
              style={{ background: `${GEM.green}14`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
            >
              <Plus className="w-3.5 h-3.5" />Add Your First Listing
            </button>
          </div>
        )}

        {!loading && !error && listings.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-[12px] text-neutral-500">No listings match this filter.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(listing => (
              <ListingCard key={listing.id} listing={listing} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2.5 flex items-center gap-2" style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
        <span className="text-[10px] text-neutral-700">
          {filtered.length} listing{filtered.length !== 1 ? "s" : ""}{statusFilter ? " (filtered)" : ""}
        </span>
        <span
          className="ml-auto flex items-center gap-1 text-[10px]"
          style={{ color: "#525252" }}
          title="MLS auto-sync is on the roadmap — listings are added manually for now"
        >
          MLS sync — coming soon
        </span>
      </div>

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
    </div>
  );
}
