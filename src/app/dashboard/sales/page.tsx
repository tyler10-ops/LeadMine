"use client";

import { useState, useEffect, useCallback } from "react";
import { GEM, GLOW } from "@/lib/cave-theme";
import { CreativeMachine } from "@/components/hub/panels/creative-machine";

const STAGES = ["discovered","emailed","replied","demo_booked","trial","paid","dead"] as const;
type Stage = typeof STAGES[number];

const STAGE_META: Record<Stage, { label: string; color: string; glow: string }> = {
  discovered:  { label: "Discovered",  color: "#444",       glow: "transparent" },
  emailed:     { label: "Emailed",     color: GEM.yellow,   glow: GLOW.yellow.border },
  replied:     { label: "Replied",     color: GEM.diamond,  glow: GLOW.diamond.border },
  demo_booked: { label: "Demo Booked", color: GEM.green,    glow: GLOW.green.border },
  trial:       { label: "Trial",       color: GEM.green,    glow: GLOW.green.border },
  paid:        { label: "Paid",        color: GEM.green,    glow: GLOW.green.strong },
  dead:        { label: "Dead",        color: "#2a2a2a",    glow: "transparent" },
};

interface Prospect {
  id: string;
  business_name: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  stage: Stage;
  score: number;
  source: string;
  google_rating: number | null;
  google_reviews: number | null;
  email_opens: number;
  email_clicks: number;
  last_emailed_at: string | null;
  created_at: string;
  unsubscribed: boolean;
  website: string | null;
}

interface PipelineStats {
  pipeline: Record<string, number>;
  due_now: number;
  total: number;
}

function ScoreGem({ score }: { score: number }) {
  const color = score >= 80 ? GEM.green : score >= 55 ? GEM.yellow : "#333";
  const glow  = score >= 80 ? GLOW.green.soft : score >= 55 ? GLOW.yellow.soft : "none";
  return (
    <div className="flex items-center gap-1.5">
      <div style={{
        width: 8, height: 8,
        clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
        background: color,
        filter: score >= 55 ? `drop-shadow(0 0 3px ${color})` : "none",
        flexShrink: 0,
      }} />
      <span className="tabular-nums text-xs" style={{ color: "#555" }}>{score}</span>
    </div>
  );
}

type Tab = "pipeline" | "creative";

