"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils";
import { PipelineStageBadge } from "./pipeline-stage-badge";
import { ArrowUpDown } from "lucide-react";
import type { Lead } from "@/types";

interface PipelineTableProps {
  leads: Lead[];
  sortField: string;
  sortOrder: string;
  onSort: (field: string) => void;
}

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
}) {
  const isActive = currentSort === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 group"
    >
      <span>{label}</span>
      <ArrowUpDown
        className={cn(
          "w-3 h-3 transition-colors",
          isActive ? "text-neutral-300" : "text-neutral-700 group-hover:text-neutral-500"
        )}
      />
    </button>
  );
}

export function PipelineTable({ leads, sortField, sortOrder, onSort }: PipelineTableProps) {
  const intentColors: Record<string, string> = {
    buyer: "text-blue-400",
    seller: "text-emerald-400",
    investor: "text-purple-400",
    unknown: "text-neutral-500",
  };

  return (
    <div className="bg-[#111111] border border-neutral-800/50 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-800/50">
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              <SortHeader label="Contact" field="name" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Stage
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Intent
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              <SortHeader label="Score" field="score" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              Source
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              <SortHeader label="Last Contact" field="last_contact_at" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
            </th>
            <th className="text-left text-[10px] font-medium text-neutral-600 uppercase tracking-wider py-3 px-4">
              <SortHeader label="Created" field="created_at" currentSort={sortField} currentOrder={sortOrder} onSort={onSort} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/30">
          {leads.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8">
                <p className="text-sm text-neutral-600">No leads match your filters</p>
              </td>
            </tr>
          ) : (
            leads.map((lead) => (
              <tr
                key={lead.id}
                className="hover:bg-neutral-800/20 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link href={`/dashboard/pipeline/${lead.id}`} className="block">
                    <p className="text-sm font-medium text-neutral-200 hover:text-white transition-colors">
                      {lead.name || "—"}
                    </p>
                    <p className="text-[10px] text-neutral-600">{lead.email}</p>
                  </Link>
                </td>
                <td className="py-3 px-4">
                  <PipelineStageBadge stage={lead.stage || "new"} />
                </td>
                <td className="py-3 px-4">
                  <span className={cn("text-xs font-medium capitalize", intentColors[lead.intent])}>
                    {lead.intent}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-1 rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-neutral-500"
                        style={{ width: `${lead.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-neutral-500">{lead.score}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-neutral-500">{lead.source}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-neutral-500">
                    {lead.last_contact_at ? getRelativeTime(lead.last_contact_at) : "—"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-xs text-neutral-500">
                    {getRelativeTime(lead.created_at)}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
