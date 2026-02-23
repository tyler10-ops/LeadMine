"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsSnapshot } from "@/types";

const darkTooltipStyle = {
  background: "#1a1a1a",
  border: "1px solid #262626",
  borderRadius: "8px",
  fontSize: "11px",
  color: "#a3a3a3",
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="bg-[#111111] border border-neutral-800/50 rounded-xl p-5">
      <h3 className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className="h-[240px]">{children}</div>
    </div>
  );
}

interface AnalyticsChartsProps {
  data: AnalyticsSnapshot[];
}

export function LeadsAndAppointmentsChart({ data }: AnalyticsChartsProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    leads: d.ai_handled_leads,
    appointments: d.appointments_booked,
  }));

  return (
    <ChartCard title="AI-Handled Leads vs Appointments">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradAppts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={darkTooltipStyle} />
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#34d399"
            strokeWidth={1.5}
            fill="url(#gradLeads)"
            name="Leads"
          />
          <Area
            type="monotone"
            dataKey="appointments"
            stroke="#60a5fa"
            strokeWidth={1.5}
            fill="url(#gradAppts)"
            name="Appointments"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AutomationRunsChart({ data }: AnalyticsChartsProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    success: d.success_count,
    failure: d.failure_count,
  }));

  return (
    <ChartCard title="Automation Runs (Success vs Failure)">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={darkTooltipStyle} />
          <Bar
            dataKey="success"
            fill="#34d399"
            radius={[2, 2, 0, 0]}
            name="Success"
          />
          <Bar
            dataKey="failure"
            fill="#f87171"
            radius={[2, 2, 0, 0]}
            name="Failure"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CommissionChart({ data }: AnalyticsChartsProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    commission: Number(d.estimated_commission),
  }));

  return (
    <ChartCard title="Estimated Commission Influenced">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradComm" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={darkTooltipStyle}
            formatter={(value) =>
              `$${Number(value).toLocaleString()}`
            }
          />
          <Area
            type="monotone"
            dataKey="commission"
            stroke="#fbbf24"
            strokeWidth={1.5}
            fill="url(#gradComm)"
            name="Commission"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ResponseTimeChart({ data }: AnalyticsChartsProps) {
  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    time: d.avg_response_time_ms,
  }));

  return (
    <ChartCard title="Avg Response Time (ms)">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="gradTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#525252" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip contentStyle={darkTooltipStyle} />
          <Area
            type="monotone"
            dataKey="time"
            stroke="#a78bfa"
            strokeWidth={1.5}
            fill="url(#gradTime)"
            name="Response Time"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
