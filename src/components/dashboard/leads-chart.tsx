"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import type { DailyMetric } from "@/types";

interface LeadsChartProps {
  data: DailyMetric[];
}

export function LeadsChart({ data }: LeadsChartProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    leads: d.leads_captured,
    views: d.page_views,
    chats: d.chat_starts,
  }));

  return (
    <Card className="col-span-2">
      <CardTitle>Growth Overview</CardTitle>
      <div className="mt-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#171717" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#171717" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e5e5",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="leads"
              stroke="#171717"
              strokeWidth={2}
              fill="url(#colorLeads)"
              name="Leads"
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="#a3a3a3"
              strokeWidth={1.5}
              fill="url(#colorViews)"
              name="Page Views"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
