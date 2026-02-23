"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CommandCenterPanel } from "@/components/hub/panels/command-center-panel";
import { LeadMachinePanel } from "@/components/hub/panels/lead-machine-panel";
import { AIAssetPanel } from "@/components/hub/panels/ai-asset-panel";

const TABS = [
  { id: "command-center", label: "Command Center" },
  { id: "lead-machine", label: "Lead Machine" },
  { id: "ai-assets", label: "AI Assets" },
] as const;

interface ClientHubProps {
  realtorName?: string;
  realtorSlug?: string;
  realtorCity?: string;
}

export function ClientHub({ realtorName, realtorSlug, realtorCity }: ClientHubProps) {
  const [activeIndex, setActiveIndex] = useState(1); // Lead Machine default

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#08080f]">
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 h-[52px] border-b border-white/[0.04] bg-[#08080f]/98 backdrop-blur-md z-50">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #00FF88 0%, #00CC66 100%)", boxShadow: "0 2px 8px rgba(0,255,136,0.25)" }}>
            <span className="text-black text-[9px] font-bold tracking-widest">GM</span>
          </div>
          <span className="text-[13px] font-semibold text-neutral-300 tracking-tight">
            {realtorName ?? "Gem Mine"}
          </span>
          {realtorCity && (
            <span className="text-[11px] text-neutral-600 font-normal">&middot; {realtorCity}</span>
          )}
        </div>

        {/* ── Tab Navigation ── */}
        <nav
          className="flex items-center gap-0.5 rounded-2xl p-1"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.055)",
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative px-5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all duration-300 cursor-pointer select-none",
                activeIndex === i
                  ? "text-white"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
              style={
                activeIndex === i
                  ? {
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 1px 8px rgba(0,0,0,0.4)",
                    }
                  : { border: "1px solid transparent" }
              }
            >
              {tab.label}
              {activeIndex === i && (
                <span className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-[#00FF88]/70" />
              )}
            </button>
          ))}
        </nav>

        {/* System status */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FF88]" />
            </span>
            <span className="text-[11px] text-neutral-500 font-medium tracking-tight">
              3 Miners Active
            </span>
          </div>
          <div className="h-3.5 w-px bg-neutral-800" />
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-semibold text-neutral-300"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {realtorName?.[0]?.toUpperCase() ?? "R"}
          </div>
        </div>
      </header>

      {/* ── Sliding Panels ── */}
      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${TABS.length * 100}%`,
            transform: `translateX(-${(activeIndex / TABS.length) * 100}%)`,
            transition: "transform 430ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {TABS.map((tab, i) => (
            <div
              key={tab.id}
              className="h-full overflow-hidden"
              style={{
                width: `${100 / TABS.length}%`,
                transform: activeIndex === i ? "scale(1)" : "scale(0.974)",
                opacity: activeIndex === i ? 1 : 0.78,
                transition:
                  "transform 430ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease-out",
                transformOrigin: "center top",
                willChange: "transform, opacity",
              }}
            >
              {i === 0 && (
                <CommandCenterPanel isActive={activeIndex === 0} realtorSlug={realtorSlug} />
              )}
              {i === 1 && (
                <LeadMachinePanel isActive={activeIndex === 1} realtorSlug={realtorSlug} />
              )}
              {i === 2 && (
                <AIAssetPanel isActive={activeIndex === 2} realtorSlug={realtorSlug} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
