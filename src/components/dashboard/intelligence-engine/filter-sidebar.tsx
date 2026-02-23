"use client";

import { useState } from "react";
import {
  ChevronDown,
  MapPin,
  Home,
  TrendingUp,
  Users,
  Shield,
  Sliders,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.05]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-brand-400/70" />
          <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
            {title}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-neutral-600 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Checkbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className="flex items-center justify-between gap-2 cursor-pointer group py-0.5"
      onClick={onChange}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
            checked
              ? "bg-brand-500 border-brand-500"
              : "border-neutral-700 group-hover:border-neutral-500"
          )}
        >
          {checked && (
            <svg className="w-2 h-2 text-white" viewBox="0 0 8 8" fill="none">
              <path
                d="M1 4L3 6.5L7 1.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <span className="text-[11px] text-neutral-400 group-hover:text-neutral-300 transition-colors">
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] text-neutral-600 tabular-nums">
          {count.toLocaleString()}
        </span>
      )}
    </label>
  );
}

function TextInput({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-brand-500/40 focus:bg-brand-500/[0.04] transition-all"
      />
    </div>
  );
}

function RangeInput({ label }: { label: string }) {
  return (
    <div>
      <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Min"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-brand-500/40 transition-all"
        />
        <span className="text-neutral-700 text-xs flex-shrink-0">–</span>
        <input
          type="text"
          placeholder="Max"
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-brand-500/40 transition-all"
        />
      </div>
    </div>
  );
}