export default function SalesDashboard() {
  const [tab, setTab]               = useState<Tab>("pipeline");
  const [prospects, setProspects]   = useState<Prospect[]>([]);
  const [stats, setStats]           = useState<PipelineStats | null>(null);
  const [stage, setStage]           = useState<Stage | "all">("all");
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [mining, setMining]         = useState(false);
  const [sending, setSending]       = useState(false);
  const [mineCity, setMineCity]     = useState("");
  const [mineState, setMineState]   = useState("");
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (stage !== "all") params.set("stage", stage);
    if (search) params.set("q", search);

    const [pr, sr] = await Promise.all([
      fetch(`/api/sales/prospects?${params}`).then(r => r.json()),
      fetch("/api/sales/outreach").then(r => r.json()),
    ]);
    setProspects(pr.prospects ?? []);
    setStats(sr);
    setLoading(false);
  }, [stage, search]);

  useEffect(() => { load(); }, [load]);

  async function runMining() {
    if (!mineCity || !mineState) return;
    setMining(true);
    const res  = await fetch("/api/sales/mine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: mineCity, state: mineState, limit: 50 }),
    });
    const data = await res.json();
    setMining(false);
    showToast(data.message ?? `Saved ${data.saved} prospects`, res.ok);
    load();
  }

  async function runOutreach() {
    setSending(true);
    const res  = await fetch("/api/sales/outreach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 50 }),
    });
    const data = await res.json();
    setSending(false);
    showToast(`Sent ${data.sent} emails${data.errors?.length ? ` · ${data.errors.length} failed` : ""}`, res.ok);
    load();
  }

  async function updateStage(id: string, newStage: Stage) {
    await fetch("/api/sales/prospects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage: newStage }),
    });
    setProspects(p => p.map(x => x.id === id ? { ...x, stage: newStage } : x));
  }

  const pipelineTotal = stats ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="flex-1 min-h-screen p-6 space-y-6" style={{ background: "#000" }}>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.06)" }}>
        {([ ["pipeline", "Pipeline"], ["creative", "Creative Machine"] ] as [Tab, string][]).map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: active ? "rgba(255,255,255,0.07)" : "transparent",
                color: active ? "#fff" : "#444",
                border: active ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Creative Machine tab */}
      {tab === "creative" && <CreativeMachine />}

      {/* Pipeline tab content */}
      {tab === "pipeline" && <>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl" style={{
          background:  toast.ok ? GEM.green : GEM.red,
          color:       "#000",
          boxShadow:   toast.ok ? GLOW.green.strong : GLOW.red.strong,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">Sales Pipeline</h1>
          <p className="text-xs mt-0.5" style={{ color: "#444" }}>
            LeadMine growth — {stats?.total ?? 0} total prospects
          </p>
        </div>
        <button
          onClick={runOutreach}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background:  GLOW.yellow.bg,
            border:      `1px solid ${GLOW.yellow.border}`,
            color:       GEM.yellow,
            boxShadow:   sending ? "none" : GLOW.yellow.soft,
          }}
        >
          <div style={{
            width: 6, height: 6,
            clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
            background: GEM.yellow,
            filter: `drop-shadow(0 0 3px ${GEM.yellow})`,
          }} />
          {sending ? "Sending…" : `Send Emails${stats?.due_now ? ` · ${stats.due_now} due` : ""}`}
        </button>
      </div>

      {/* Pipeline stage buttons */}
      {stats && (
        <div className="grid grid-cols-8 gap-2">

          {/* ALL button */}
          {(() => {
            const active = stage === "all";
            return (
              <button
                onClick={() => setStage("all")}
                className="relative rounded-2xl p-4 text-center border overflow-hidden transition-all"
                style={{
                  background:  active ? "rgba(255,255,255,0.04)" : "#080808",
                  borderColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                  boxShadow:   active ? "inset 0 0 40px rgba(255,255,255,0.03), 0 0 20px rgba(255,255,255,0.04)" : "none",
                }}
              >
                {/* ambient glow spot */}
                {active && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,255,255,0.04), transparent)",
                  }} />
                )}
                {/* three tiny gems stacked */}
                <div className="flex justify-center items-end gap-1 mb-2.5 h-7">
                  {[GEM.green, GEM.diamond, GEM.yellow].map((c, i) => (
                    <div key={i} style={{
                      width:     i === 1 ? 10 : 7,
                      height:    i === 1 ? 14 : 10,
                      clipPath:  "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                      background: active ? c : "#1c1c1c",
                      filter:    active ? `drop-shadow(0 0 5px ${c}cc)` : "none",
                      transition: "all 0.3s",
                    }} />
                  ))}
                </div>
                <div className="text-xl font-bold tabular-nums" style={{ color: active ? "#fff" : "#2a2a2a" }}>
                  {pipelineTotal}
                </div>
                <div className="text-xs mt-1 tracking-wide" style={{ color: active ? "rgba(255,255,255,0.4)" : "#222" }}>
                  All
                </div>
              </button>
            );
          })()}

          {/* Stage buttons */}
          {STAGES.map((s, idx) => {
            const count  = stats.pipeline[s] ?? 0;
            const active = stage === s;
            const meta   = STAGE_META[s];
            const isDead = s === "dead";
            const hasGlow = count > 0 && !isDead;

            // gem sizes get progressively bigger up the funnel
            const gemW = [10, 11, 12, 13, 14, 15, 8][idx] ?? 12;
            const gemH = [13, 15, 17, 19, 21, 23, 10][idx] ?? 16;

            return (
              <button
                key={s}
                onClick={() => setStage(active ? "all" : s)}
                className="relative rounded-2xl p-4 text-center border overflow-hidden transition-all"
                style={{
                  background:  active ? `${meta.color}10` : "#080808",
                  borderColor: active ? `${meta.color}50` : "rgba(255,255,255,0.05)",
                  boxShadow:   active && hasGlow
                    ? `inset 0 0 40px ${meta.color}0a, 0 0 24px ${meta.color}18`
                    : "none",
                }}
              >
                {/* Floor glow when active */}
                {active && hasGlow && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{
                    background: `radial-gradient(ellipse 90% 80% at 50% 110%, ${meta.color}22, transparent 70%)`,
                  }} />
                )}

                {/* Gem */}
                <div className="relative flex justify-center items-end mb-2.5" style={{ height: 30 }}>
                  {/* bloom behind gem */}
                  {hasGlow && (
                    <div className="absolute animate-pulse pointer-events-none" style={{
                      width:  gemW * 4,
                      height: gemH * 4,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${meta.color}${active ? "30" : "14"} 0%, transparent 65%)`,
                      animationDuration: "3s",
                    }} />
                  )}
                  {/* gem body */}
                  <div className="relative" style={{
                    width:     gemW,
                    height:    gemH,
                    clipPath:  "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                    background: count > 0
                      ? `linear-gradient(160deg, rgba(255,255,255,0.5) 0%, ${meta.color} 25%, ${meta.color}cc 100%)`
                      : "#181818",
                    filter: hasGlow
                      ? `drop-shadow(0 0 ${active ? 8 : 4}px ${meta.color}${active ? "ee" : "88"})`
                      : "none",
                    transition: "all 0.3s",
                  }} />
                  {/* shimmer facet */}
                  {count > 0 && (
                    <div className="absolute" style={{
                      width:  gemW * 0.4,
                      height: gemH * 0.4,
                      clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                      background: "linear-gradient(160deg, rgba(255,255,255,0.7) 0%, transparent 70%)",
                      transform: "translate(-40%, -60%)",
                      opacity: active ? 0.9 : 0.5,
                    }} />
                  )}
                </div>

                <div
                  className="text-xl font-bold tabular-nums transition-all"
                  style={{ color: count > 0 ? meta.color : "#222" }}
                >
                  {count}
                </div>
                <div
                  className="text-xs mt-1 tracking-wide leading-tight transition-all"
                  style={{ color: active ? `${meta.color}cc` : "#2e2e2e" }}
                >
                  {meta.label}
                </div>
                {count > 0 && pipelineTotal > 0 && (
                  <div className="text-xs mt-1.5 tabular-nums" style={{ color: active ? `${meta.color}55` : "#1e1e1e" }}>
                    {Math.round((count / pipelineTotal) * 100)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mine + search row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Mine prospects */}
        <div className="rounded-2xl border p-5" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <div style={{
              width: 8, height: 10,
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
              background: GEM.green,
              filter: `drop-shadow(0 0 4px ${GEM.green})`,
            }} />
            <span className="text-xs font-semibold text-white">Mine Prospects</span>
            <span className="text-xs ml-auto" style={{ color: "#333" }}>Google Places → pipeline</span>
          </div>
          <div className="flex gap-2">
            <input
              value={mineCity}
              onChange={e => setMineCity(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runMining()}
              placeholder="City"
              className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
            />
            <input
              value={mineState}
              onChange={e => setMineState(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runMining()}
              placeholder="State"
              className="w-20 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
            />
            <button
              onClick={runMining}
              disabled={mining || !mineCity || !mineState}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
              style={{
                background: (mineCity && mineState) ? GEM.green : "#111",
                color:      (mineCity && mineState) ? "#000" : "#333",
                boxShadow:  (mineCity && mineState && !mining) ? GLOW.green.medium : "none",
              }}
            >
              {mining ? "Mining…" : "Mine"}
            </button>
          </div>
        </div>

        {/* Search + filter */}
        <div className="rounded-2xl border p-5" style={{ background: "#080808", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-white">Filter</span>
            <span className="text-xs ml-auto" style={{ color: "#333" }}>{prospects.length} shown</span>
          </div>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search business, city…"
              className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
            />
            <select
              value={stage}
              onChange={e => setStage(e.target.value as Stage | "all")}
              className="rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <option value="all">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Prospects table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="px-5 py-3 border-b flex items-center gap-3" style={{
          background: "#080808", borderColor: "rgba(255,255,255,0.05)",
        }}>
          <span className="text-xs font-semibold text-white">Prospects</span>
          <div className="flex-1" />
          <span className="text-xs" style={{ color: "#333" }}>Click stage to update</span>
        </div>

        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {["Business", "Location", "Score", "Stage", "Outreach", "Last Contacted", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-widest" style={{ color: "#2e2e2e", background: "#050505" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#2a2a2a" }}>
                  Loading…
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center" style={{ color: "#2a2a2a" }}>
                  <div style={{
                    width: 20, height: 26,
                    clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                    background: "#1a1a1a",
                    margin: "0 auto 12px",
                  }} />
                  <p className="text-sm">No prospects yet</p>
                  <p className="text-xs mt-1" style={{ color: "#222" }}>Mine a city to get started</p>
                </td>
              </tr>
            ) : prospects.map((p, i) => {
              const meta = STAGE_META[p.stage];
              return (
                <tr
                  key={p.id}
                  className="border-b transition-colors"
                  style={{
                    borderColor: "rgba(255,255,255,0.03)",
                    background:  i % 2 === 0 ? "#000" : "#030303",
                  }}
                >
                  {/* Business */}
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-sm text-white">{p.business_name}</div>
                    {p.email
                      ? <div className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "#444" }}>{p.email}</div>
                      : <div className="text-xs mt-0.5" style={{ color: "#222" }}>No email</div>
                    }
                  </td>

                  {/* Location */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs" style={{ color: "#444" }}>
                      {[p.city, p.state].filter(Boolean).join(", ") || "—"}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-5 py-3.5">
                    <ScoreGem score={p.score} />
                  </td>

                  {/* Stage */}
                  <td className="px-5 py-3.5">
                    <select
                      value={p.stage}
                      onChange={e => updateStage(p.id, e.target.value as Stage)}
                      className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none transition-all"
                      style={{
                        background:  `${meta.color}12`,
                        border:      `1px solid ${meta.color}33`,
                        color:       meta.color,
                      }}
                    >
                      {STAGES.map(s => (
                        <option key={s} value={s}>{STAGE_META[s].label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Outreach */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#444" }}>
                      {p.email_opens > 0 && (
                        <span style={{ color: GEM.green }}>{p.email_opens} opens</span>
                      )}
                      {p.email_clicks > 0 && (
                        <span style={{ color: GEM.diamond }}>{p.email_clicks} clicks</span>
                      )}
                      {p.unsubscribed && (
                        <span style={{ color: GEM.red }}>Unsub</span>
                      )}
                      {!p.email_opens && !p.email_clicks && !p.unsubscribed && (
                        <span style={{ color: "#2a2a2a" }}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Last contacted */}
                  <td className="px-5 py-3.5">
                    <span className="text-xs" style={{ color: "#333" }}>
                      {p.last_emailed_at
                        ? new Date(p.last_emailed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                        : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {p.phone && (
                        <a
                          href={`tel:${p.phone}`}
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ color: GEM.green, background: GLOW.green.bg, border: `1px solid ${GLOW.green.border}` }}
                        >
                          Call
                        </a>
                      )}
                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2.5 py-1 rounded-lg transition-all"
                          style={{ color: "#555", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          Site
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      </> /* end pipeline tab */}
    </div>
  );
}
