"use client";

import { cn } from "@/lib/utils";

interface FeatureToggleProps {
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function FeatureToggle({
  label,
  description,
  enabled,
  onChange,
  disabled = false,
}: FeatureToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        enabled
          ? "bg-neutral-800/20 border-neutral-700/50"
          : "bg-[#0d0d0d] border-neutral-800/30"
      )}
    >
      <div>
        <p className="text-sm text-neutral-300 font-medium">{label}</p>
        {description && (
          <p className="text-xs text-neutral-600 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={cn(
          "relative w-10 h-5 rounded-full transition-colors",
          enabled ? "bg-emerald-500" : "bg-neutral-700",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
            enabled && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
