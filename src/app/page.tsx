import Link from "next/link";
import { ArrowRight, Cpu, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Gem } from "@/components/ui/gem";
import { GemGrade } from "@/components/ui/gem-grade";
import { MiningProgress } from "@/components/ui/mining-progress";

// ── Static dust particle data (pure CSS animation — no JS) ──
const DUST = [
  { left: "10%", top: "88%", w: 2,   dur: 8,    delay: 0   },
  { left: "22%", top: "75%", w: 1.5, dur: 10.5, delay: 2.5 },
  { left: "37%", top: "91%", w: 1,   dur: 7,    delay: 1   },
  { left: "51%", top: "82%", w: 2,   dur: 9,    delay: 4   },
  { left: "63%", top: "94%", w: 1.5, dur: 11,   delay: 0.8 },
  { left: "74%", top: "78%", w: 1,   dur: 8.5,  delay: 3   },
  { left: "84%", top: "86%", w: 2,   dur: 10,   delay: 1.8 },
  { left: "91%", top: "73%", w: 1.5, dur: 7.5,  delay: 5   },
];

// ── Mining workflow steps ──
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Raw Inquiry",
    desc: "Every inbound lead enters as a rough stone — uncut, ungraded, unknown value.",
    icon: "◇",
    color: "text-neutral-500",
    border: "border-neutral-800",
  },
  {
    step: "02",
    title: "AI Filtering",
    desc: "Our AI screens against your criteria — budget, intent, timeline, location.",
    icon: "⬡",
    color: "text-[#FFD60A]",
    border: "border-[#FFD60A]/20",
  },
  {
    step: "03",
    title: "Gem Grading",
    desc: "Each lead is graded: Elite Gem, Refined Potential, or Discarded Rock.",
    icon: "◈",
    color: "text-[#00FF88]",
    border: "border-[#00FF88]/20",
  },
  {
    step: "04",
    title: "Extraction & Delivery",
    desc: "Qualified gems are routed to your pipeline — ready for immediate follow-up.",
    icon: "◆",
    color: "text-[#00FF88]",
    border: "border-[#00FF88]/30",
  },
];

