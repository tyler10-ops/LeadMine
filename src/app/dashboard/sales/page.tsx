"use client";

import { useState, useEffect, useCallback } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { CreativeMachine } from "@/components/hub/panels/creative-machine";
import { PipelineAgent } from "@/components/sales/pipeline-agent";
import {
  TrendingUp, Pickaxe, Send, Loader2, Search,
  Sparkles, Layers, RefreshCw, Download, FileText,
  ImageIcon, Eye,
} from "lucide-react";
import type { CreativeFile } from "@/app/api/marketing/creatives/route";

// ── Types ──────────────────────────────────────────────────────────────────

const STAGES = ["discovered","emailed","replied","demo_booked","trial","paid","dead"] as const;
type Stage = typeof STAGES[number];
type Tab   = "pipeline" | "creative" | "studio";

const STAGE_META: Record<Stage, { label: string; color: string; glow: string }> = {
  discovered:  { label: "Discovered",  color: "#444",      glow: "transparent" },
  emailed:     { label: "Emailed",     color: GEM.yellow,  glow: GLOW.yellow.border },
  replied:     { label: "Replied",     color: GEM.diamond, glow: GLOW.diamond.border },
  demo_booked: { label: "Demo Booked", color: GEM.green,   glow: GLOW.green.border },
  trial:       { label: "Trial",       color: GEM.green,   glow: GLOW.green.border },
  paid:        { label: "Paid",        color: GEM.green,   glow: GLOW.green.strong },
  dead:        { label: "Dead",        color: "#2a2a2a",   glow: "transparent" },
};

interface Prospect {
  id: string; business_name: string; name: string | null;
  email: string | null; phone: string | null; city: string | null;
  state: string | null; stage: Stage; score: number; source: string;
  google_rating: number | null; google_reviews: number | null;
  email_opens: number; email_clicks: number; last_emailed_at: string | null;
  created_at: string; unsubscribed: boolean; website: string | null;
}
interface PipelineStats { pipeline: Record<string, number>; due_now: number; total: number; }

// ── Shared gem button ──────────────────────────────────────────────────────

function GemBtn({ onClick, label, icon: Icon, color = GEM.diamond, disabled = false, glow }: {
  onClick: () => void; label: string; icon: React.ElementType;
  color?: string; disabled?: boolean; glow?: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
      style={{ background: `${color}12`, border: `1px solid ${color}35`, color, boxShadow: glow ?? "none" }}>
      <Icon size={13} />{label}
    </button>
  );
}

// ── Score gem ──────────────────────────────────────────────────────────────

