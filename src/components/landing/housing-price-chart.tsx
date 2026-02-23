"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, AlertCircle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { FredSeriesData } from "@/types";

function formatPrice(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toLocaleString()}`;
}

function formatTooltipPrice(value: number): string {
  return `$${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatLastUpdated(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function HousingPriceChart() {
  const [data, setData] = useState<FredSeriesData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const colors = {
    line: isDark ? "#e5e5e5" : "#171717",
    gradientStart: isDark ? "#e5e5e5" : "#171717",
    grid: isDark ? "#262626" : "#f5f5f5",
    tickFill: isDark ? "#737373" : "#a3a3a3",
    activeDotStroke: isDark ? "#0a0a0a" : "#fff",
  };

  const tooltipStyle: React.CSSProperties = {
    background: isDark ? "#1c1c1c" : "#fafafa",
    border: `1px solid ${isDark ? "#333" : "#e5e5e5"}`,
    borderRadius: "8px",
    fontSize: "11px",
    color: isDark ? "#d4d4d4" : "#525252",
    padding: "8px 12px",
    boxShadow: isDark
      ? "0 2px 8px rgba(0,0,0,0.3)"
      : "0 2px 8px rgba(0,0,0,0.06)",
  };

  useEffect(() => {
    fetch("/api/fred/MSPUS")
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((d: FredSeriesData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !data || data.observations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mb-3" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Housing price data is temporarily unavailable.
        </p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
          Check back shortly — data is sourced from the Federal Reserve (FRED).
        </p>
      </div>
    );
  }

  const chartData = data.observations.map((o) => ({
    date: o.date,
    label: formatDate(o.date),
    value: o.value,
  }));

  const latest = chartData[chartData.length - 1];
  const earliest = chartData[0];

  // Year-over-year labels: show every 5 years for readability
  const yearTicks = chartData
    .filter((d) => {
      const year = new Date(d.date + "T00:00:00").getFullYear();
      return year % 5 === 0 && d.date.endsWith("-01-01");
    })
    .map((d) => d.date);

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            Current
          </p>
          <p className="text-3xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
            {formatTooltipPrice(latest.value)}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            as of {latest.label}
          </p>
        </div>
        <div className="text-xs text-neutral-400">
          {earliest.label} – {latest.label}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.gradientStart} stopOpacity={0.08} />
                <stop offset="95%" stopColor={colors.gradientStart} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              ticks={yearTicks}
              tickFormatter={(d: string) =>
                new Date(d + "T00:00:00").getFullYear().toString()
              }
              tick={{ fontSize: 10, fill: colors.tickFill }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.tickFill }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatPrice}
              width={50}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(d: string) => formatDate(d)}
              formatter={(value: number) => [formatTooltipPrice(value), "Median Price"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors.line}
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              activeDot={{
                r: 3,
                fill: colors.line,
                stroke: colors.activeDotStroke,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
        <p className="text-[11px] text-neutral-400">
          Source: FRED / U.S. Census Bureau &middot; Series MSPUS
        </p>
        <p className="text-[11px] text-neutral-400">
          Last updated {formatLastUpdated(data.lastUpdated)}
        </p>
      </div>
    </div>
  );
}