// ── Mock live mining feed entries ──
const LIVE_FEED = [
  { time: "0:12",  label: "New raw stone ingested",     grade: "pending" as const },
  { time: "0:31",  label: "Filtering complete",          grade: "pending" as const },
  { time: "0:44",  label: "Elite Gem extracted",         grade: "elite"   as const },
  { time: "1:02",  label: "New raw stone ingested",     grade: "pending" as const },
  { time: "1:19",  label: "Discarded — cracked rock",   grade: "reject"  as const },
  { time: "1:38",  label: "Refined potential flagged",  grade: "strong"  as const },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200">

      {/* ════════════════════════════════ NAV ════════════════════════════════ */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto relative z-20">
        <Link href="/" className="block group">
          <span className="text-sm font-bold tracking-[0.12em] text-neutral-100 uppercase">
            GEM
          </span>
          <span className="text-[10px] font-medium text-neutral-600 tracking-[0.3em] uppercase ml-2">
            MINE
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm bg-[#00FF88] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#33FFAA] transition-colors"
          >
            Start Mining
          </Link>
        </div>
      </nav>

      {/* ════════════════════════════════ HERO ════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">

        {/* Cave depth background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 70% at 0% 100%, rgba(28,20,14,0.7) 0%, transparent 65%)," +
              "radial-gradient(ellipse 40% 55% at 100% 0%, rgba(14,10,28,0.6) 0%, transparent 60%)," +
              "radial-gradient(ellipse 60% 40% at 70% 50%, rgba(0,255,136,0.025) 0%, transparent 70%)",
          }}
        />

        {/* Ambient gem glow spill on cave surface */}
        <div
          className="absolute pointer-events-none"
          style={{
            right: "0",
            top: "5%",
            width: "55%",
            height: "90%",
            background:
              "radial-gradient(ellipse 60% 55% at 75% 30%, rgba(0,255,136,0.055) 0%, transparent 65%)," +
              "radial-gradient(ellipse 45% 40% at 45% 70%, rgba(255,59,48,0.04) 0%, transparent 55%)," +
              "radial-gradient(ellipse 50% 45% at 60% 55%, rgba(255,214,10,0.03) 0%, transparent 60%)",
          }}
        />

        {/* Dust particles (CSS only) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {DUST.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full dust-particle"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.w}px`,
                height: `${p.w}px`,
                background: "rgba(200,185,155,0.45)",
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center py-24">

            {/* ── Left: Text + CTA ── */}
            <div>
              <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-[0.28em] mb-5">
                Lead Mining Command Center
              </p>

              <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-[1.0] text-neutral-50 mb-6">
                Mine
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #00FF88 0%, #33FFB0 40%, #00CC66 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Hot Gems.
                </span>
              </h1>

              <p className="text-lg text-neutral-500 max-w-md leading-relaxed mb-10">
                AI-powered lead mining for operators who demand precision.
                Raw inquiries enter as rough stone. Only gems come out.
              </p>

              <div className="flex gap-3 flex-wrap">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center gap-2 bg-[#00FF88] text-black px-7 py-3.5 rounded-lg text-sm font-bold hover:bg-[#33FFAA] transition-colors"
                >
                  Start Mining <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 border border-neutral-800 text-neutral-400 px-7 py-3.5 rounded-lg text-sm font-medium hover:border-neutral-600 hover:text-neutral-200 transition-colors"
                >
                  How It Works
                </Link>
              </div>
            </div>

            {/* ── Right: Gems at depth ── */}
            <div className="relative hidden lg:block h-[500px]">
              {/* Green gem — foreground, large */}
              <div
                className="absolute gem-float"
                style={{ right: "0px", top: "20px", animationDelay: "0s" }}
              >
                <Gem variant="green" size="xl" animated float={false} />
              </div>

              {/* Yellow gem — mid-ground */}
              <div
                className="absolute gem-float"
                style={{
                  right: "180px",
                  top: "120px",
                  animationDelay: "1.8s",
                  opacity: 0.82,
                }}
              >
                <Gem variant="yellow" size="lg" animated float={false} />
              </div>

              {/* Red gem — background, distant */}
              <div
                className="absolute gem-float"
                style={{
                  right: "260px",
                  bottom: "40px",
                  animationDelay: "0.9s",
                  opacity: 0.6,
                  transform: "scale(0.78)",
                  transformOrigin: "bottom right",
                }}
              >
                <Gem variant="red" size="md" animated float={false} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ STATS STRIP ════════════════════════════ */}
      <section
        className="border-y py-8"
        style={{ borderColor: "#1A1A1A" }}
      >
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: "3",      label: "Gem Grade Tiers" },
            { stat: "24/7",   label: "Autonomous Mining" },
            { stat: "Auto",   label: "Qualification Engine" },
            { stat: "Live",   label: "Command Center" },
          ].map(({ stat, label }) => (
            <div key={stat}>
              <p className="text-2xl font-bold text-neutral-100">{stat}</p>
              <p className="text-xs text-neutral-600 mt-1 tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ HOW MINING WORKS ════════════════════════ */}
      <section id="how-it-works" className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-[0.28em] mb-3">
              The Process
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
              From rough stone to gem.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.step}
                className={`rounded-xl border p-6 bg-[#111] transition-colors ${step.border}`}
              >
                <div className={`text-2xl mb-4 ${step.color}`}>{step.icon}</div>
                <p className="text-[10px] text-neutral-700 font-medium tracking-widest mb-2">
                  STEP {step.step}
                </p>
                <h3 className="text-sm font-semibold text-neutral-200 mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Mining pipeline progress indicator */}
          <div className="mt-12 max-w-2xl">
            <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4">
              Current Pipeline Phase
            </p>
            <MiningProgress phase="grading" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════ GEM GRADING SYSTEM ═══════════════════════ */}
      <section
        className="py-28"
        style={{ background: "#0D0D0D", borderTop: "1px solid #1A1A1A", borderBottom: "1px solid #1A1A1A" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-[0.28em] mb-3">
              Grading System
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
              Every lead gets graded.
            </h2>
            <p className="text-neutral-500 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
              Our AI scores each lead against your criteria and assigns one of three grades.
              No ambiguity. No wasted calls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Grade A — Elite Gem */}
            <div
              className="rounded-xl p-8 border"
              style={{ background: "#0E1A14", borderColor: "rgba(0,255,136,0.18)" }}
            >
              <div className="flex items-start justify-between mb-6">
                <Gem variant="green" size="lg" animated />
                <span
                  className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(0,255,136,0.1)", color: "#00FF88" }}
                >
                  GRADE A
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#00FF88] mb-2">Elite Gem</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                Fully qualified. Matches all criteria. High intent, verified budget,
                confirmed timeline. Route immediately.
              </p>
              <ul className="space-y-2">
                {["Budget confirmed", "Timeline: 0–90 days", "Criteria match: 90%+"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-neutral-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FF88] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Grade B — Refined Potential */}
            <div
              className="rounded-xl p-8 border"
              style={{ background: "#181400", borderColor: "rgba(255,214,10,0.18)" }}
            >
              <div className="flex items-start justify-between mb-6">
                <Gem variant="yellow" size="lg" animated />
                <span
                  className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,214,10,0.1)", color: "#FFD60A" }}
                >
                  GRADE B
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#FFD60A] mb-2">Refined Potential</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                Partially qualified. Promising signals but needs refinement.
                Enters nurture sequence for follow-up.
              </p>
              <ul className="space-y-2">
                {["Budget: unconfirmed", "Timeline: 90–180 days", "Criteria match: 60–89%"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-neutral-500">
                    <Clock className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Grade C — Discarded Rock */}
            <div
              className="rounded-xl p-8 border"
              style={{ background: "#180A08", borderColor: "rgba(255,59,48,0.18)" }}
            >
              <div className="flex items-start justify-between mb-6">
                <Gem variant="red" size="lg" animated />
                <span
                  className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
                >
                  GRADE C
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#FF3B30] mb-2">Discarded Rock</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                Outside criteria. Cracked on contact. Archived automatically — no
                human time wasted.
              </p>
              <ul className="space-y-2">
                {["Outside budget range", "No confirmed timeline", "Criteria match: &lt;60%"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-neutral-500">
                    <XCircle className="w-3.5 h-3.5 text-[#FF3B30] shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ COMMAND CENTER PREVIEW ══════════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-[11px] font-medium text-neutral-600 uppercase tracking-[0.28em] mb-3">
              The Platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-100">
              Your Mining Command Center.
            </h2>
            <p className="text-neutral-500 mt-4 max-w-lg text-sm leading-relaxed">
              A single terminal. Full pipeline visibility. Real-time lead status across
              every grade.
            </p>
          </div>

          {/* Mock terminal UI */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "#0C0C0C",
              borderColor: "#1A1A1A",
              boxShadow:
                "0 0 0 1px rgba(0,255,136,0.04), 0 24px 60px rgba(0,0,0,0.6)",
            }}
          >
            {/* Terminal chrome bar */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: "#1A1A1A", background: "#0E0E0E" }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFD60A]/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FF88]/60" />
              </div>
              <p className="text-[11px] text-neutral-700 tracking-widest uppercase font-medium">
                GEM MINE — Command Center
              </p>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FF88]" />
                </span>
                <span className="text-[10px] text-neutral-600">Mining Active</span>
              </div>
            </div>

            <div className="p-6 grid lg:grid-cols-3 gap-5">
              {/* Gem Cards */}
              <div className="lg:col-span-2 space-y-3">
                <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4">
                  Active Leads
                </p>

                {/* Elite gem card */}
                <div
                  className="rounded-xl p-4 border flex items-center gap-4"
                  style={{ background: "#0E1A14", borderColor: "rgba(0,255,136,0.15)" }}
                >
                  <Gem variant="green" size="sm" animated />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-neutral-200 truncate">
                        James R. — Buyer
                      </p>
                      <GemGrade grade="elite" showLabel={false} size="sm" />
                    </div>
                    <p className="text-xs text-neutral-600 truncate">
                      Budget $850K · Timeline: 45 days · Phoenix, AZ
                    </p>
                    <MiningProgress phase="delivered" className="mt-2" />
                  </div>
                </div>

                {/* Potential gem card */}
                <div
                  className="rounded-xl p-4 border flex items-center gap-4"
                  style={{ background: "#181400", borderColor: "rgba(255,214,10,0.12)" }}
                >
                  <Gem variant="yellow" size="sm" animated />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-neutral-200 truncate">
                        Sarah M. — Seller
                      </p>
                      <GemGrade grade="strong" showLabel={false} size="sm" />
                    </div>
                    <p className="text-xs text-neutral-600 truncate">
                      Est. Value $620K · Timeline: 90–120 days · Austin, TX
                    </p>
                    <MiningProgress phase="grading" className="mt-2" />
                  </div>
                </div>

                {/* Cracked rock card */}
                <div
                  className="rounded-xl p-4 border flex items-center gap-4"
                  style={{ background: "#130808", borderColor: "rgba(255,59,48,0.1)" }}
                >
                  <Gem variant="red" size="sm" animated />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-neutral-500 truncate">
                        Anonymous Inquiry
                      </p>
                      <GemGrade grade="weak" showLabel={false} size="sm" />
                    </div>
                    <p className="text-xs text-neutral-700 truncate">
                      Budget unconfirmed · No timeline · Outside target area
                    </p>
                    <MiningProgress phase="filtering" className="mt-2" />
                  </div>
                </div>
              </div>

              {/* Live Mining Feed */}
              <div>
                <p className="text-[10px] text-neutral-700 uppercase tracking-widest mb-4">
                  Live Feed
                </p>
                <div className="space-y-2">
                  {LIVE_FEED.map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 py-2 border-b"
                      style={{ borderColor: "#161616" }}
                    >
                      <span className="text-[10px] text-neutral-700 font-mono w-8 shrink-0">
                        {entry.time}
                      </span>
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          background:
                            entry.grade === "elite"
                              ? "#00FF88"
                              : entry.grade === "strong"
                              ? "#FFD60A"
                              : entry.grade === "reject"
                              ? "#FF3B30"
                              : "#2A2A2A",
                        }}
                      />
                      <span className="text-[11px] text-neutral-500 truncate">
                        {entry.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Mining metrics */}
                <div className="mt-6 space-y-3">
                  {[
                    { label: "Gems Mined Today",  value: "12",  color: "#00FF88" },
                    { label: "Pending Grading",    value: "4",   color: "#FFD60A" },
                    { label: "Discarded Today",    value: "7",   color: "#FF3B30" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[11px] text-neutral-600">{label}</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FUTURE VISION ════════════════════════ */}
      <section
        className="py-24 border-t"
        style={{ borderColor: "#1A1A1A", background: "#0D0D0D" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10">
            <div className="flex-1">
              <p className="text-[11px] font-medium text-neutral-700 uppercase tracking-[0.28em] mb-3">
                What&apos;s Coming
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 mb-4">
                Physical AI Miners.
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-lg">
                The next phase: OpenClaw — autonomous AI mining agents running on dedicated
                hardware. Deployed in your operation, mining leads 24/7 without cloud
                dependency. Currently in development.
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div
                className="rounded-xl border px-6 py-4 text-center"
                style={{ borderColor: "#2A2A2A", background: "#111" }}
              >
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Cpu className="w-4 h-4 text-neutral-600" />
                  <span className="text-[10px] text-neutral-700 uppercase tracking-widest">
                    OpenClaw
                  </span>
                </div>
                <p className="text-xs text-neutral-600">Raspberry Pi 5</p>
                <p
                  className="text-[10px] mt-2 font-medium tracking-wider"
                  style={{ color: "#FFD60A" }}
                >
                  Coming Soon
                </p>
              </div>
              <div
                className="rounded-xl border px-6 py-4 text-center"
                style={{ borderColor: "#1A2A1A", background: "#0E1A10" }}
              >
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Activity className="w-4 h-4 text-[#00FF88]/60" />
                  <span className="text-[10px] text-neutral-600 uppercase tracking-widest">
                    Remote Status
                  </span>
                </div>
                <p className="text-xs text-neutral-600">Idle / Mining / Offline</p>
                <p
                  className="text-[10px] mt-2 font-medium tracking-wider"
                  style={{ color: "#00FF88" }}
                >
                  Architecture Ready
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════ CTA ══════════════════════════════ */}
      <section className="py-28">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center gap-4 mb-8">
            <Gem variant="green"  size="sm" animated />
            <Gem variant="yellow" size="sm" animated />
            <Gem variant="red"    size="sm" animated />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-100 mb-4">
            Your next gem is waiting.
          </h2>
          <p className="text-neutral-500 mb-10 max-w-sm mx-auto text-sm leading-relaxed">
            Start mining. Every inquiry that enters raw comes out graded —
            or gets discarded automatically.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-[#00FF88] text-black px-10 py-4 rounded-lg text-sm font-bold hover:bg-[#33FFAA] transition-colors"
          >
            Start Mining <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════ FOOTER ══════════════════════════ */}
      <footer
        className="border-t py-8"
        style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="block">
            <span className="text-sm font-bold tracking-[0.12em] text-neutral-400 uppercase">
              GEM
            </span>
            <span className="text-[10px] font-medium text-neutral-700 tracking-[0.3em] uppercase ml-2">
              MINE
            </span>
          </Link>
          <p className="text-xs text-neutral-700">
            &copy; {new Date().getFullYear()} Gem Mine. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
