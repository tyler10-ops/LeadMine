"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CommandCenterPanel } from "@/components/hub/panels/command-center-panel";
import { LeadMachinePanel } from "@/components/hub/panels/lead-machine-panel";
import { AIAssetPanel } from "@/components/hub/panels/ai-asset-panel";
import { IntelligenceAgentPanel } from "@/components/hub/panels/intelligence-agent-panel";
import { LeadsPanel } from "@/components/hub/panels/leads-panel";
import { CavePanel } from "@/components/hub/panels/cave-panel";
import { AutomationsPanel } from "@/components/hub/panels/automations-panel";
import { canAccess } from "@/lib/plan-limits";
import type { Plan } from "@/lib/plan-limits";
import {
  LayoutGrid,
  Zap,
  Bot,
  Brain,
  Pickaxe,
  Users,
  Workflow,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  LogOut,
  Radio,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ── Panel definitions ────────────────────────────────────────────────────────

// Panel order reflects the LeadMine process:
// 1. Command Center (overview) → 2. Lead Machine (mine) → 3. Leads (review) →
// 4. Automations (outreach) → 5. AI Assets (agents) → 6. Intelligence (market) → 7. The Cave (analytics)
const PANELS = [
  { id: "command-center", label: "Command Center", icon: LayoutGrid, shortLabel: "CMD"   },
  { id: "lead-machine",   label: "Lead Machine",   icon: Zap,        shortLabel: "MINE"  },
  { id: "leads",          label: "Leads",          icon: Users,      shortLabel: "LEADS" },
  { id: "automations",    label: "Automations",    icon: Workflow,   shortLabel: "AUTO"  },
  { id: "ai-assets",      label: "AI Assets",      icon: Bot,        shortLabel: "AI"    },
  { id: "intelligence",   label: "Intelligence",   icon: Brain,      shortLabel: "INTEL" },
  { id: "the-cave",       label: "The Cave",       icon: Pickaxe,    shortLabel: "CAVE"  },
] as const;

interface ClientHubProps {
  clientId?: string;
  businessName?: string;
  industry?: string;
  plan?: Plan;
}

export function ClientHub({ clientId, businessName, industry, plan = "free" }: ClientHubProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminMode, setAdminMode]     = useState(false);
  const [isMining, setIsMining]       = useState(false);
  const logoClickCount                = useRef(0);
  const logoClickTimer                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router                        = useRouter();

  useEffect(() => {
    setAdminMode(localStorage.getItem("lm_admin") === "1");
  }, []);

  const handleLogoClick = useCallback(() => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    logoClickTimer.current = setTimeout(() => { logoClickCount.current = 0; }, 600);
    if (logoClickCount.current >= 3) {
      logoClickCount.current = 0;
      setAdminMode((prev) => {
        const next = !prev;
        localStorage.setItem("lm_admin", next ? "1" : "0");
        return next;
      });
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }, [router]);

  const hasLeadMachine  = adminMode || canAccess(plan, "leadMachine");
  const hasAIAgents     = adminMode || canAccess(plan, "aiAgents");
  const hasIntelligence = adminMode || canAccess(plan, "prioritySupport");

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#080808]">

      {/* ── Collapsible Sidebar ── */}
      <aside
        className={cn(
          "flex-shrink-0 flex flex-col h-screen bg-[#0a0a0a] border-r border-white/[0.05] transition-all duration-200 ease-in-out overflow-hidden",
          sidebarOpen ? "w-52" : "w-14"
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center h-[52px] border-b border-white/[0.04] flex-shrink-0", sidebarOpen ? "px-4 gap-1" : "justify-center px-0")}>
          <button
            onClick={handleLogoClick}
            className="relative w-7 h-7 flex items-center justify-center focus:outline-none flex-shrink-0"
          >
            {adminMode
              ? <span className="text-[#FFD60A] text-[14px]">★</span>
              : <img src="/logo.png" alt="LeadMine" className="w-[58px] h-[58px] object-contain" />
            }
          </button>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-neutral-200 tracking-tight truncate">
                {businessName ?? "LeadMine"}
              </p>
              {industry && (
                <p className="text-[9px] text-neutral-600 uppercase tracking-widest truncate">{industry}</p>
              )}
            </div>
          )}
        </div>

        {/* Panel nav */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {PANELS.map((panel, i) => {
            const Icon = panel.icon;
            const isActive = activeIndex === i;
            return (
              <button
                key={panel.id}
                onClick={() => setActiveIndex(i)}
                title={!sidebarOpen ? panel.label : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg transition-all duration-100 group",
                  sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5",
                  isActive
                    ? "bg-[#00FF88]/10 text-[#00FF88]"
                    : "text-neutral-500 hover:text-neutral-200 hover:bg-white/[0.04]"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && (
                  <span className={cn("text-[12px] font-medium truncate", isActive && "font-semibold")}>
                    {panel.label}
                  </span>
                )}
                {isActive && !sidebarOpen && (
                  <span className="absolute left-14 text-[9px] font-bold text-[#00FF88]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Signals + Activity links */}
        <div className="px-2 pb-2">
          <div className="border-t border-white/[0.04] pt-3 space-y-0.5">
            <Link
              href="/dashboard/seller-radar"
              title={!sidebarOpen ? "Signals" : undefined}
              className={cn(
                "flex items-center rounded-lg text-neutral-500 hover:text-[#00FF88] hover:bg-[#00FF88]/[0.06] transition-colors",
                sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5"
              )}
            >
              <Radio className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-[12px] font-medium">Signals</span>}
            </Link>
            <Link
              href="/dashboard/activity"
              title={!sidebarOpen ? "Activity Log" : undefined}
              className={cn(
                "flex items-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors",
                sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5"
              )}
            >
              <Activity className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span className="text-[12px] font-medium">Activity</span>}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] py-3 px-2 space-y-0.5 flex-shrink-0">
          <Link
            href="/dashboard/settings"
            title={!sidebarOpen ? "Settings" : undefined}
            className={cn(
              "flex items-center rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors",
              sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5"
            )}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-[12px]">Settings</span>}
          </Link>
          <button
            onClick={handleSignOut}
            title={!sidebarOpen ? "Sign Out" : undefined}
            className={cn(
              "w-full flex items-center rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors",
              sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-[12px]">Sign Out</span>}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "w-full flex items-center rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors",
              sidebarOpen ? "gap-2.5 px-3 py-2" : "justify-center px-0 py-2.5"
            )}
          >
            {sidebarOpen
              ? <><PanelLeftClose className="w-4 h-4 flex-shrink-0" /><span className="text-[12px]">Collapse</span></>
              : <PanelLeftOpen className="w-4 h-4 flex-shrink-0" />
            }
          </button>
        </div>
      </aside>

      {/* ── Main panel area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-5 h-[52px] border-b border-white/[0.04] bg-[#0a0a0a]/95 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <h2 className="text-[13px] font-semibold text-neutral-200">
              {PANELS[activeIndex].label}
            </h2>
            {adminMode && (
              <span className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ color: "#FFD60A", background: "rgba(255,214,10,0.12)", border: "1px solid rgba(255,214,10,0.25)" }}>
                Admin
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Prev/Next panel */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setActiveIndex((i) => Math.min(PANELS.length - 1, i + 1))}
                disabled={activeIndex === PANELS.length - 1}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.04] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-white/[0.06]" />

            {/* Live status */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FF88]" />
              </span>
              <span className="text-[11px] text-neutral-500">3 Miners Active</span>
            </div>

            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold text-neutral-300"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {businessName?.[0]?.toUpperCase() ?? "L"}
            </div>
          </div>
        </header>

        {/* Panel content — sliding */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex h-full"
            style={{
              width: `${PANELS.length * 100}%`,
              transform: `translateX(-${(activeIndex / PANELS.length) * 100}%)`,
              transition: "transform 180ms cubic-bezier(0.4, 0, 0.2, 1)",
              willChange: "transform",
            }}
          >
            {PANELS.map((panel, i) => (
              <div
                key={panel.id}
                className="h-full overflow-hidden"
                style={{
                  width: `${100 / PANELS.length}%`,
                  transform: activeIndex === i ? "scale(1)" : "scale(0.974)",
                  opacity: activeIndex === i ? 1 : 0.78,
                  transition: "transform 180ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease-out",
                  transformOrigin: "center top",
                  willChange: "transform, opacity",
                }}
              >
                {/* 0: Command Center */}
                {i === 0 && <CommandCenterPanel isActive={activeIndex === 0} realtorSlug={clientId} />}
                {/* 1: Lead Machine — mine leads */}
                {i === 1 && (
                  <LeadMachinePanel
                    isActive={activeIndex === 1}
                    realtorSlug={clientId}
                    onNavigate={setActiveIndex}
                    onMiningChange={setIsMining}
                    plan={plan}
                    isUnlocked={hasLeadMachine}
                  />
                )}
                {/* 2: Leads — review mined leads */}
                {i === 2 && (
                  <LeadsPanel isActive={activeIndex === 2} />
                )}
                {/* 3: Automations — outreach sequences */}
                {i === 3 && (
                  <AutomationsPanel isActive={activeIndex === 3} realtorSlug={clientId} plan={plan} />
                )}
                {/* 4: AI Assets — calling agents */}
                {i === 4 && (
                  <AIAssetPanel
                    isActive={activeIndex === 4}
                    realtorSlug={clientId}
                    plan={plan}
                    isUnlocked={hasAIAgents}
                  />
                )}
                {/* 5: Intelligence — market data */}
                {i === 5 && (
                  <IntelligenceAgentPanel
                    isActive={activeIndex === 5}
                    realtorSlug={clientId}
                    businessName={businessName}
                    plan={plan}
                    isUnlocked={hasIntelligence}
                  />
                )}
                {/* 6: The Cave — analytics */}
                {i === 6 && (
                  <div className="h-full overflow-hidden bg-black relative">
                    <CavePanel plan={plan} isRunning={isMining} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
