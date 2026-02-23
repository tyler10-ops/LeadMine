"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { LeadQualification } from "@/types";

interface QualificationFormProps {
  qualification: LeadQualification;
  onSave: (q: LeadQualification) => void;
  disabled?: boolean;
}

export function QualificationForm({ qualification, onSave, disabled }: QualificationFormProps) {
  const [q, setQ] = useState<LeadQualification>(qualification);
  const [dirty, setDirty] = useState(false);

  const update = (updates: Partial<LeadQualification>) => {
    setQ((prev) => ({ ...prev, ...updates }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(q);
    setDirty(false);
  };

  const urgencyOptions = ["hot", "warm", "cold"] as const;
  const urgencyColors = {
    hot: "bg-red-500/15 text-red-400 border-red-500/30",
    warm: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    cold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          Qualification
        </h3>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={disabled}
            className="px-3 py-1 text-[10px] font-medium bg-neutral-800 text-neutral-200 rounded-md hover:bg-neutral-700 transition-colors"
          >
            Save
          </button>
        )}
      </div>

      {/* Budget Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
            Budget Min
          </label>
          <input
            type="number"
            value={q.budget_min || ""}
            onChange={(e) => update({ budget_min: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="$0"
            disabled={disabled}
            className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-neutral-700 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
            Budget Max
          </label>
          <input
            type="number"
            value={q.budget_max || ""}
            onChange={(e) => update({ budget_max: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="$0"
            disabled={disabled}
            className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-neutral-700 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Timeline */}
      <div>
        <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
          Timeline
        </label>
        <select
          value={q.timeline || ""}
          onChange={(e) => update({ timeline: e.target.value || undefined })}
          disabled={disabled}
          className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:border-neutral-700 focus:outline-none transition-colors"
        >
          <option value="">Select timeline</option>
          <option value="immediately">Immediately</option>
          <option value="1-3 months">1-3 months</option>
          <option value="3-6 months">3-6 months</option>
          <option value="6-12 months">6-12 months</option>
          <option value="12+ months">12+ months</option>
          <option value="just browsing">Just browsing</option>
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
          Property Type
        </label>
        <select
          value={q.property_type || ""}
          onChange={(e) => update({ property_type: e.target.value || undefined })}
          disabled={disabled}
          className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:border-neutral-700 focus:outline-none transition-colors"
        >
          <option value="">Select type</option>
          <option value="single_family">Single Family</option>
          <option value="condo">Condo</option>
          <option value="townhouse">Townhouse</option>
          <option value="multi_family">Multi-Family</option>
          <option value="land">Land</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
          Urgency
        </label>
        <div className="flex gap-2">
          {urgencyOptions.map((u) => (
            <button
              key={u}
              onClick={() => update({ urgency: u })}
              disabled={disabled}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                q.urgency === u
                  ? urgencyColors[u]
                  : "bg-[#0d0d0d] border-neutral-800/30 text-neutral-600 hover:text-neutral-400"
              )}
            >
              {u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Pre-approved */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#0d0d0d] border border-neutral-800/30">
        <span className="text-sm text-neutral-400">Pre-approved</span>
        <button
          onClick={() => update({ pre_approved: !q.pre_approved })}
          disabled={disabled}
          className={cn(
            "relative w-10 h-5 rounded-full transition-colors",
            q.pre_approved ? "bg-emerald-500" : "bg-neutral-700"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
              q.pre_approved && "translate-x-5"
            )}
          />
        </button>
      </div>

      {/* Locations */}
      <div>
        <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
          Locations
        </label>
        <input
          type="text"
          value={(q.locations || []).join(", ")}
          onChange={(e) =>
            update({
              locations: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="Comma-separated locations"
          disabled={disabled}
          className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-neutral-700 focus:outline-none transition-colors"
        />
      </div>

      {/* Motivation */}
      <div>
        <label className="text-[10px] text-neutral-600 uppercase tracking-wider block mb-1">
          Motivation / Notes
        </label>
        <textarea
          value={q.motivation || ""}
          onChange={(e) => update({ motivation: e.target.value || undefined })}
          placeholder="What's driving this lead?"
          disabled={disabled}
          rows={2}
          className="w-full bg-[#0d0d0d] border border-neutral-800/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-neutral-700 focus:outline-none transition-colors resize-none"
        />
      </div>
    </div>
  );
}
