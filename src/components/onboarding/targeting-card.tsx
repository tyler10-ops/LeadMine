"use client";

import { useState } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import {
  Pickaxe,
  MapPin,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Check,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TargetingFormData {
  // Step 1
  cities: string[];
  zipCodes: string[];
  // Step 2
  propertyTypes: string[];
  minPrice: string;
  maxPrice: string;
  // Step 3
  leadTypePreference: "buyers" | "sellers" | "both";
  // Step 4
  sellerSignals: string[];
  buyerSignals: string[];
  minYearsOwned: number;
  minEquityPct: number;
  // Step 5
  dealGoal: "1-2" | "3-5" | "5+";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: "single_family", label: "Single Family" },
  { id: "condo", label: "Condos" },
  { id: "multi_family", label: "Multi-Family" },
  { id: "luxury", label: "Luxury" },
  { id: "investment", label: "Investment" },
];

const SELLER_SIGNALS = [
  { id: "long_ownership", label: "Homes owned 5+ years" },
  { id: "high_equity", label: "High equity" },
  { id: "recently_renovated", label: "Recently renovated" },
  { id: "absentee_owner", label: "Absentee owners" },
  { id: "likely_downsize", label: "Likely to downsize" },
];

const BUYER_SIGNALS = [
  { id: "first_time_buyer", label: "First time buyers" },
  { id: "luxury_buyer", label: "Luxury buyers" },
  { id: "investor", label: "Investors" },
  { id: "relocation_buyer", label: "Relocation buyers" },
];

