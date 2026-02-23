"use client";

import { useEffect, useState } from "react";
import { HubMetricCard } from "@/components/hub/hub-metric-card";
import { PipelineBoard } from "@/components/hub/pipeline-board";
import { PipelineTable } from "@/components/hub/pipeline-table";
import { formatNumber } from "@/lib/utils";
import {
  Users,
  AlertTriangle,
  TrendingUp,
  CalendarCheck,
  LayoutGrid,
  List,
  Search,
  Loader2,
} from "lucide-react";
import type { Lead, PipelineStats } from "@/types";

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "table">("board");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [intentFilter, setIntentFilter] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (stageFilter) params.set("stage", stageFilter);
      if (intentFilter) params.set("intent", intentFilter);
      if (search) params.set("search", search);
      params.set("sort", sortField);
      params.set("order", sortOrder);

      const [leadsRes, statsRes] = await Promise.all([
        fetch(`/api/pipeline?${params}`).then((r) => r.json()),
        fetch("/api/pipeline/stats").then((r) => r.json()),
      ]);

      setLeads(Array.isArray(leadsRes) ? leadsRes : []);
      setStats(statsRes.total !== undefined ? statsRes : null);
      setLoading(false);
    };

    fetchData();
  }, [stageFilter, intentFilter, search, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-200 tracking-tight">
          Lead Pipeline
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Track and manage leads through the qualification process
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HubMetricCard
          label="Total Leads"
          value={formatNumber(stats?.total || 0)}
          icon={<Users className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Stale (48h+)"
          value={formatNumber(stats?.staleCount || 0)}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Conversion Rate"
          value={`${stats?.conversionRate || 0}%`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <HubMetricCard
          label="Booked"
          value={formatNumber(stats?.byStage?.booked || 0)}
          icon={<CalendarCheck className="w-4 h-4" />}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg pl-9 pr-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-neutral-700 focus:outline-none transition-colors"
          />
        </div>

        {/* Stage filter */}
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-400 focus:border-neutral-700 focus:outline-none transition-colors"
        >
          <option value="">All Stages</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="booked">Booked</option>
          <option value="dead">Dead</option>
        </select>

        {/* Intent filter */}
        <select
          value={intentFilter}
          onChange={(e) => setIntentFilter(e.target.value)}
          className="bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-400 focus:border-neutral-700 focus:outline-none transition-colors"
        >
          <option value="">All Intents</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="investor">Investor</option>
          <option value="unknown">Unknown</option>
        </select>

        {/* View toggle */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setView("board")}
            className={`p-2 rounded-lg transition-colors ${
              view === "board"
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`p-2 rounded-lg transition-colors ${
              view === "table"
                ? "bg-neutral-800 text-neutral-200"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "board" ? (
        <PipelineBoard leads={leads} />
      ) : (
        <PipelineTable
          leads={leads}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      )}
    </div>
  );
}
