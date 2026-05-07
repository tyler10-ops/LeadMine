import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Clock, XCircle, Zap, Phone, Mail, BarChart3,
  Target, Shield, Activity, Users, TrendingUp, MessageSquare,
} from "lucide-react";
import { Gem } from "@/components/ui/gem";
import { LandingNav } from "@/components/landing/nav";
import { createServerSupabase } from "@/lib/supabase/server";

const GEM = { green: "#00FF88", yellow: "#FFD60A", red: "#FF3B30" };

export const metadata = {
  title: "How LeadMine Works | AI-Powered Real Estate Lead Mining",
  description:
    "LeadMine uses AI agents to find, qualify, and follow up with real estate leads automatically — so realtors close more deals with less effort.",
};

const STEPS = [
  {
    num: "01", title: "Lead Intake", icon: "◇",
    color: "rgba(255,255,255,0.2)", border: "rgba(255,255,255,0.06)", bg: "#0d0d14",
    desc: "Every inbound lead — from Zillow, your website, open houses, or manual entry — flows into LeadMine as a raw stone. Uncut. Unknown value.",
    detail: "LeadMine accepts leads from any source via direct entry or future integrations. Each lead is timestamped, tagged with source, and queued for AI processing the moment it arrives.",
  },
  {
    num: "02", title: "AI Filtering", icon: "⬡",
    color: GEM.yellow, border: "rgba(255,214,10,0.15)", bg: "#14120a",
    desc: "Our AI agent screens every lead against your criteria — budget range, intent signals, timeline, and geographic target area.",
    detail: "The filtering model cross-references what the lead says against behavioral signals. It asks the right questions automatically: Are they pre-approved? What's their timeline? Are they working with another agent?",
  },
  {
    num: "03", title: "Gem Grading", icon: "◈",
    color: GEM.green, border: "rgba(0,255,136,0.15)", bg: "#0a1812",
    desc: "Each lead receives a gem grade — Elite, Refined, or Discarded — based on a scored qualification model.",
    detail: "Grades are assigned instantly. An Elite Gem (Grade A) enters your live pipeline immediately. A Refined lead enters nurture sequences. A cracked rock is archived — no human time wasted.",
  },
  {
    num: "04", title: "Automated Follow-Up", icon: "◆",
    color: GEM.green, border: "rgba(0,255,136,0.18)", bg: "#0a1812",
    desc: "AI agents handle multi-step outreach sequences — calls, emails, and SMS — on your behalf, timed for maximum response rates.",
    detail: "Follow-up sequences are triggered automatically based on lead grade and channel. Calls go out within minutes of intake. If no answer, email and SMS follow. Every interaction is logged.",
  },
  {
    num: "05", title: "Human Handoff", icon: "◉",
    color: GEM.yellow, border: "rgba(255,214,10,0.15)", bg: "#14120a",
    desc: "When a lead is ready to talk, LeadMine flags it and hands off to you with a full summary: grade, history, and recommended next move.",
    detail: "You only talk to leads that are already qualified. The summary tells you their budget, timeline, objections handled so far, and which properties they've expressed interest in.",
  },
];

const AUTOMATIONS = [
  { icon: Phone,         label: "AI Calling",         desc: "Vapi-powered voice agents call leads and qualify them in real time." },
  { icon: Mail,          label: "Email Sequences",     desc: "Personalized email drafts sent via Resend — auto-timed for open rates." },
  { icon: MessageSquare, label: "SMS Follow-Up",       desc: "Twilio SMS sent at optimal windows — follow-ups your leads actually see." },
  { icon: BarChart3,     label: "Market Intelligence", desc: "Weekly price movement, days-on-market, and neighborhood signals delivered to you." },
  { icon: Target,        label: "Lead Scoring",        desc: "Opportunity scores updated in real time as more signals come in." },
  { icon: Zap,           label: "Instant Grading",     desc: "Every new lead graded within seconds — no waiting, no manual sorting." },
];

const WHO_ITS_FOR = [
  { title: "Solo Realtors", desc: "Stop drowning in follow-up. Let LeadMine run your pipeline while you focus on showings and closes." },
  { title: "Small Teams",   desc: "Give each agent a full AI follow-up system without hiring an ISA. Scale output without scaling headcount." },
  { title: "Brokerages",    desc: "Deploy LeadMine across your roster. Centralized pipeline visibility with per-agent performance data." },
];