const STEPS = [
  { label: "Target Market", icon: MapPin },
  { label: "Property Preferences", icon: DollarSign },
  { label: "Lead Type", icon: Users },
  { label: "Signal Filters", icon: Target },
  { label: "Deal Goal", icon: TrendingUp },
];

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2"
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
            style={{
              background:
                i < current
                  ? GEM.green
                  : i === current
                  ? "rgba(0,255,136,0.15)"
                  : CAVE.surface1,
              border: `1px solid ${
                i < current
                  ? GEM.green
                  : i === current
                  ? GLOW.green.border
                  : CAVE.stoneEdge
              }`,
              color: i < current ? "#000" : i === current ? GEM.green : "#555",
              boxShadow: i === current ? GLOW.green.soft : undefined,
            }}
          >
            {i < current ? <Check className="w-3 h-3" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className="w-8 h-px"
              style={{
                background: i < current ? GEM.green : CAVE.stoneEdge,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1: Target Market ─────────────────────────────────────────────────────

function Step1({
  data,
  onChange,
}: {
  data: TargetingFormData;
  onChange: (d: Partial<TargetingFormData>) => void;
}) {
  const [cityInput, setCityInput] = useState("");
  const [zipInput, setZipInput] = useState("");

  const addCity = () => {
    const trimmed = cityInput.trim();
    if (trimmed && !data.cities.includes(trimmed)) {
      onChange({ cities: [...data.cities, trimmed] });
      setCityInput("");
    }
  };

  const addZip = () => {
    const trimmed = zipInput.trim();
    if (trimmed && !data.zipCodes.includes(trimmed)) {
      onChange({ zipCodes: [...data.zipCodes, trimmed] });
      setZipInput("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Cities */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
          Target Cities
        </label>
        <div className="flex gap-2">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
            placeholder="e.g. Austin TX"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none transition-colors"
            style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}
          />
          <button
            type="button"
            onClick={addCity}
            disabled={!cityInput.trim()}
            className="px-3 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{
              background: "rgba(0,255,136,0.1)",
              border: `1px solid ${GLOW.green.border}`,
              color: GEM.green,
            }}
          >
            Add
          </button>
        </div>
        {data.cities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.cities.map((c) => (
              <Tag
                key={c}
                label={c}
                onRemove={() => onChange({ cities: data.cities.filter((x) => x !== c) })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ZIP codes */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
          ZIP Codes (optional)
        </label>
        <div className="flex gap-2">
          <input
            value={zipInput}
            onChange={(e) => setZipInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addZip())}
            placeholder="e.g. 78701, 78704"
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none transition-colors"
            style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}
          />
          <button
            type="button"
            onClick={addZip}
            disabled={!zipInput.trim()}
            className="px-3 py-2.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-30"
            style={{
              background: "rgba(0,255,136,0.1)",
              border: `1px solid ${GLOW.green.border}`,
              color: GEM.green,
            }}
          >
            Add
          </button>
        </div>
        {data.zipCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.zipCodes.map((z) => (
              <Tag
                key={z}
                label={z}
                onRemove={() => onChange({ zipCodes: data.zipCodes.filter((x) => x !== z) })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step 2: Property Preferences ──────────────────────────────────────────────

function Step2({
  data,
  onChange,
}: {
  data: TargetingFormData;
  onChange: (d: Partial<TargetingFormData>) => void;
}) {
  const toggle = (id: string) => {
    const has = data.propertyTypes.includes(id);
    onChange({
      propertyTypes: has
        ? data.propertyTypes.filter((x) => x !== id)
        : [...data.propertyTypes, id],
    });
  };

  return (
    <div className="space-y-5">
      {/* Property types */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
          Property Types
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROPERTY_TYPES.map((pt) => {
            const active = data.propertyTypes.includes(pt.id);
            return (
              <button
                key={pt.id}
                type="button"
                onClick={() => toggle(pt.id)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? "rgba(0,255,136,0.1)" : CAVE.surface1,
                  border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
                  color: active ? GEM.green : "#a3a3a3",
                  boxShadow: active ? GLOW.green.soft : undefined,
                }}
              >
                <span
                  className="w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: active ? GEM.green : "transparent",
                    border: `1px solid ${active ? GEM.green : "#555"}`,
                  }}
                >
                  {active && <Check className="w-2.5 h-2.5 text-black" />}
                </span>
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
          Price Range (optional)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-neutral-600 mb-1">Minimum</p>
            <input
              type="number"
              value={data.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              placeholder="$200,000"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none"
              style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}
            />
          </div>
          <div>
            <p className="text-[10px] text-neutral-600 mb-1">Maximum</p>
            <input
              type="number"
              value={data.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              placeholder="$1,000,000"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none"
              style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Lead Type ─────────────────────────────────────────────────────────

function Step3({
  data,
  onChange,
}: {
  data: TargetingFormData;
  onChange: (d: Partial<TargetingFormData>) => void;
}) {
  const options: { value: TargetingFormData["leadTypePreference"]; label: string; desc: string }[] = [
    { value: "buyers", label: "Buyers", desc: "Focus on leads looking to purchase property" },
    { value: "sellers", label: "Sellers", desc: "Focus on homeowners likely to list" },
    { value: "both", label: "Both", desc: "Cast a wider net across buyer and seller signals" },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const active = data.leadTypePreference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ leadTypePreference: opt.value })}
            className="w-full flex items-start gap-3 px-4 py-3.5 rounded-lg text-left transition-all"
            style={{
              background: active ? "rgba(0,255,136,0.08)" : CAVE.surface1,
              border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
              boxShadow: active ? GLOW.green.soft : undefined,
            }}
          >
            <span
              className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: active ? GEM.green : "transparent",
                border: `2px solid ${active ? GEM.green : "#555"}`,
              }}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: active ? GEM.green : "#e5e5e5" }}>
                {opt.label}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Step 4: Signal Filters ────────────────────────────────────────────────────

const YEARS_OWNED_OPTIONS = [
  { value: 0,  label: "Any" },
  { value: 3,  label: "3+ yrs" },
  { value: 5,  label: "5+ yrs" },
  { value: 10, label: "10+ yrs" },
];

const EQUITY_PCT_OPTIONS = [
  { value: 0,  label: "Any" },
  { value: 20, label: "20%+" },
  { value: 40, label: "40%+" },
  { value: 60, label: "60%+" },
];

function Step4({
  data,
  onChange,
}: {
  data: TargetingFormData;
  onChange: (d: Partial<TargetingFormData>) => void;
}) {
  const toggleSeller = (id: string) => {
    const has = data.sellerSignals.includes(id);
    onChange({
      sellerSignals: has
        ? data.sellerSignals.filter((x) => x !== id)
        : [...data.sellerSignals, id],
    });
  };

  const toggleBuyer = (id: string) => {
    const has = data.buyerSignals.includes(id);
    onChange({
      buyerSignals: has
        ? data.buyerSignals.filter((x) => x !== id)
        : [...data.buyerSignals, id],
    });
  };

  const showSellerThresholds =
    data.leadTypePreference === "sellers" || data.leadTypePreference === "both";

  return (
    <div className="space-y-5">
      {(data.leadTypePreference === "sellers" || data.leadTypePreference === "both") && (
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
            Seller Signals
          </label>
          <div className="space-y-2">
            {SELLER_SIGNALS.map((s) => {
              const active = data.sellerSignals.includes(s.id);
              return (
                <CheckRow
                  key={s.id}
                  label={s.label}
                  active={active}
                  onToggle={() => toggleSeller(s.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {(data.leadTypePreference === "buyers" || data.leadTypePreference === "both") && (
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-3">
            Buyer Signals
          </label>
          <div className="space-y-2">
            {BUYER_SIGNALS.map((s) => {
              const active = data.buyerSignals.includes(s.id);
              return (
                <CheckRow
                  key={s.id}
                  label={s.label}
                  active={active}
                  onToggle={() => toggleBuyer(s.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {showSellerThresholds && (
        <div
          className="rounded-xl p-4 space-y-4"
          style={{
            background: "rgba(0,255,136,0.03)",
            border: `1px solid ${CAVE.stoneEdge}`,
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-neutral-600 font-semibold">
            Seller Quality Thresholds
          </p>

          {/* Min years owned */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-2">
              Minimum years owned
              <span className="ml-1.5 text-neutral-600 font-normal normal-case">
                — filters out recent buyers unlikely to sell
              </span>
            </label>
            <div className="flex gap-2">
              {YEARS_OWNED_OPTIONS.map((opt) => {
                const active = data.minYearsOwned === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ minYearsOwned: opt.value })}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: active ? "rgba(0,255,136,0.12)" : CAVE.surface1,
                      border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
                      color: active ? GEM.green : "#737373",
                      boxShadow: active ? GLOW.green.soft : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min equity % */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-2">
              Minimum equity
              <span className="ml-1.5 text-neutral-600 font-normal normal-case">
                — higher equity = stronger motivation to sell
              </span>
            </label>
            <div className="flex gap-2">
              {EQUITY_PCT_OPTIONS.map((opt) => {
                const active = data.minEquityPct === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ minEquityPct: opt.value })}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: active ? "rgba(0,255,136,0.12)" : CAVE.surface1,
                      border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
                      color: active ? GEM.green : "#737373",
                      boxShadow: active ? GLOW.green.soft : undefined,
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-600 italic">
        Optional — signals and thresholds raise the bar for what counts as a quality lead.
      </p>
    </div>
  );
}

// ── Step 5: Deal Goal ─────────────────────────────────────────────────────────

function Step5({
  data,
  onChange,
}: {
  data: TargetingFormData;
  onChange: (d: Partial<TargetingFormData>) => void;
}) {
  const options: { value: TargetingFormData["dealGoal"]; label: string; desc: string }[] = [
    { value: "1-2", label: "1–2 deals/month", desc: "Focused pipeline — high quality over volume" },
    { value: "3-5", label: "3–5 deals/month", desc: "Balanced growth with steady lead flow" },
    { value: "5+", label: "5+ deals/month", desc: "High-volume operation — maximum lead extraction" },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const active = data.dealGoal === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange({ dealGoal: opt.value })}
            className="w-full flex items-start gap-3 px-4 py-3.5 rounded-lg text-left transition-all"
            style={{
              background: active ? "rgba(0,255,136,0.08)" : CAVE.surface1,
              border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
              boxShadow: active ? GLOW.green.soft : undefined,
            }}
          >
            <span
              className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: active ? GEM.green : "transparent",
                border: `2px solid ${active ? GEM.green : "#555"}`,
              }}
            >
              {active && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
            </span>
            <div>
              <p className="text-sm font-medium" style={{ color: active ? GEM.green : "#e5e5e5" }}>
                {opt.label}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{opt.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
      style={{
        background: "rgba(0,255,136,0.08)",
        border: `1px solid ${GLOW.green.border}`,
        color: GEM.green,
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="opacity-60 hover:opacity-100 transition-opacity"
      >
        ×
      </button>
    </span>
  );
}

function CheckRow({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all"
      style={{
        background: active ? "rgba(0,255,136,0.07)" : "transparent",
        border: `1px solid ${active ? GLOW.green.border : CAVE.stoneEdge}`,
        color: active ? GEM.green : "#a3a3a3",
      }}
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
        style={{
          background: active ? GEM.green : "transparent",
          border: `1px solid ${active ? GEM.green : "#555"}`,
        }}
      >
        {active && <Check className="w-3 h-3 text-black" />}
      </span>
      {label}
    </button>
  );
}

// ── Main Card ─────────────────────────────────────────────────────────────────

interface TargetingCardProps {
  onSubmit: (data: TargetingFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function TargetingCard({ onSubmit, isSubmitting }: TargetingCardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TargetingFormData>({
    cities: [],
    zipCodes: [],
    propertyTypes: ["single_family"],
    minPrice: "",
    maxPrice: "",
    leadTypePreference: "both",
    sellerSignals: [],
    buyerSignals: [],
    minYearsOwned: 0,
    minEquityPct: 0,
    dealGoal: "1-2",
  });

  const update = (partial: Partial<TargetingFormData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  const canProceed = () => {
    if (step === 0) return data.cities.length > 0 || data.zipCodes.length > 0;
    return true;
  };

  const StepIcon = STEPS[step].icon;

  const renderStep = () => {
    switch (step) {
      case 0: return <Step1 data={data} onChange={update} />;
      case 1: return <Step2 data={data} onChange={update} />;
      case 2: return <Step3 data={data} onChange={update} />;
      case 3: return <Step4 data={data} onChange={update} />;
      case 4: return <Step5 data={data} onChange={update} />;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else onSubmit(data);
  };

  return (
    <div
      className="w-full max-w-lg rounded-2xl p-8"
      style={{
        background: CAVE.deep,
        border: `1px solid ${CAVE.stoneEdge}`,
        boxShadow: GLOW.green.soft,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #00FF88 0%, #00CC66 100%)",
            boxShadow: GLOW.green.medium,
          }}
        >
          <Pickaxe className="w-5 h-5 text-black" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-neutral-100 tracking-tight">
            Configure Your Mining Zone
          </h2>
          <p className="text-xs text-neutral-500">Set your targeting parameters</p>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={STEPS.length} />

      {/* Step heading */}
      <div className="flex items-center gap-2 mb-5">
        <StepIcon className="w-4 h-4" style={{ color: GEM.green }} />
        <h3 className="text-sm font-semibold text-neutral-200">
          {STEPS[step].label}
        </h3>
        <span className="text-xs text-neutral-600">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>

      {/* Step content */}
      <div className="min-h-[220px]">{renderStep()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}>
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          disabled={step === 0}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed text-neutral-400 hover:text-neutral-200"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${GEM.green}, #00CC66)`,
            color: "#000",
            boxShadow: canProceed() ? `0 2px 12px rgba(0,255,136,0.25)` : undefined,
          }}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : step === STEPS.length - 1 ? (
            <>
              <Pickaxe className="w-4 h-4" />
              Launch Mining Zone
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
