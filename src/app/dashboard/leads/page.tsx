"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getRelativeTime } from "@/lib/utils";
import { Search, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PipelineStageBadge } from "@/components/hub/pipeline-stage-badge";
import Link from "next/link";
import type { Lead } from "@/types";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const fetchLeads = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: realtor } = await supabase
        .from("realtors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!realtor) return;

      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("realtor_id", realtor.id)
        .order("created_at", { ascending: false });

      setLeads(data || []);
      setLoading(false);
    };

    fetchLeads();
  }, []);

  const filtered = leads.filter((lead) => {
    const matchesSearch =
      !search ||
      lead.email.toLowerCase().includes(search.toLowerCase()) ||
      lead.name?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "all" || lead.intent === filter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Leads</h2>
        <p className="text-sm text-neutral-500 mt-1">
          {leads.length} total leads captured
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {["all", "buyer", "seller", "investor", "unknown"].map((intent) => (
            <button
              key={intent}
              onClick={() => setFilter(intent)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filter === intent
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {intent.charAt(0).toUpperCase() + intent.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leads table */}
      <Card padding="sm">
        {filtered.length === 0 ? (
          <p className="text-sm text-neutral-400 p-4 text-center">
            {leads.length === 0
              ? "No leads captured yet"
              : "No leads match your filters"}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-neutral-100">
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Contact
                </th>
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Stage
                </th>
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Intent
                </th>
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Score
                </th>
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Source
                </th>
                <th className="text-xs font-medium text-neutral-400 uppercase tracking-wider py-3 px-4">
                  Captured
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/pipeline/${lead.id}`} className="block">
                      <p className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition-colors">
                        {lead.name || "—"}
                      </p>
                      <p className="text-xs text-neutral-500">{lead.email}</p>
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <PipelineStageBadge stage={lead.stage || "new"} />
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={lead.intent}>{lead.intent}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-neutral-900"
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500">
                        {lead.score}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-500">
                      {lead.source}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-500">
                      {getRelativeTime(lead.created_at)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