const GRADES = [
  {
    variant: "green" as const, grade: "A", label: "Elite Gem",
    color: GEM.green, bg: "#0a1812", border: "rgba(0,255,136,0.2)",
    criteria: ["Budget confirmed", "Timeline: 0–90 days", "Criteria match: 90%+", "High intent signals"],
    outcome: "Enters live pipeline immediately. Realtor notified.",
  },
  {
    variant: "yellow" as const, grade: "B", label: "Refined Potential",
    color: GEM.yellow, bg: "#14120a", border: "rgba(255,214,10,0.18)",
    criteria: ["Budget unconfirmed", "Timeline: 90–180 days", "Criteria match: 60–89%", "Moderate intent"],
    outcome: "Enters nurture sequence. Re-scored over time.",
  },
  {
    variant: "red" as const, grade: "C", label: "Discarded Rock",
    color: GEM.red, bg: "#140a08", border: "rgba(255,59,48,0.18)",
    criteria: ["Outside budget range", "No confirmed timeline", "Criteria match: <60%", "Mismatched area"],
    outcome: "Archived automatically. No human time wasted.",
  },
];

export default async function AboutPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen text-neutral-200" style={{ background: "#07070d" }}>
      <LandingNav isAuthenticated={isAuthenticated} />

      {/* HERO */}
      <section className="relative overflow-hidden py-28 sm:py-36">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,255,136,0.06) 0%, transparent 65%)",
        }} />
        <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] mb-4" style={{ color: GEM.green }}>
            How LeadMine Works
          </p>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-100 mb-6 leading-[1.05]">
            Your AI mining crew,<br />working 24/7.
          </h1>
          <p className="text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed mb-10">
            LeadMine replaces the manual grind of lead follow-up with a full AI pipeline — from raw inquiry
            to qualified appointment — so you spend your time closing, not chasing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: GEM.green, color: "#000", boxShadow: "0 0 28px rgba(0,255,136,0.25)" }}
            >
              Start Mining Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm border text-neutral-300 hover:text-white transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
            >
              See a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: GEM.red }}>The Problem</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 mb-5">
                Most leads go cold<br />before you call back.
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                Studies show 78% of customers buy from the first agent who responds. Yet most realtors take
                hours — or days — to follow up. By then, the gem is gone.
              </p>
              <p className="text-sm text-neutral-500 leading-relaxed">
                LeadMine contacts every lead within minutes of intake, qualifies them automatically, and keeps
                following up until they respond — so you never lose a gem to slow follow-up again.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Average realtor follow-up time",   value: "7.5 hrs", bad: true  },
                { label: "Leads that never get called back", value: "48%",     bad: true  },
                { label: "LeadMine first contact time",      value: "< 2 min", bad: false },
                { label: "Follow-up steps per lead",         value: "Auto",    bad: false },
              ].map(({ label, value, bad }) => (
                <div key={label} className="flex items-center justify-between rounded-xl px-5 py-4 border" style={{
                  background: bad ? "#140a08" : "#0a1812",
                  borderColor: bad ? "rgba(255,59,48,0.12)" : "rgba(0,255,136,0.12)",
                }}>
                  <span className="text-sm text-neutral-400">{label}</span>
                  <span className="text-sm font-black" style={{ color: bad ? GEM.red : GEM.green }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE STEPS */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0a12" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: GEM.yellow }}>The Pipeline</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100">Five stages. Fully automated.</h2>
          </div>
          <div className="space-y-4">
            {STEPS.map((step) => (
              <div key={step.num} className="rounded-2xl border p-6 sm:p-8 relative overflow-hidden" style={{ background: step.bg, borderColor: step.border }}>
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-start gap-4 sm:w-64 shrink-0">
                    <div className="text-2xl" style={{ color: step.color }}>{step.icon}</div>
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.3em] mb-1" style={{ color: step.color, opacity: 0.6 }}>STEP {step.num}</p>
                      <h3 className="text-base font-black text-neutral-100">{step.title}</h3>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-neutral-300 mb-2">{step.desc}</p>
                    <p className="text-xs text-neutral-600 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-6 text-[52px] font-black leading-none select-none" style={{ color: "rgba(255,255,255,0.03)" }}>{step.num}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GEM GRADING */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: GEM.green }}>Grading System</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 mb-3">Every lead gets a grade.</h2>
            <p className="text-sm text-neutral-500 max-w-lg mx-auto">No ambiguity. No gut-feel. Each lead exits with an objective score and a clear next action.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {GRADES.map((g) => (
              <div key={g.grade} className="rounded-2xl border p-7 relative overflow-hidden flex flex-col" style={{ background: g.bg, borderColor: g.border }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${g.color}, transparent)`, opacity: 0.35 }} />
                <div className="flex items-start justify-between mb-6">
                  <Gem variant={g.variant} size="lg" animated />
                  <span className="text-[10px] font-bold tracking-widest px-3 py-1.5 rounded-full" style={{ background: `${g.color}18`, color: g.color }}>GRADE {g.grade}</span>
                </div>
                <h3 className="text-lg font-black mb-2" style={{ color: g.color }}>{g.label}</h3>
                <ul className="space-y-2 mb-5 flex-1">
                  {g.criteria.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-xs text-neutral-500">
                      {g.variant === "green"  && <CheckCircle2 size={13} style={{ color: g.color }} className="shrink-0" />}
                      {g.variant === "yellow" && <Clock        size={13} style={{ color: g.color }} className="shrink-0" />}
                      {g.variant === "red"    && <XCircle      size={13} style={{ color: g.color }} className="shrink-0" />}
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t text-xs text-neutral-600 leading-relaxed" style={{ borderColor: `${g.color}18` }}>
                  <span className="font-semibold" style={{ color: g.color }}>Outcome: </span>{g.outcome}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AUTOMATION STACK */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0a12" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: GEM.green }}>Automation Stack</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100 mb-3">Six AI agents working in parallel.</h2>
            <p className="text-sm text-neutral-500 max-w-lg mx-auto">Each automation runs independently — together they cover every touchpoint in the sales cycle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AUTOMATIONS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border p-6" style={{ background: "#0d0d18", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(0,255,136,0.08)" }}>
                  <Icon size={17} style={{ color: GEM.green }} />
                </div>
                <h3 className="text-sm font-bold text-neutral-100 mb-2">{label}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-24 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: GEM.yellow }}>Who It&apos;s For</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-100">Built for agents who close.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {WHO_ITS_FOR.map(({ title, desc }) => (
              <div key={title} className="rounded-2xl border p-7" style={{ background: "#0d0d18", borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(255,214,10,0.08)" }}>
                  <Users size={15} style={{ color: GEM.yellow }} />
                </div>
                <h3 className="text-sm font-bold text-neutral-100 mb-2">{title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS STRIP */}
      <section className="py-20 border-t" style={{ borderColor: "rgba(255,255,255,0.05)", background: "#0a0a12" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: TrendingUp, value: "< 2 min", label: "First contact time",   color: GEM.green  },
              { icon: Shield,     value: "100%",     label: "Leads followed up",    color: GEM.green  },
              { icon: Target,     value: "3×",       label: "More qualified appts", color: GEM.yellow },
              { icon: Activity,   value: "24/7",     label: "Mining — no days off", color: GEM.green  },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="rounded-2xl border p-6 text-center" style={{ background: "#0d0d18", borderColor: "rgba(255,255,255,0.06)" }}>
                <Icon size={20} className="mx-auto mb-3" style={{ color }} />
                <div className="text-3xl font-black mb-1" style={{ color }}>{value}</div>
                <div className="text-xs text-neutral-600">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 55% 70% at 50% 100%, rgba(0,255,136,0.07) 0%, transparent 60%)",
        }} />
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-100 mb-5">Ready to mine?</h2>
          <p className="text-sm text-neutral-500 mb-10 leading-relaxed">
            Start free. No credit card required. Your first AI miner is active in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm transition-all"
              style={{ background: GEM.green, color: "#000", boxShadow: "0 0 32px rgba(0,255,136,0.3)" }}
            >
              Start Mining Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm border text-neutral-300 hover:text-white transition-colors"
              style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="LeadMine" className="w-7 h-7 object-contain" />
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase">LeadMine</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">Home</Link>
            <Link href="/about" className="text-xs text-neutral-400">How It Works</Link>
            <Link href="/#pricing" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">Pricing</Link>
            <Link href="/auth/login" className="text-xs text-neutral-700 hover:text-neutral-400 transition-colors">Sign In</Link>
          </div>
          <p className="text-xs text-neutral-800">© 2026 LeadMine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