function ScoreGem({ score }: { score: number }) {
  const color = score >= 80 ? GEM.green : score >= 55 ? GEM.yellow : "#333";
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

// ── Studio tab ────────────────────────────────────────────────────────────

const PLATFORM_LABEL: Record<string, string> = {
  instagram_post: "IG Post", instagram_story: "IG Story",
  facebook_feed: "FB Feed", facebook_square: "FB Square", article_header: "Article",
};

interface WorkerStatus {
  healthy: boolean; lastRun: string | null; nextRun: string | null;
  minutesUntilNext: number | null; totalFiles: number; lastFilename: string | null;
}

function StudioTab() {
  const [creatives, setCreatives]   = useState<CreativeFile[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState<"all"|"image"|"video"|"article">("all");
  const [preview, setPreview]       = useState<CreativeFile | null>(null);
  const [worker, setWorker]         = useState<WorkerStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [creativesRes, statusRes] = await Promise.all([
      fetch("/api/marketing/creatives").then(r => r.json()),
      fetch("/api/marketing/worker-status").then(r => r.json()),
    ]);
    setCreatives(creativesRes.creatives ?? []);
    setWorker(statusRes.error ? null : statusRes);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? creatives : creatives.filter(c => c.type === filter);
  const counts = {
    all: creatives.length,
    image: creatives.filter(c => c.type === "image").length,
    video: creatives.filter(c => c.type === "video").length,
    article: creatives.filter(c => c.type === "article").length,
  };

  function download(item: CreativeFile) {
    if (item.imageUrl || item.videoUrl) {
      const a = document.createElement("a");
      a.href = item.imageUrl ?? item.videoUrl!;
      a.download = item.filename; a.target = "_blank"; a.click();
    } else if (item.articleMd) {
      const blob = new Blob([item.articleMd], { type: "text/markdown" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = item.filename; a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="space-y-5">
      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden border"
            style={{ borderColor: CAVE.stone, background: CAVE.surface1 }}
            onClick={e => e.stopPropagation()}>
            {preview.type === "image" && preview.imageUrl && <img src={preview.imageUrl} alt="" className="w-full" />}
            {preview.type === "video" && preview.videoUrl && <video src={preview.videoUrl} autoPlay loop muted controls className="w-full" />}
            {preview.type === "article" && preview.articleMd && (
              <div className="p-8 max-h-[80vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-white mb-4">{preview.headline}</h2>
                <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#888", fontFamily: "inherit" }}>{preview.articleMd}</pre>
              </div>
            )}
            <button onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(0,0,0,0.8)", color: "#666", border: "1px solid rgba(255,255,255,0.1)" }}>✕</button>
          </div>
        </div>
      )}

      {/* Worker status bar */}
      <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: "#080808", borderColor: worker?.healthy ? `${GEM.green}25` : `${CAVE.stoneEdge}` }}>
        {/* Status dot */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${worker?.healthy ? "animate-pulse" : ""}`}
            style={{ background: worker?.healthy ? GEM.green : worker?.lastRun ? GEM.yellow : "#333" }} />
          <span className="text-xs font-semibold" style={{ color: worker?.healthy ? GEM.green : worker?.lastRun ? GEM.yellow : "#444" }}>
            {worker?.healthy ? "Agent Running" : worker?.lastRun ? "Agent Idle" : "No runs yet"}
          </span>
        </div>

        <div className="w-px h-4" style={{ background: CAVE.stoneEdge }} />

        {/* Last run */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "#333" }}>Last run:</span>
          <span className="text-xs font-medium" style={{ color: "#666" }}>
            {worker?.lastRun
              ? new Date(worker.lastRun).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "Never"}
          </span>
        </div>

        <div className="w-px h-4" style={{ background: CAVE.stoneEdge }} />

        {/* Next run countdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "#333" }}>Next run:</span>
          <span className="text-xs font-medium" style={{ color: worker?.minutesUntilNext != null ? GEM.diamond : "#444" }}>
            {worker?.minutesUntilNext != null
              ? worker.minutesUntilNext < 60
                ? `${worker.minutesUntilNext}m`
                : `${Math.round(worker.minutesUntilNext / 60)}h`
              : "—"}
          </span>
        </div>

        <div className="w-px h-4" style={{ background: CAVE.stoneEdge }} />

        {/* Total files */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "#333" }}>Total files:</span>
          <span className="text-xs font-semibold" style={{ color: "#fff" }}>{worker?.totalFiles ?? 0}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!worker?.healthy && (
            <div className="text-xs px-2.5 py-1 rounded-lg" style={{ background: "#111", color: "#333", border: `1px solid ${CAVE.stoneEdge}` }}>
              Mac Mini may be offline
            </div>
          )}
        </div>
      </div>

      {/* Filter strip */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "#080808", border: `1px solid ${CAVE.stoneEdge}` }}>
          {(["all","image","video","article"] as const).map(f => {
            const active = filter === f;
            const color  = f === "image" ? GEM.diamond : f === "video" ? GEM.green : f === "article" ? GEM.yellow : "#fff";
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-xl text-xs font-medium transition-all capitalize"
                style={{
                  background: active ? `${color}15` : "transparent",
                  color: active ? color : "#333",
                  border: active ? `1px solid ${color}30` : "1px solid transparent",
                }}>
                {f === "all" ? `All · ${counts.all}` : `${f}s · ${counts[f]}`}
              </button>
            );
          })}
        </div>
        <GemBtn onClick={load} label={loading ? "Refreshing…" : "Refresh"} icon={RefreshCw} color={GEM.diamond} disabled={loading} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={18} className="animate-spin" style={{ color: GEM.diamond }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div style={{ width: 20, height: 28, clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", background: "#111" }} />
          <p className="text-sm" style={{ color: "#333" }}>No creatives yet</p>
          <code className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "#0a0a0a", color: "#444", border: `1px solid ${CAVE.stoneEdge}` }}>
            npx tsx scripts/creative-worker.ts
          </code>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {filtered.map(item => {
            const typeColor = item.type === "image" ? GEM.diamond : item.type === "video" ? GEM.green : GEM.yellow;
            return (
              <div key={item.id} className="rounded-2xl border overflow-hidden group transition-all"
                style={{ background: CAVE.surface1, borderColor: CAVE.stoneEdge }}>
                <div className="relative cursor-pointer overflow-hidden" style={{ aspectRatio: "16/9", background: "#060606" }}
                  onClick={() => setPreview(item)}>
                  {item.type === "image" && item.imageUrl && <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />}
                  {item.type === "video" && item.videoUrl && <video src={item.videoUrl} muted loop className="w-full h-full object-cover" />}
                  {item.type === "article" && <div className="w-full h-full flex items-center justify-center"><FileText size={28} style={{ color: "#1a1a1a" }} /></div>}
                  {item.type === "image" && !item.imageUrl && <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} style={{ color: "#1a1a1a" }} /></div>}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <Eye size={18} className="text-white" />
                  </div>
                  <div className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-lg font-medium capitalize"
                    style={{ background: `${typeColor}20`, border: `1px solid ${typeColor}35`, color: typeColor }}>
                    {item.type}
                  </div>
                  {item.platform && PLATFORM_LABEL[item.platform] && (
                    <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#555", border: "1px solid rgba(255,255,255,0.07)" }}>
                      {PLATFORM_LABEL[item.platform]}
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {item.headline && <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{item.headline}</p>}
                  {item.angle && <p className="text-xs capitalize" style={{ color: "#333" }}>{item.angle.replace(/-/g," ")}</p>}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs" style={{ color: "#222" }}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <button onClick={() => download(item)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all"
                      style={{ background: `${GEM.diamond}10`, border: `1px solid ${GEM.diamond}25`, color: GEM.diamond }}>
                      <Download size={11} />Download
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



// ── Main page ─────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "pipeline", label: "Pipeline",         icon: TrendingUp, color: GEM.green   },
  { id: "creative", label: "Creative Machine",  icon: Sparkles,   color: GEM.diamond },
  { id: "studio",   label: "Content Studio",    icon: Layers,     color: GEM.yellow  },
];

export default function SalesDashboard() {
  const [tab, setTab]             = useState<Tab>("pipeline");
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [stats, setStats]         = useState<PipelineStats | null>(null);
  const [stage, setStage]         = useState<Stage | "all">("all");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [mining, setMining]       = useState(false);
  const [sending, setSending]     = useState(false);
  const [mineCity, setMineCity]   = useState("");
  const [mineState, setMineState] = useState("");
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

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
    const res  = await fetch("/api/sales/mine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ city: mineCity, state: mineState, limit: 50 }) });
    const data = await res.json();
    setMining(false);
    showToast(data.message ?? `Saved ${data.saved} prospects`, res.ok);
    load();
  }

  async function runOutreach() {
    setSending(true);
    const res  = await fetch("/api/sales/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 50 }) });
    const data = await res.json();
    setSending(false);
    showToast(`Sent ${data.sent} emails${data.errors?.length ? ` · ${data.errors.length} failed` : ""}`, res.ok);
    load();
  }

  async function updateStage(id: string, newStage: Stage) {
    await fetch("/api/sales/prospects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, stage: newStage }) });
    setProspects(p => p.map(x => x.id === id ? { ...x, stage: newStage } : x));
  }

  const pipelineTotal = stats ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0) : 0;
  const activeTab = TABS.find(t => t.id === tab)!;

  return (
    <div className="flex-1 min-h-screen" style={{ background: "#000" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-xl"
          style={{ background: toast.ok ? GEM.green : GEM.red, color: "#000", boxShadow: toast.ok ? GLOW.green.strong : GLOW.red.strong }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="border-b px-6 pt-6 pb-0" style={{ borderColor: CAVE.stoneEdge }}>
        <div className="flex items-end justify-between mb-4">
          <div className="flex items-center gap-3">
            <div style={{
              width: 10, height: 14,
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
              background: activeTab.color,
              filter: `drop-shadow(0 0 6px ${activeTab.color})`,
              transition: "all 0.3s",
            }} />
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">LeadMine HQ</h1>
              <p className="text-xs mt-0.5" style={{ color: "#444" }}>
                {stats?.total ?? 0} prospects · {stats?.due_now ?? 0} follow-ups due
              </p>
            </div>
          </div>

          {/* Primary action changes with tab */}
          {tab === "pipeline" && (
            <GemBtn onClick={runOutreach} disabled={sending} label={sending ? "Sending…" : `Send Emails${stats?.due_now ? ` · ${stats.due_now}` : ""}`} icon={Send} color={GEM.yellow} glow={GLOW.yellow.soft} />
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-0.5">
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium transition-all relative"
                style={{ color: active ? t.color : "#333" }}>
                <t.icon size={12} />
                {t.label}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6 space-y-6">

        {/* ── PIPELINE TAB ────────────────────────────────────────── */}
        {tab === "pipeline" && (
          <>
            {/* Stage filter */}
            {stats && (
              <div className="grid grid-cols-8 gap-2">
                {/* ALL */}
                {(() => {
                  const active = stage === "all";
                  return (
                    <button onClick={() => setStage("all")}
                      className="relative rounded-2xl p-4 text-center border overflow-hidden transition-all"
                      style={{
                        background:  active ? "rgba(255,255,255,0.04)" : "#080808",
                        borderColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      }}>
                      {active && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(255,255,255,0.04), transparent)" }} />}
                      <div className="flex justify-center items-end gap-1 mb-2.5 h-7">
                        {[GEM.green, GEM.diamond, GEM.yellow].map((c, i) => (
                          <div key={i} style={{
                            width: i === 1 ? 10 : 7, height: i === 1 ? 14 : 10,
                            clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                            background: active ? c : "#1c1c1c",
                            filter: active ? `drop-shadow(0 0 5px ${c}cc)` : "none",
                            transition: "all 0.3s",
                          }} />
                        ))}
                      </div>
                      <div className="text-xl font-bold tabular-nums" style={{ color: active ? "#fff" : "#2a2a2a" }}>{pipelineTotal}</div>
                      <div className="text-xs mt-1 tracking-wide" style={{ color: active ? "rgba(255,255,255,0.4)" : "#222" }}>All</div>
                    </button>
                  );
                })()}

                {/* Stages */}
                {STAGES.map((s, idx) => {
                  const count  = stats.pipeline[s] ?? 0;
                  const active = stage === s;
                  const meta   = STAGE_META[s];
                  const hasGlow = count > 0 && s !== "dead";
                  const gemW = [10,11,12,13,14,15,8][idx] ?? 12;
                  const gemH = [13,15,17,19,21,23,10][idx] ?? 16;
                  return (
                    <button key={s} onClick={() => setStage(active ? "all" : s)}
                      className="relative rounded-2xl p-4 text-center border overflow-hidden transition-all"
                      style={{
                        background:  active ? `${meta.color}10` : "#080808",
                        borderColor: active ? `${meta.color}50` : "rgba(255,255,255,0.05)",
                        boxShadow:   active && hasGlow ? `inset 0 0 40px ${meta.color}0a, 0 0 24px ${meta.color}18` : "none",
                      }}>
                      {active && hasGlow && <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none" style={{ background: `radial-gradient(ellipse 90% 80% at 50% 110%, ${meta.color}22, transparent 70%)` }} />}
                      <div className="relative flex justify-center items-end mb-2.5" style={{ height: 30 }}>
                        {hasGlow && <div className="absolute animate-pulse pointer-events-none" style={{ width: gemW*4, height: gemH*4, borderRadius: "50%", background: `radial-gradient(circle, ${meta.color}${active?"30":"14"} 0%, transparent 65%)`, animationDuration: "3s" }} />}
                        <div className="relative" style={{
                          width: gemW, height: gemH,
                          clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
                          background: count > 0 ? `linear-gradient(160deg, rgba(255,255,255,0.5) 0%, ${meta.color} 25%, ${meta.color}cc 100%)` : "#181818",
                          filter: hasGlow ? `drop-shadow(0 0 ${active?8:4}px ${meta.color}${active?"ee":"88"})` : "none",
                          transition: "all 0.3s",
                        }} />
                        {count > 0 && <div className="absolute" style={{ width: gemW*0.4, height: gemH*0.4, clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", background: "linear-gradient(160deg, rgba(255,255,255,0.7) 0%, transparent 70%)", transform: "translate(-40%, -60%)", opacity: active ? 0.9 : 0.5 }} />}
                      </div>
                      <div className="text-xl font-bold tabular-nums transition-all" style={{ color: count > 0 ? meta.color : "#222" }}>{count}</div>
                      <div className="text-xs mt-1 tracking-wide leading-tight transition-all" style={{ color: active ? `${meta.color}cc` : "#2e2e2e" }}>{meta.label}</div>
                      {count > 0 && pipelineTotal > 0 && <div className="text-xs mt-1.5 tabular-nums" style={{ color: active ? `${meta.color}55` : "#1e1e1e" }}>{Math.round((count/pipelineTotal)*100)}%</div>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Mine + search row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4" style={{ background: "#080808", borderColor: CAVE.stoneEdge }}>
                <div className="flex items-center gap-2 mb-3">
                  <Pickaxe size={12} style={{ color: GEM.green }} />
                  <span className="text-xs font-semibold text-white">Mine Prospects</span>
                  <span className="text-xs ml-auto" style={{ color: "#333" }}>Google Places</span>
                </div>
                <div className="flex gap-2">
                  <input value={mineCity} onChange={e => setMineCity(e.target.value)} onKeyDown={e => e.key === "Enter" && runMining()}
                    placeholder="City" className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }} />
                  <input value={mineState} onChange={e => setMineState(e.target.value)} onKeyDown={e => e.key === "Enter" && runMining()}
                    placeholder="ST" className="w-16 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }} />
                  <button onClick={runMining} disabled={mining || !mineCity || !mineState}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ background: (mineCity && mineState) ? GEM.green : "#111", color: (mineCity && mineState) ? "#000" : "#333", boxShadow: (mineCity && mineState && !mining) ? GLOW.green.medium : "none" }}>
                    {mining ? <Loader2 size={13} className="animate-spin" /> : "Mine"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border p-4" style={{ background: "#080808", borderColor: CAVE.stoneEdge }}>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={12} style={{ color: "#444" }} />
                  <span className="text-xs font-semibold text-white">Filter</span>
                  <span className="text-xs ml-auto" style={{ color: "#333" }}>{prospects.length} shown</span>
                </div>
                <div className="flex gap-2">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search business, city…"
                    className="flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-800 focus:outline-none"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }} />
                  <select value={stage} onChange={e => setStage(e.target.value as Stage | "all")}
                    className="rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                    style={{ background: "#111", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <option value="all">All stages</option>
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Pipeline Agent */}
            <PipelineAgent />

            {/* Prospects table */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: CAVE.stoneEdge }}>
              <div className="px-5 py-3 border-b flex items-center gap-3" style={{ background: "#080808", borderColor: CAVE.stoneMid }}>
                <span className="text-xs font-semibold text-white">Prospects</span>
                <div className="flex-1" />
                <span className="text-xs" style={{ color: "#2a2a2a" }}>Click stage to update</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Business","Location","Score","Stage","Outreach","Last Contacted","Actions"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs uppercase tracking-widest" style={{ color: "#2e2e2e", background: "#050505" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-sm" style={{ color: "#2a2a2a" }}>
                      <Loader2 size={16} className="animate-spin mx-auto" style={{ color: "#333" }} />
                    </td></tr>
                  ) : prospects.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-12 text-center" style={{ color: "#2a2a2a" }}>
                      <div style={{ width: 20, height: 26, clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)", background: "#1a1a1a", margin: "0 auto 12px" }} />
                      <p className="text-sm">No prospects yet</p>
                      <p className="text-xs mt-1" style={{ color: "#222" }}>Mine a city to get started</p>
                    </td></tr>
                  ) : prospects.map((p, i) => {
                    const meta = STAGE_META[p.stage];
                    return (
                      <tr key={p.id} className="border-b transition-colors"
                        style={{ borderColor: "rgba(255,255,255,0.03)", background: i % 2 === 0 ? "#000" : "#030303" }}>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-sm text-white">{p.business_name}</div>
                          {p.email ? <div className="text-xs mt-0.5 truncate max-w-[180px]" style={{ color: "#444" }}>{p.email}</div>
                            : <div className="text-xs mt-0.5" style={{ color: "#222" }}>No email</div>}
                        </td>
                        <td className="px-5 py-3.5"><span className="text-xs" style={{ color: "#444" }}>{[p.city,p.state].filter(Boolean).join(", ") || "—"}</span></td>
                        <td className="px-5 py-3.5"><ScoreGem score={p.score} /></td>
                        <td className="px-5 py-3.5">
                          <select value={p.stage} onChange={e => updateStage(p.id, e.target.value as Stage)}
                            className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none transition-all"
                            style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}33`, color: meta.color }}>
                            {STAGES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 text-xs" style={{ color: "#444" }}>
                            {p.email_opens > 0 && <span style={{ color: GEM.green }}>{p.email_opens} opens</span>}
                            {p.email_clicks > 0 && <span style={{ color: GEM.diamond }}>{p.email_clicks} clicks</span>}
                            {p.unsubscribed && <span style={{ color: GEM.red }}>Unsub</span>}
                            {!p.email_opens && !p.email_clicks && !p.unsubscribed && <span style={{ color: "#2a2a2a" }}>—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs" style={{ color: "#333" }}>
                            {p.last_emailed_at ? new Date(p.last_emailed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {p.phone && <a href={`tel:${p.phone}`} className="text-xs px-2.5 py-1 rounded-lg transition-all"
                              style={{ color: GEM.green, background: GLOW.green.bg, border: `1px solid ${GLOW.green.border}` }}>Call</a>}
                            {p.website && <a href={p.website} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-2.5 py-1 rounded-lg transition-all"
                              style={{ color: "#555", background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.06)" }}>Site</a>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── CREATIVE TAB ─────────────────────────────────────────── */}
        {tab === "creative" && <CreativeMachine />}

        {/* ── STUDIO TAB ──────────────────────────────────────────── */}
        {tab === "studio" && <StudioTab />}


      </div>
    </div>
  );
}
