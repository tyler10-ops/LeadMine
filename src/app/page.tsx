import Link from "next/link";
import { ArrowRight, Cpu, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { CyclingWord } from "@/components/landing/cycling-word";
import { Gem } from "@/components/ui/gem";
import { GemGrade } from "@/components/ui/gem-grade";
import { MiningProgress } from "@/components/ui/mining-progress";
import { PricingSection } from "@/components/landing/pricing-section";
import { createServerSupabase } from "@/lib/supabase/server";

const GEM = { green: "#00FF88", yellow: "#FFD60A", red: "#FF3B30" };

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Raw Inquiry",
    desc: "Every inbound lead enters as a rough stone — uncut, ungraded, unknown value.",
    icon: "◇",
    accent: "rgba(255,255,255,0.1)",
    border: "rgba(255,255,255,0.06)",
  },
  {
    step: "02",
    title: "AI Filtering",
    desc: "Our AI screens against your criteria — budget, intent, timeline, location.",
    icon: "⬡",
    accent: GEM.yellow,
    border: "rgba(255,214,10,0.15)",
  },
  {
    step: "03",
    title: "Gem Grading",
    desc: "Each lead is graded: Elite Gem, Refined Potential, or Discarded Rock.",
    icon: "◈",
    accent: GEM.green,
    border: "rgba(0,255,136,0.15)",
  },
  {
    step: "04",
    title: "Extraction",
    desc: "Qualified gems are routed to your pipeline — ready for immediate follow-up.",
    icon: "◆",
    accent: GEM.green,
    border: "rgba(0,255,136,0.2)",
  },
];

const LIVE_FEED = [
  { time: "0:12", label: "New raw stone ingested",    color: "#2A2A2A" },
  { time: "0:31", label: "Filtering complete",         color: "#2A2A2A" },
  { time: "0:44", label: "Elite Gem extracted",        color: GEM.green  },
  { time: "1:02", label: "New raw stone ingested",    color: "#2A2A2A" },
  { time: "1:19", label: "Discarded — cracked rock",  color: GEM.red    },
  { time: "1:38", label: "Refined potential flagged", color: GEM.yellow  },
];

