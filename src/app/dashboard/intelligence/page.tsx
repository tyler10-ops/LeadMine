"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Download,
  Bell,
  ChevronDown,
  Zap,
  Users,
  TrendingUp,
  Database,
  X,
  RefreshCw,
  Filter,
  Shield,
  Lock,
} from "lucide-react";
import { FilterSidebar } from "@/components/dashboard/intelligence-engine/filter-sidebar";
import { LeadCard, Lead } from "@/components/dashboard/intelligence-engine/lead-card";
import { cn } from "@/lib/utils";

// ─── Placeholder lead data ────────────────────────────────────────────────────
const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    name: "Michael & Sarah Torres",
    address: "4821 Oakwood Drive",
    city: "Austin",
    state: "TX",
    zip: "78745",
    phone: "(512) 847-2293",
    email: "m.torres@email.com",
    estimatedValue: 487000,
    equityEstimate: 312000,
    equityPercent: 64,
    mortgageBalance: 175000,
    yearsOwned: 9,
    intentScore: 87,
    automationScore: 91,
    propertyType: "Single Family",
    ownerType: "Owner Occupied",
    badges: ["High Intent", "Motivated Seller"],
    opportunitySummary:
      "This homeowner has 64% equity and has owned for 9 years. Market appreciation and average hold duration suggest a 78% likelihood of listing within 5 months.",
    lastActivity: "2 days ago",
    signals: ["Equity threshold crossed", "Long hold duration"],
    source: "Public Records + MLS",
  },
  {
    id: "l2",
    name: "Raj Patel",
    address: "2109 River Oak Lane",
    city: "Houston",
    state: "TX",
    zip: "77019",
    phone: "(713) 229-4451",
    email: "raj.patel@gmail.com",
    estimatedValue: 1240000,
    equityEstimate: 890000,
    equityPercent: 72,
    mortgageBalance: 350000,
    yearsOwned: 14,
    intentScore: 92,
    automationScore: 88,
    propertyType: "Single Family",
    ownerType: "Absentee Owner",
    badges: ["High Intent", "Investor", "Portfolio Owner"],
    opportunitySummary:
      "Absentee owner with 72% equity across a 14-year hold. Portfolio signals and tax delinquency flags indicate an 85% seller likelihood. Ideal for multi-property outreach.",
    lastActivity: "5 hours ago",
    signals: ["Absentee owner", "Portfolio flag", "Equity threshold crossed"],
    source: "County Records + Credit Signals",
  },
  {
    id: "l3",
    name: "Jennifer Whitmore",
    address: "809 Becker Ranch Road",
    city: "Pflugerville",
    state: "TX",
    zip: "78660",
    phone: "(512) 334-7812",
    email: "jwhitmore@yahoo.com",
    estimatedValue: 328000,
    equityEstimate: 185000,
    equityPercent: 56,
    mortgageBalance: 143000,
    yearsOwned: 6,
    intentScore: 61,
    automationScore: 74,
    propertyType: "Single Family",
    ownerType: "Owner Occupied",
    badges: ["Recently Active"],
    opportunitySummary:
      "Owner has viewed 12 active listings in the past 30 days. Moderate equity at 56% with a typical hold period suggests exploratory buyer activity with 6-month listing probability at 45%.",
    lastActivity: "1 day ago",
    signals: ["Active listing views", "Price drop alert engagement"],
    source: "Behavioral Data + MLS Activity",
  },
  {
    id: "l4",
    name: "Carlos & Maya Rivera",
    address: "3318 Summit Ridge Drive",
    city: "San Antonio",
    state: "TX",
    zip: "78230",
    phone: "(210) 555-0183",
    email: "crivera.home@gmail.com",
    estimatedValue: 415000,
    equityEstimate: 301000,
    equityPercent: 72,
    mortgageBalance: 114000,
    yearsOwned: 11,
    intentScore: 78,
    automationScore: 83,
    propertyType: "Single Family",
    ownerType: "Owner Occupied",
    badges: ["High Intent", "Motivated Seller"],
    opportunitySummary:
      "72% equity homeowner with 11-year tenure. Appreciation signals and neighborhood turnover rate of 18% suggest a 70% probability of listing in the next 4 months.",
    lastActivity: "3 days ago",
    signals: ["Appreciation spike", "Neighborhood turnover trigger"],
    source: "Public Records + Appreciation Index",
  },
  {
    id: "l5",
    name: "David Thornton",
    address: "12 Commerce Blvd, Unit 4",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    phone: "(214) 742-1990",
    email: "dthornton.invest@outlook.com",
    estimatedValue: 2100000,
    equityEstimate: 1680000,
    equityPercent: 80,
    mortgageBalance: 420000,
    yearsOwned: 18,
    intentScore: 95,
    automationScore: 94,
    propertyType: "Multi-Family",
    ownerType: "Non-Owner Occupied",
    badges: ["High Intent", "Investor", "Cash Buyer", "Portfolio Owner"],
    opportunitySummary:
      "High-value investor with 80% equity on a multi-family portfolio held 18 years. Cap rate trends and rate environment suggest a 91% disposition likelihood within 90 days. Premium outreach candidate.",
    lastActivity: "6 hours ago",
    signals: [
      "Cap rate compression",
      "Portfolio rebalancing signal",
      "Long hold duration",
    ],
    source: "Commercial Records + Investment Analytics",
  },
  {
    id: "l6",
    name: "Lisa Park",
    address: "4412 Heather Glen Ct",
    city: "Frisco",
    state: "TX",
    zip: "75034",
    phone: "(469) 381-5520",
    email: "lpark.home@icloud.com",
    estimatedValue: 720000,
    equityEstimate: 396000,
    equityPercent: 55,
    mortgageBalance: 324000,
    yearsOwned: 5,
    intentScore: 54,
    automationScore: 68,
    propertyType: "Single Family",
    ownerType: "Owner Occupied",
    badges: ["Recently Active"],
    opportunitySummary:
      "Newer homeowner with moderate equity. Recent school district searches and saved new-construction listings suggest upgrade intent. Buyer-side lead with 58% probability of purchasing within 6 months.",
    lastActivity: "12 hours ago",
    signals: ["Saved searches: new construction", "School district research"],
    source: "Behavioral Data + Search Signals",
  },
  {
    id: "l7",
    name: "Marcus & Diane Webb",
    address: "9204 Stone Canyon Rd",
    city: "Austin",
    state: "TX",
    zip: "78759",
    phone: "(512) 918-3341",
    email: "marcus.webb@proton.me",
    estimatedValue: 615000,
    equityEstimate: 472000,
    equityPercent: 77,
    mortgageBalance: 143000,
    yearsOwned: 16,
    intentScore: 89,
    automationScore: 87,
    propertyType: "Single Family",
    ownerType: "Owner Occupied",
    badges: ["High Intent", "Motivated Seller"],
    opportunitySummary:
      "Long-hold homeowner with 77% equity and above-average appreciation. Neighborhood comp activity and 16-year tenure strongly align with seller readiness. Recommend immediate outreach.",
    lastActivity: "1 day ago",
    signals: ["High equity", "Comp activity spike", "16-year tenure trigger"],
    source: "County Assessor + MLS Comps",
  },
  {
    id: "l8",
    name: "The Greenberg Family Trust",
    address: "501 Lake Travis View",
    city: "Austin",
    state: "TX",
    zip: "78738",
    phone: "(512) 266-1492",
    email: "trust@greenbergholdings.com",
    estimatedValue: 3800000,
    equityEstimate: 3400000,
    equityPercent: 89,
    mortgageBalance: 400000,
    yearsOwned: 22,
    intentScore: 97,
    automationScore: 96,
    propertyType: "Single Family",
    ownerType: "Non-Owner Occupied",
    badges: ["High Intent", "Investor", "Cash Buyer", "Portfolio Owner"],
    opportunitySummary:
      "Trust-held lakefront asset with 89% equity and 22-year hold. Estate planning signals and trust restructuring activity indicate a 94% likelihood of disposition within 12 months. Highest-priority outreach target.",
    lastActivity: "3 hours ago",
    signals: ["Trust restructuring", "Estate planning signal", "22-year tenure"],
    source: "Trust Records + Financial Intelligence",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0">
      {label}
      <button onClick={onRemove} className="hover:text-brand-200 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

function StatCounter({
  icon: Icon,
  label,
  value,
  change,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl flex-shrink-0">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[10px] text-neutral-600 whitespace-nowrap">{label}</p>
        <p className="text-[13px] font-semibold text-neutral-200">{value}</p>
      </div>
      {change && (
        <span className="text-[10px] text-emerald-400 ml-1 whitespace-nowrap">
          {change}
        </span>
      )}
    </div>
  );
}

const SORT_OPTIONS = [
  "Intent Score",
  "Est. Value",
  "Equity %",
  "Years Owned",
  "Recently Active",
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntelligencePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [activePills, setActivePills] = useState<string[]>([
    "Austin, TX",
    "Equity 50%+",
    "Intent 60+",
  ]);
  const [toast, setToast] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("Intent Score");
  const [sortOpen, setSortOpen] = useState(false);

  const credits = { total: 2500, used: 1847 };
  const creditPct = Math.round((credits.used / credits.total) * 100);

  const filtered = MOCK_LEADS.filter(
    (l) =>
      query === "" ||
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.address.toLowerCase().includes(query.toLowerCase()) ||
      l.city.toLowerCase().includes(query.toLowerCase()) ||
      l.zip.includes(query)
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const selectAll = () =>
    setSelectedIds(
      selectedIds.length === filtered.length ? [] : filtered.map((l) => l.id)
    );

  const handleAddToWorkflow = (id: string) => {
    const lead = MOCK_LEADS.find((l) => l.id === id);
    if (!lead) return;
    setToast(lead.name);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#080c12] text-neutral-100 overflow-hidden">
      {/* ── Global activation toast ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl shadow-xl shadow-emerald-900/40">
          <Zap className="w-3.5 h-3.5 flex-shrink-0" />
          {toast} activated in Seller Nurture Sequence
        </div>
      )}

      {/* ── Top search bar ── */}
      <div className="flex-shrink-0 border-b border-white/[0.05] bg-[#080c12]/90 backdrop-blur-xl px-6 py-4 space-y-4">
        {/* Row 1: title + search + controls */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <h1 className="text-[13px] font-bold text-neutral-100 leading-tight">
              Intelligence Engine
            </h1>
            <p className="text-[10px] text-neutral-600">
              Real Estate Lead Intelligence
            </p>
          </div>

          {/* Global search */}
          <div className="flex-1 relative max-w-2xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, address, ZIP, investor type, phone..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-[12px] text-neutral-300 placeholder-neutral-700 focus:outline-none focus:border-brand-500/50 focus:bg-brand-500/[0.03] focus:shadow-[0_0_24px_rgba(18,119,178,0.08)] transition-all"
            />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
            {/* Credit meter */}
            <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg">
              <Database className="w-3.5 h-3.5 text-neutral-500" />
              <div>
                <p className="text-[10px] text-neutral-600 mb-0.5">AI Credits</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400"
                      style={{ width: `${creditPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-neutral-400 tabular-nums">
                    {(credits.total - credits.used).toLocaleString()} left
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 border border-brand-500/30 bg-brand-500/10 px-1.5 py-0.5 rounded">
                Pro
              </span>
            </div>

            <button className="flex items-center gap-1.5 border border-white/[0.08] hover:border-white/[0.15] text-neutral-400 text-[11px] font-medium px-3 py-2 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button className="relative border border-white/[0.08] hover:border-white/[0.15] text-neutral-500 hover:text-neutral-300 p-2 rounded-lg transition-colors">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>
          </div>
        </div>

        {/* Row 2: live counters + filter toggle */}
        <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
          <StatCounter
            icon={Users}
            label="Total Leads"
            value="24,812"
            change="+143 today"
            color="#1277b2"
          />
          <StatCounter
            icon={TrendingUp}
            label="High Intent (75+)"
            value="3,891"
            color="#10b981"
          />
          <StatCounter
            icon={Zap}
            label="Automation Ready"
            value="2,247"
            color="#f59e0b"
          />
          <StatCounter
            icon={Database}
            label="Enriched Today"
            value="891"
            color="#a855f7"
          />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "ml-auto flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-3 py-2.5 rounded-xl border transition-all",
              sidebarOpen
                ? "bg-brand-500/10 border-brand-500/30 text-brand-400"
                : "border-white/[0.08] text-neutral-500 hover:border-white/[0.15] hover:text-neutral-300"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {sidebarOpen ? "Hide" : "Show"} Filters
          </button>
        </div>
      </div>

      {/* ── Body: sidebar + results ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filter sidebar */}
        {sidebarOpen && (
          <div className="w-72 flex-shrink-0 overflow-hidden">
            <FilterSidebar />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Sticky results bar */}
          <div className="flex-shrink-0 bg-[#080c12]/90 backdrop-blur-xl border-b border-white/[0.04] px-6 py-3 flex items-center gap-3">
            {/* Select all checkbox */}
            <div
              className={cn(
                "w-4 h-4 rounded border cursor-pointer flex items-center justify-center flex-shrink-0 transition-all",
                selectedIds.length === filtered.length && filtered.length > 0
                  ? "bg-brand-500 border-brand-500"
                  : "border-neutral-700 hover:border-neutral-500"
              )}
              onClick={selectAll}
            >
              {selectedIds.length === filtered.length && filtered.length > 0 && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M1.5 5L4 7.5L8.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Active filter pills */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              {activePills.map((pill) => (
                <FilterPill
                  key={pill}
                  label={pill}
                  onRemove={() =>
                    setActivePills((prev) => prev.filter((p) => p !== pill))
                  }
                />
              ))}
              {activePills.length === 0 && (
                <span className="text-[11px] text-neutral-700">
                  No active filters
                </span>
              )}
            </div>

            {/* Right: bulk action + count + sort */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-brand-400 font-semibold">
                    {selectedIds.length} selected
                  </span>
                  <button className="text-[11px] bg-brand-500 hover:bg-brand-400 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold">
                    Bulk Add to Workflow
                  </button>
                </div>
              )}

              <span className="text-[11px] text-neutral-600 tabular-nums">
                {filtered.length.toLocaleString()} results
              </span>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {sortBy}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-[#0d1421] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl z-20">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-[11px] transition-colors",
                          opt === sortBy
                            ? "text-brand-400 bg-brand-500/10"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="text-neutral-600 hover:text-neutral-400 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Scrollable lead grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 grid gap-4 xl:grid-cols-2">
              {filtered.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  selected={selectedIds.includes(lead.id)}
                  onSelect={() => toggleSelect(lead.id)}
                  onAddToWorkflow={handleAddToWorkflow}
                />
              ))}

              {filtered.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-24">
                  <Filter className="w-8 h-8 text-neutral-700 mb-3" />
                  <p className="text-neutral-500 text-sm">
                    No leads match your search
                  </p>
                  <button
                    onClick={() => setQuery("")}
                    className="mt-3 text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>

            {/* ── Compliance footer ── */}
            <div className="mx-6 mb-6 p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.03]">
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-amber-500/70 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-semibold text-amber-500/90 mb-1">
                    Compliance & Data Transparency
                  </p>
                  <p className="text-[10px] text-neutral-600 leading-relaxed">
                    All data is sourced from publicly available records including
                    county assessor databases, MLS feeds, and behavioral signals.
                    Do-Not-Contact suppression and TCPA filtering are applied by
                    default. Users are responsible for compliance with applicable
                    TCPA, DNC, and state regulations. Opt-out requests are
                    processed within 24 hours. Audit logs are maintained for all
                    contact events.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5">
                  <Lock className="w-3 h-3 text-neutral-600" />
                  <span className="text-[10px] text-neutral-600">Audit log</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
