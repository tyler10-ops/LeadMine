"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Thermometer,
  Snowflake,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// ── State list ──────────────────────────────────────────────────────────────

const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
] as const;

// ── Config ──────────────────────────────────────────────────────────────────

const METRICS = [
  { id: "median_price", label: "Median Price" },
  { id: "days_on_market", label: "Days on Market" },
  { id: "inventory", label: "Active Inventory" },
  { id: "sales_volume", label: "Sales Volume" },
] as const;

const MARKET_TYPES = ["Residential", "Commercial", "Rental"] as const;
const TIME_RANGES = ["1M", "3M", "6M", "1Y", "5Y"] as const;

type MetricId = (typeof METRICS)[number]["id"];
type MarketType = (typeof MARKET_TYPES)[number];
type TimeRange = (typeof TIME_RANGES)[number];

// ── Deterministic mock data generator ───────────────────────────────────────

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const MONTH_LABELS_12 = [
  "Feb", "Mar", "Apr", "May", "Jun", "Jul",
  "Aug", "Sep", "Oct", "Nov", "Dec", "Jan",
];

function getPointCount(range: TimeRange): number {
  switch (range) {
    case "1M": return 4;
    case "3M": return 6;
    case "6M": return 6;
    case "1Y": return 12;
    case "5Y": return 10;
  }
}

function getLabels(range: TimeRange): string[] {
  switch (range) {
    case "1M": return ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
    case "3M": return ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
    case "6M": return ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    case "1Y": return MONTH_LABELS_12;
    case "5Y": return ["2021", "2022", "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"];
  }
}

interface MetricConfig {
  base: number;
  variance: number;
  nationalAvg: number;
  format: (v: number) => string;
  trendMultiplier: number;
}

function getMetricConfig(metric: MetricId, market: MarketType): MetricConfig {
  const marketMult = market === "Commercial" ? 2.4 : market === "Rental" ? 0.45 : 1;
  switch (metric) {
    case "median_price":
      return {
        base: 412000 * marketMult,
        variance: 35000 * marketMult,
        nationalAvg: 412000 * marketMult,
        format: (v) => `$${(v / 1000).toFixed(0)}K`,
        trendMultiplier: 1,
      };
    case "days_on_market":
      return {
        base: 34,
        variance: 12,
        nationalAvg: 34,
        format: (v) => `${Math.round(v)}`,
        trendMultiplier: -1,
      };
    case "inventory":
      return {
        base: 24500 * (market === "Commercial" ? 0.3 : market === "Rental" ? 1.8 : 1),
        variance: 4000,
        nationalAvg: 24500 * (market === "Commercial" ? 0.3 : market === "Rental" ? 1.8 : 1),
        format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`,
        trendMultiplier: 1,
      };
    case "sales_volume":
      return {
        base: 5200 * (market === "Commercial" ? 0.15 : market === "Rental" ? 0.6 : 1),
        variance: 800,
        nationalAvg: 5200 * (market === "Commercial" ? 0.15 : market === "Rental" ? 0.6 : 1),
        format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`,
        trendMultiplier: 1,
      };
  }
}

function generateChartData(
  state: string,
  metric: MetricId,
  market: MarketType,
  range: TimeRange,
) {
  const seed = hashSeed(`${state}-${metric}-${market}-${range}`);
  const rand = seededRandom(seed);
  const config = getMetricConfig(metric, market);
  const count = getPointCount(range);
  const labels = getLabels(range);

  // State-level offset so each state has different base values
  const stateOffset = (hashSeed(state) % 100 - 50) / 100 * config.variance * 2;

  const points: { label: string; value: number; national: number }[] = [];
  let stateVal = config.base + stateOffset;
  let natVal = config.nationalAvg;

  for (let i = 0; i < count; i++) {
    const stateDelta = (rand() - 0.45) * config.variance * 0.3;
    const natDelta = (rand() - 0.48) * config.variance * 0.15;
    stateVal = Math.max(stateVal + stateDelta, config.base * 0.5);
    natVal = Math.max(natVal + natDelta, config.nationalAvg * 0.6);
    points.push({
      label: labels[i % labels.length],
      value: Math.round(stateVal),
      national: Math.round(natVal),
    });
  }

  return points;
}