function SelectInput({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <select className="w-full bg-[#0d1421] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[11px] text-neutral-400 focus:outline-none focus:border-brand-500/40 transition-all appearance-none cursor-pointer">
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

export function FilterSidebar() {
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [ownerTypes, setOwnerTypes] = useState<string[]>([]);
  const [sellerSignals, setSellerSignals] = useState<string[]>([]);
  const [buyerSignals, setBuyerSignals] = useState<string[]>([]);
  const [distressSignals, setDistressSignals] = useState<string[]>([]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const totalActive =
    propertyTypes.length +
    ownerTypes.length +
    sellerSignals.length +
    buyerSignals.length +
    distressSignals.length;

  const clearAll = () => {
    setPropertyTypes([]);
    setOwnerTypes([]);
    setSellerSignals([]);
    setBuyerSignals([]);
    setDistressSignals([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0e18] border-r border-white/[0.05]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-bold text-neutral-200 uppercase tracking-widest">
            Filters
          </span>
          {totalActive > 0 && (
            <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-full">
              {totalActive}
            </span>
          )}
        </div>
        {totalActive > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      {/* Scrollable filter body */}
      <div className="flex-1 overflow-y-auto">
        {/* Location Intelligence */}
        <FilterSection title="Location" icon={MapPin} defaultOpen>
          <TextInput label="City" placeholder="Austin, Dallas, Houston..." />
          <TextInput label="ZIP Code(s)" placeholder="78745, 78704..." />
          <SelectInput
            label="Search Radius"
            options={[
              "Within 1 mile",
              "Within 5 miles",
              "Within 10 miles",
              "Within 25 miles",
            ]}
          />
          <TextInput label="Subdivision" placeholder="Barton Hills, Cherrywood..." />
          <TextInput label="School District" placeholder="Austin ISD..." />
        </FilterSection>

        {/* Property Data */}
        <FilterSection title="Property Data" icon={Home} defaultOpen>
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">
              Property Type
            </label>
            <div className="space-y-1.5">
              {[
                "Single Family",
                "Multi-Family",
                "Condo / Townhome",
                "Land",
                "Commercial",
              ].map((t) => (
                <Checkbox
                  key={t}
                  label={t}
                  checked={propertyTypes.includes(t)}
                  onChange={() => toggle(propertyTypes, setPropertyTypes, t)}
                />
              ))}
            </div>
          </div>
          <RangeInput label="Estimated Value ($)" />
          <SelectInput
            label="Equity %"
            options={[
              "25%+ Moderate",
              "40%+ Strong",
              "50%+ High",
              "60%+ Very High",
              "75%+ Exceptional",
            ]}
          />
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">
              Owner Type
            </label>
            <div className="space-y-1.5">
              {[
                "Owner Occupied",
                "Absentee Owner",
                "Non-Owner Occupied",
                "Corporate Owned",
              ].map((t) => (
                <Checkbox
                  key={t}
                  label={t}
                  checked={ownerTypes.includes(t)}
                  onChange={() => toggle(ownerTypes, setOwnerTypes, t)}
                />
              ))}
            </div>
          </div>
          <RangeInput label="Years Owned" />
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">
              Distress Signals
            </label>
            <div className="space-y-1.5">
              {[
                "Pre-Foreclosure",
                "Tax Delinquent",
                "Expired Listing",
                "Recently Listed",
                "Recently Purchased",
              ].map((s) => (
                <Checkbox
                  key={s}
                  label={s}
                  checked={distressSignals.includes(s)}
                  onChange={() => toggle(distressSignals, setDistressSignals, s)}
                />
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Seller Intent */}
        <FilterSection title="Seller Intent" icon={TrendingUp}>
          <SelectInput
            label="Min Intent Score"
            options={["50+ Moderate", "70+ High", "85+ Very High"]}
          />
          <div>
            <label className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2 block">
              Signals
            </label>
            <div className="space-y-1.5">
              {[
                "Equity threshold crossed",
                "Appreciation spike detected",
                "Long hold duration trigger",
                "Relocation likelihood",
                "Tax delinquency signal",
                "Estate / probate",
              ].map((s) => (
                <Checkbox
                  key={s}
                  label={s}
                  checked={sellerSignals.includes(s)}
                  onChange={() => toggle(sellerSignals, setSellerSignals, s)}
                />
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Buyer Intent */}
        <FilterSection title="Buyer Intent" icon={TrendingUp}>
          <div className="space-y-1.5">
            {[
              "Active listing views",
              "Price drop alerts viewed",
              "Saved property searches",
              "Mortgage pre-approval likely",
              "Rental-to-owner transition",
              "Investor buying frequency",
            ].map((s) => (
              <Checkbox
                key={s}
                label={s}
                checked={buyerSignals.includes(s)}
                onChange={() => toggle(buyerSignals, setBuyerSignals, s)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Demographics */}
        <FilterSection title="Demographics" icon={Users}>
          <p className="text-[10px] text-neutral-600 italic">
            Shown where legally compliant
          </p>
          <SelectInput
            label="Income Tier"
            options={["Under $50K", "$50K–$100K", "$100K–$200K", "$200K+"]}
          />
          <SelectInput
            label="Age Bracket"
            options={["25–34", "35–44", "45–54", "55–64", "65+"]}
          />
          <SelectInput
            label="Est. Net Worth"
            options={["Under $500K", "$500K–$1M", "$1M–$2M", "$2M+"]}
          />
          <SelectInput
            label="Household Size"
            options={["1", "2", "3–4", "5+"]}
          />
        </FilterSection>

        {/* Compliance */}
        <FilterSection title="Compliance" icon={Shield} defaultOpen>
          <div className="space-y-2">
            <Checkbox
              label="Exclude Do-Not-Contact list"
              checked={true}
              onChange={() => {}}
            />
            <Checkbox
              label="TCPA compliant numbers only"
              checked={true}
              onChange={() => {}}
            />
            <Checkbox
              label="Suppress opted-out contacts"
              checked={true}
              onChange={() => {}}
            />
          </div>
          <div className="mt-2 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.05]">
            <p className="text-[10px] text-amber-500/80 leading-relaxed">
              All data from public records. Verify TCPA, DNC, and applicable
              state regulations before outreach.
            </p>
          </div>
        </FilterSection>
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-white/[0.05] flex-shrink-0">
        <button className="w-full bg-brand-500 hover:bg-brand-400 text-white text-[12px] font-semibold py-2.5 rounded-lg transition-colors">
          Apply Filters
        </button>
      </div>
    </div>
  );
}