export default async function LandingPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen text-neutral-200" style={{ background: "#07070d" }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto relative z-20">
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black text-black"
            style={{ background: `linear-gradient(135deg, ${GEM.green} 0%, #00CC66 100%)`, boxShadow: `0 2px 12px rgba(0,255,136,0.3)` }}
          >
            LM
          </div>
          <div>
            <span className="text-sm font-bold tracking-[0.15em] text-neutral-100 uppercase">Lead</span>
            <span className="text-[10px] font-medium text-neutral-600 tracking-[0.3em] uppercase ml-1.5">MINE</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="#pricing" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
            Pricing
          </Link>
          <Link href="/auth/login" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
            Sign in
          </Link>
          {isAuthenticated ? (
            <Link
              href="/dashboard/hub"
              className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all"
              style={{ background: GEM.green, color: "#000", boxShadow: `0 0 20px rgba(0,255,136,0.25)` }}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>

              <Link
                href="/auth/signup"
                className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all"
                style={{ background: GEM.green, color: "#000", boxShadow: `0 0 20px rgba(0,255,136,0.25)` }}
              >
                Start Mining
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">

        {/* Deep background glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background:
            `radial-gradient(ellipse 70% 60% at 10% 110%, rgba(0,255,136,0.06) 0%, transparent 60%),` +
            `radial-gradient(ellipse 50% 50% at 90% -10%, rgba(255,59,48,0.05) 0%, transparent 55%),` +
            `radial-gradient(ellipse 60% 50% at 50% 100%, rgba(255,214,10,0.025) 0%, transparent 50%)`,
        }} />

        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }} />

        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center py-28">

            {/* Left */}
            <div>
              {/* Status badge */}
              <div className="inline-flex items-center gap-2.5 mb-8 px-3.5 py-1.5 rounded-full border" style={{ borderColor: "rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.04)" }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: GEM.green }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: GEM.green }} />
                </span>
                <span className="text-[11px] font-medium tracking-widest uppercase" style={{ color: GEM.green }}>Mining Active</span>
              </div>

              <h1 className="text-[72px] sm:text-[88px] font-black tracking-tight leading-[0.9] text-neutral-50 -mb-4">
                Mine for<br />
                <CyclingWord />
              </h1>

              <p className="text-lg text-neutral-500 max-w-md leading-relaxed mb-10">
                LeadMine finds, scores, and prioritizes your best real estate leads automatically.
                Mine smarter. Close faster.
              </p>

              <div className="flex gap-3 flex-wrap items-center">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-bold transition-all"
                  style={{ background: GEM.green, color: "#000", boxShadow: `0 0 30px rgba(0,255,136,0.3)` }}
                >
                  Start Mining <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 border px-8 py-4 rounded-xl text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  How It Works
                </Link>
              </div>

              {/* Gem color legend */}
              <div className="flex items-center gap-6 mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {[
                  { color: GEM.green,  label: "Elite Gem" },
                  { color: GEM.yellow, label: "Refined" },
                  { color: GEM.red,    label: "Rock" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    <span className="text-[11px] text-neutral-600 font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — floating gems */}
            <div className="relative hidden lg:block h-[520px]">
              <div
                className="absolute"
                style={{ right: "0px", top: "0px", filter: `drop-shadow(0 0 40px rgba(0,255,136,0.35))`, animation: "gem-float 6s ease-in-out infinite" }}
              >
                <Gem variant="green" size="xl" animated float={false} />
              </div>
              <div
                className="absolute"
                style={{ right: "200px", top: "110px", opacity: 0.85, filter: `drop-shadow(0 0 28px rgba(255,214,10,0.3))`, animation: "gem-float 7.5s ease-in-out infinite", animationDelay: "1.8s" }}
              >
                <Gem variant="yellow" size="lg" animated float={false} />
              </div>
              <div
                className="absolute"
                style={{ right: "300px", bottom: "60px", opacity: 0.65, filter: `drop-shadow(0 0 20px rgba(255,59,48,0.25))`, animation: "gem-float 8s ease-in-out infinite", animationDelay: "0.9s" }}
              >
                <Gem variant="red" size="md" animated float={false} />
              </div>

              {/* Glow pools under gems */}
              <div className="absolute" style={{ right: "40px", top: "160px", width: "220px", height: "220px", background: "radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
              <div className="absolute" style={{ right: "220px", top: "230px", width: "160px", height: "160px", background: "radial-gradient(circle, rgba(255,214,10,0.07) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="border-y" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: "3",    label: "Lead Grade Tiers",      color: GEM.green  },
            { stat: "24/7", label: "Autonomous Mining",     color: GEM.yellow },
            { stat: "Auto", label: "AI Scoring Engine",     color: GEM.green  },
            { stat: "Live", label: "Command Center",        color: GEM.red    },
          ].map(({ stat, label, color }) => (
            <div key={stat}>
              <p className="text-3xl font-black" style={{ color }}>{stat}</p>
              <p className="text-[11px] text-neutral-600 mt-1.5 tracking-widest uppercase">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] mb-3" style={{ color: GEM.yellow }}>The Process</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100">From rough stone<br />to gem.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border p-7 relative overflow-hidden"
                style={{ background: "#0d0d14", borderColor: step.border }}
              >
                <div className="text-3xl mb-5" style={{ color: step.accent }}>{step.icon}</div>
                <p className="text-[10px] font-bold tracking-[0.3em] mb-2.5" style={{ color: step.accent, opacity: 0.5 }}>STEP {step.step}</p>
                <h3 className="text-sm font-bold text-neutral-100 mb-2">{step.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{step.desc}</p>
                {/* Corner number */}
                <div className="absolute top-4 right-5 text-[40px] font-black text-neutral-800/30 leading-none select-none">{step.step}</div>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-xl">
            <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-3">Current Pipeline Phase</p>
            <MiningProgress phase="grading" />
          </div>
        </div>
      </section>

      {/* ── GEM GRADING SYSTEM ── */}
      <section className="py-32 relative" style={{ background: "#0a0a12" }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background:
            `radial-gradient(ellipse 40% 60% at 0% 50%, rgba(0,255,136,0.04) 0%, transparent 60%),` +
            `radial-gradient(ellipse 40% 60% at 100% 50%, rgba(255,59,48,0.04) 0%, transparent 60%)`,
        }} />
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] mb-3" style={{ color: GEM.green }}>Grading System</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100 mb-4">Every lead gets graded.</h2>
            <p className="text-neutral-600 max-w-md mx-auto text-sm leading-relaxed">
              Our AI scores each lead and assigns one of three grades. No ambiguity. No wasted calls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Elite */}
            <div className="rounded-2xl border p-8 relative overflow-hidden" style={{ background: "#0a1a12", borderColor: "rgba(0,255,136,0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GEM.green}, transparent)`, opacity: 0.4 }} />
              <div className="flex items-start justify-between mb-7">
                <Gem variant="green" size="lg" animated />
                <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full" style={{ background: "rgba(0,255,136,0.1)", color: GEM.green }}>GRADE A</span>
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: GEM.green }}>Elite Gem</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-7">
                Fully qualified. Matches all criteria. High intent, verified budget, confirmed timeline.
              </p>
              <ul className="space-y-2.5">
                {["Budget confirmed", "Timeline: 0–90 days", "Criteria match: 90%+"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: GEM.green }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Refined */}
            <div className="rounded-2xl border p-8 relative overflow-hidden" style={{ background: "#141200", borderColor: "rgba(255,214,10,0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GEM.yellow}, transparent)`, opacity: 0.4 }} />
              <div className="flex items-start justify-between mb-7">
                <Gem variant="yellow" size="lg" animated />
                <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full" style={{ background: "rgba(255,214,10,0.1)", color: GEM.yellow }}>GRADE B</span>
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: GEM.yellow }}>Refined Potential</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-7">
                Partially qualified. Promising signals but needs refinement. Enters nurture sequence.
              </p>
              <ul className="space-y-2.5">
                {["Budget: unconfirmed", "Timeline: 90–180 days", "Criteria match: 60–89%"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: GEM.yellow }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rock */}
            <div className="rounded-2xl border p-8 relative overflow-hidden" style={{ background: "#140a08", borderColor: "rgba(255,59,48,0.2)" }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${GEM.red}, transparent)`, opacity: 0.4 }} />
              <div className="flex items-start justify-between mb-7">
                <Gem variant="red" size="lg" animated />
                <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full" style={{ background: "rgba(255,59,48,0.1)", color: GEM.red }}>GRADE C</span>
              </div>
              <h3 className="text-xl font-black mb-2" style={{ color: GEM.red }}>Discarded Rock</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-7">
                Outside criteria. Cracked on contact. Archived automatically — no human time wasted.
              </p>
              <ul className="space-y-2.5">
                {["Outside budget range", "No confirmed timeline", "Criteria match: <60%"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-neutral-500">
                    <XCircle className="w-3.5 h-3.5 shrink-0" style={{ color: GEM.red }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMAND CENTER PREVIEW ── */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-12">
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] mb-3" style={{ color: GEM.green }}>The Platform</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100 mb-4">Your LeadMine Command Center.</h2>
            <p className="text-neutral-600 max-w-lg text-sm leading-relaxed">
              A single terminal. Full pipeline visibility. Real-time lead status across every grade.
            </p>
          </div>

          {/* Terminal */}
          <div className="rounded-2xl border overflow-hidden" style={{
            background: "#0a0a10",
            borderColor: "rgba(255,255,255,0.07)",
            boxShadow: `0 0 0 1px rgba(0,255,136,0.04), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,255,136,0.04)`,
          }}>
            {/* Chrome bar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0d0d14" }}>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: `${GEM.red}99` }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: `${GEM.yellow}99` }} />
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: `${GEM.green}99` }} />
              </div>
              <p className="text-[11px] text-neutral-700 tracking-widest uppercase font-medium">LEADMINE — Command Center</p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: GEM.green }} />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: GEM.green }} />
                </span>
                <span className="text-[10px] text-neutral-600">Mining Active</span>
              </div>
            </div>

            <div className="p-6 grid lg:grid-cols-3 gap-5">
              {/* Lead cards */}
              <div className="lg:col-span-2 space-y-3">
                <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4">Active Leads</p>

                {[
                  { name: "James R. — Buyer",       detail: "Budget $850K · Timeline: 45 days · Phoenix, AZ",         variant: "green"  as const, grade: "elite"   as const, phase: "delivered" as const, bg: "#0a1810", border: "rgba(0,255,136,0.12)" },
                  { name: "Sarah M. — Seller",       detail: "Est. Value $620K · Timeline: 90–120 days · Austin, TX",  variant: "yellow" as const, grade: "refined" as const, phase: "grading"   as const, bg: "#141200", border: "rgba(255,214,10,0.1)"  },
                  { name: "Anonymous Inquiry",       detail: "Budget unconfirmed · No timeline · Outside target area", variant: "red"    as const, grade: "rock"    as const, phase: "filtering" as const, bg: "#140a08", border: "rgba(255,59,48,0.1)"   },
                ].map((lead) => (
                  <div key={lead.name} className="rounded-xl p-4 border flex items-center gap-4" style={{ background: lead.bg, borderColor: lead.border }}>
                    <Gem variant={lead.variant} size="sm" animated />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-neutral-200 truncate">{lead.name}</p>
                        <GemGrade grade={lead.grade} showLabel={false} size="sm" />
                      </div>
                      <p className="text-xs text-neutral-600 truncate">{lead.detail}</p>
                      <MiningProgress phase={lead.phase} className="mt-2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live feed */}
              <div>
                <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4">Live Feed</p>
                <div className="space-y-0">
                  {LIVE_FEED.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <span className="text-[10px] text-neutral-700 font-mono w-8 shrink-0">{entry.time}</span>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: entry.color, boxShadow: entry.color !== "#2A2A2A" ? `0 0 4px ${entry.color}` : "none" }} />
                      <span className="text-[11px] text-neutral-500 truncate">{entry.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3.5">
                  {[
                    { label: "Gems Mined Today", value: "12", color: GEM.green  },
                    { label: "Pending Grading",   value: "4",  color: GEM.yellow },
                    { label: "Discarded Today",   value: "7",  color: GEM.red    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-600">{label}</span>
                      <span className="text-sm font-black" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <PricingSection isAuthenticated={isAuthenticated} />

      {/* ── FUTURE VISION ── */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#09090f" }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-12">
            <div className="flex-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] mb-3" style={{ color: GEM.yellow }}>What&apos;s Coming</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 mb-4">Physical AI Miners.</h2>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-lg">
                The next phase: LeadMine hardware — autonomous AI agents running on dedicated devices.
                Deployed in your office, mining leads 24/7 without cloud dependency.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border px-7 py-5 text-center" style={{ borderColor: "rgba(255,255,255,0.08)", background: "#111118" }}>
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Cpu className="w-4 h-4 text-neutral-600" />
                  <span className="text-[10px] text-neutral-700 uppercase tracking-widest">OpenClaw</span>
                </div>
                <p className="text-xs text-neutral-600">Raspberry Pi 5</p>
                <p className="text-[10px] mt-2.5 font-bold tracking-wider" style={{ color: GEM.yellow }}>Coming Soon</p>
              </div>
              <div className="rounded-2xl border px-7 py-5 text-center" style={{ borderColor: "rgba(0,255,136,0.12)", background: "#0a1810" }}>
                <div className="flex items-center gap-2 justify-center mb-3">
                  <Activity className="w-4 h-4" style={{ color: `${GEM.green}80` }} />
                  <span className="text-[10px] text-neutral-700 uppercase tracking-widest">Remote Status</span>
                </div>
                <p className="text-xs text-neutral-600">Idle / Mining / Offline</p>
                <p className="text-[10px] mt-2.5 font-bold tracking-wider" style={{ color: GEM.green }}>Architecture Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-36 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background:
            `radial-gradient(ellipse 50% 80% at 50% 100%, rgba(0,255,136,0.07) 0%, transparent 60%)`,
        }} />
        <div className="max-w-7xl mx-auto px-8 text-center relative z-10">
          <div className="flex justify-center gap-5 mb-10">
            <Gem variant="red"    size="sm" animated />
            <Gem variant="green"  size="md" animated />
            <Gem variant="yellow" size="sm" animated />
          </div>
          <h2 className="text-5xl sm:text-6xl font-black tracking-tight text-neutral-100 mb-5">
            Your next deal<br />is waiting.
          </h2>
          <p className="text-neutral-600 mb-12 max-w-sm mx-auto text-sm leading-relaxed">
            LeadMine surfaces your best seller and buyer opportunities automatically — before your competition calls them.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2.5 px-12 py-5 rounded-xl text-sm font-black transition-all"
            style={{ background: GEM.green, color: "#000", boxShadow: `0 0 50px rgba(0,255,136,0.35)` }}
          >
            Start Mining <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#07070d" }}>
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[8px] font-black text-black"
              style={{ background: `linear-gradient(135deg, ${GEM.green} 0%, #00CC66 100%)` }}
            >
              LM
            </div>
            <span className="text-xs font-bold tracking-[0.15em] text-neutral-600 uppercase">LEADMINE</span>
          </div>
          <p className="text-xs text-neutral-700">
            &copy; {new Date().getFullYear()} LeadMine. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