// ── Derived indicators ──────────────────────────────────────────────────────

type HeatLevel = "Hot" | "Warm" | "Cool" | "Cold";

function getHeatLevel(data: { value: number; national: number }[]): HeatLevel {
  if (data.length < 2) return "Warm";
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const pctChange = ((last - first) / first) * 100;
  if (pctChange > 5) return "Hot";
  if (pctChange > 1) return "Warm";
  if (pctChange > -3) return "Cool";
  return "Cold";
}

function getHeatConfig(level: HeatLevel) {
  switch (level) {
    case "Hot":
      return { color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", border: "border-red-200 dark:border-red-800", icon: Flame };
    case "Warm":
      return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", icon: Thermometer };
    case "Cool":
      return { color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", icon: Thermometer };
    case "Cold":
      return { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-950/40", border: "border-blue-300 dark:border-blue-800", icon: Snowflake };
  }
}

function getBuyerSellerSignal(data: { value: number; national: number }[]): {
  label: string;
  direction: "buyer" | "seller" | "neutral";
  pct: number;
} {
  if (data.length < 2) return { label: "Neutral", direction: "neutral", pct: 50 };
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const pctChange = ((last - first) / first) * 100;
  if (pctChange > 3) return { label: "Seller's Market", direction: "seller", pct: Math.min(85, 50 + pctChange * 3) };
  if (pctChange < -1) return { label: "Buyer's Market", direction: "buyer", pct: Math.max(15, 50 + pctChange * 3) };
  return { label: "Balanced", direction: "neutral", pct: 50 };
}

// ── Mini sparkline ──────────────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 16;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");

  return (
    <svg width={w} height={h} className="inline-block ml-2" viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function MarketIntelligence() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chartColors = {
    line: isDark ? "#e5e5e5" : "#171717",
    grid: isDark ? "#262626" : "#f5f5f5",
    tickFill: isDark ? "#737373" : "#a3a3a3",
    refLine: isDark ? "#404040" : "#d4d4d4",
    nationalLine: isDark ? "#525252" : "#d4d4d4",
    activeDotStroke: isDark ? "#0a0a0a" : "#fff",
  };

  const tooltipStyle: React.CSSProperties = {
    background: isDark ? "#1c1c1c" : "#fafafa",
    border: `1px solid ${isDark ? "#333" : "#e5e5e5"}`,
    borderRadius: "8px",
    fontSize: "11px",
    color: isDark ? "#d4d4d4" : "#525252",
    padding: "8px 12px",
    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
  };
  const [state, setState] = useState("CA");
  const [metric, setMetric] = useState<MetricId>("median_price");
  const [market, setMarket] = useState<MarketType>("Residential");
  const [range, setRange] = useState<TimeRange>("1Y");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");

  const stateLabel = US_STATES.find((s) => s.value === state)?.label ?? state;
  const metricConfig = getMetricConfig(metric, market);

  const chartData = useMemo(
    () => generateChartData(state, metric, market, range),
    [state, metric, market, range],
  );

  const nationalAvgValue = useMemo(() => {
    const sum = chartData.reduce((a, d) => a + d.national, 0);
    return sum / chartData.length;
  }, [chartData]);

  const heat = getHeatLevel(chartData);
  const heatCfg = getHeatConfig(heat);
  const HeatIcon = heatCfg.icon;
  const signal = getBuyerSellerSignal(chartData);

  // Sparkline data for the metric summary cards
  const sparklineMetrics = useMemo(() => {
    return METRICS.map((m) => {
      const d = generateChartData(state, m.id, market, "6M");
      const cfg = getMetricConfig(m.id, market);
      const last = d[d.length - 1].value;
      const prev = d[d.length - 2]?.value ?? last;
      const direction = last > prev ? "up" : last < prev ? "down" : "neutral";
      return {
        ...m,
        value: cfg.format(last),
        direction,
        sparkData: d.map((p) => p.value),
      };
    });
  }, [state, market]);

  const filteredStates = stateSearch
    ? US_STATES.filter(
        (s) =>
          s.label.toLowerCase().includes(stateSearch.toLowerCase()) ||
          s.value.toLowerCase().includes(stateSearch.toLowerCase()),
      )
    : US_STATES;

  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const firstVal = chartData[0]?.value ?? 0;
  const trendPct = firstVal ? (((lastVal - firstVal) / firstVal) * 100).toFixed(1) : "0.0";
  const trendUp = lastVal >= firstVal;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
      {/* ── Top bar: state selector + badges ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800">
        {/* Left: state dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            >
              <span className="text-xs font-semibold text-neutral-400">{state}</span>
              {stateLabel}
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="p-2 border-b border-neutral-100 dark:border-neutral-800">
                    <input
                      type="text"
                      placeholder="Search states..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="w-full text-sm px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors placeholder:text-neutral-400 dark:text-neutral-100"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {filteredStates.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => {
                          setState(s.value);
                          setDropdownOpen(false);
                          setStateSearch("");
                        }}
                        className={`w-full text-left text-sm px-3 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2 ${
                          s.value === state
                            ? "text-neutral-900 dark:text-neutral-100 font-medium bg-neutral-50 dark:bg-neutral-800"
                            : "text-neutral-600 dark:text-neutral-400"
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-neutral-400 w-6">
                          {s.value}
                        </span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Live dot */}
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        </div>

        {/* Right: heat badge + buyer/seller signal */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${heatCfg.bg} ${heatCfg.color} ${heatCfg.border}`}
          >
            <HeatIcon className="w-3 h-3" />
            {heat}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md border ${
              signal.direction === "seller"
                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                : signal.direction === "buyer"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                  : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700"
            }`}
          >
            {signal.direction === "seller" ? (
              <TrendingUp className="w-3 h-3" />
            ) : signal.direction === "buyer" ? (
              <TrendingDown className="w-3 h-3" />
            ) : (
              <Minus className="w-3 h-3" />
            )}
            {signal.label}
          </span>
        </div>
      </div>

      {/* ── Control row: market tabs + metric switcher + time range ── */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
        {/* Market type tabs */}
        <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5">
          {MARKET_TYPES.map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                market === m
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />

        {/* Metric switcher */}
        <div className="flex items-center gap-1">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                metric === m.id
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />

        {/* Time range toggles */}
        <div className="flex items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 p-0.5 ml-auto">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-md transition-all ${
                range === r
                  ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart area ───────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-2">
        {/* Chart header */}
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {metricConfig.format(lastVal)}
            </span>
            <span
              className={`ml-2 text-xs font-medium ${
                trendUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trendUp ? "+" : ""}
              {trendPct}%
            </span>
          </div>
          <span className="text-[10px] text-neutral-400">
            vs national avg {metricConfig.format(nationalAvgValue)}
          </span>
        </div>

        <div className="h-[200px] min-h-[200px] -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="heroLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.line} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={chartColors.line} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={chartColors.grid}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: chartColors.tickFill }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.tickFill }}
                axisLine={false}
                tickLine={false}
                tickFormatter={metricConfig.format}
                width={50}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => [
                  metricConfig.format(value as number),
                  (name as string) === "value" ? stateLabel : "National Avg",
                ]}
              />
              <ReferenceLine
                y={nationalAvgValue}
                stroke={chartColors.refLine}
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <Line
                type="monotone"
                dataKey="national"
                stroke={chartColors.nationalLine}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                name="National Avg"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={chartColors.line}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: chartColors.line, stroke: chartColors.activeDotStroke, strokeWidth: 2 }}
                name="value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom: metric summary cards with sparklines ─────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-800">
        {sparklineMetrics.map((m) => {
          const isActive = m.id === metric;
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`text-left px-4 py-3 transition-colors ${
                isActive ? "bg-neutral-50 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                  {m.label}
                </p>
                {m.direction === "up" ? (
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                ) : m.direction === "down" ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : (
                  <Minus className="w-3 h-3 text-neutral-400" />
                )}
              </div>
              <div className="flex items-end justify-between mt-1">
                <span
                  className={`text-sm font-semibold ${
                    isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  {m.value}
                </span>
                <MiniSparkline
                  data={m.sparkData}
                  color={
                    m.direction === "up"
                      ? "#10b981"
                      : m.direction === "down"
                        ? "#ef4444"
                        : "#a3a3a3"
                  }
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
