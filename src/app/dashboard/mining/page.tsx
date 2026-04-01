"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { CavePanel } from "@/components/hub/panels/cave-panel";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { MiningPanel, GlowBorder } from "@/components/ui/mining-panel";
import { MiningProgress } from "@/components/ui/mining-progress";
import type { MiningPhase } from "@/components/ui/mining-progress";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Pickaxe,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";
import type { MiningHistoryEntry } from "@/app/api/mining/history/route";
import type { MiningProgress as MiningProgressData } from "@/lib/queue/queues";

const VERTICALS = [
  { id: "roofing", label: "Roofing" },
  { id: "plumbing", label: "Plumbing" },
  { id: "hvac", label: "HVAC" },
  { id: "electrical", label: "Electrical" },
  { id: "landscaping", label: "Landscaping" },
  { id: "painting", label: "Painting" },
  { id: "pest-control", label: "Pest Control" },
  { id: "real-estate", label: "Real Estate" },
  { id: "dental", label: "Dental" },
  { id: "legal", label: "Legal" },
];

// Map API phase names to MiningProgress component phases
function toDisplayPhase(phase: string): MiningPhase {
  switch (phase) {
    case "scraping":
      return "intake";
    case "enriching":
      return "filtering";
    case "grading":
      return "grading";
    case "saving":
      return "extraction";
    case "complete":
      return "delivered";
    default:
      return "intake";
  }
}

type JobState = "idle" | "queued" | "active" | "completed" | "failed";

export default function MiningPage() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verticalId, setVerticalId] = useState("");
  const [locations, setLocations] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Job tracking
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobState, setJobState] = useState<JobState>("idle");
  const [progress, setProgress] = useState<MiningProgressData | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mining history
  const [history, setHistory] = useState<MiningHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/mining/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history ?? []);
      }
    } catch {
      // Silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch client ID on mount
  useEffect(() => {
    const fetchClient = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (client) setClientId(client.id);
      setLoading(false);
    };
    fetchClient();
  }, []);

  // Fetch history when clientId is ready
  useEffect(() => {
    if (clientId) fetchHistory();
  }, [clientId, fetchHistory]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollStatus = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/mining/status?jobId=${id}`);
          if (!res.ok) return;
          const data = await res.json();

          setJobState(data.state as JobState);
          if (data.progress) setProgress(data.progress as MiningProgressData);

          if (data.state === "completed") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (data.result) setResult(data.result);
            fetchHistory();
          }

          if (data.state === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(data.failedReason || "Job failed");
          }
        } catch {
          // Silently retry on next interval
        }
      }, 3000);
    },
    [fetchHistory]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !verticalId || !locations.trim()) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const locationList = locations
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await fetch("/api/mining/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          verticalId,
          locations: locationList,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start mining job");
        setSubmitting(false);
        return;
      }

      setJobId(data.jobId);
      setJobState("queued");
      pollStatus(data.jobId);
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setSubmitting(false);
    }
  };

  const resetJob = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setJobId(null);
    setJobState("idle");
    setProgress(null);
    setResult(null);
    setError(null);
  };

  const [activeTab, setActiveTab] = useState<"cave" | "config">("cave");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <MiningPanel padding="lg">
          <p className="text-sm text-neutral-400 text-center">
            No client profile found. Complete onboarding to start mining.
          </p>
        </MiningPanel>
      </div>
    );
  }
  const isRunning = jobState === "queued" || jobState === "active";
  const isDone = jobState === "completed";
  const isFailed = jobState === "failed";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* ── Cave always fills the entire space ── */}
      <CavePanel plan="miner" isRunning={isRunning} />

      {/* ── Floating tab switcher ── */}
      <div style={{
        position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
        zIndex: 30, display: "flex", gap: 4,
        background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "4px",
        backdropFilter: "blur(8px)",
      }}>
        {(["cave", "config"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: "pointer", border: "none", transition: "all 0.15s",
              color: activeTab === tab ? "#00FF88" : "rgba(255,255,255,0.4)",
              background: activeTab === tab ? "rgba(0,255,136,0.1)" : "transparent",
              outline: activeTab === tab ? "1px solid rgba(0,255,136,0.2)" : "none",
            }}
          >
            {tab === "cave" ? "⛏ Cave View" : "⚙ Configure Run"}
          </button>
        ))}
      </div>

      {/* ── Config overlay (slides in over the cave) ── */}
      {activeTab === "config" && (
      <div style={{
        position: "absolute", inset: 0, zIndex: 20,
        background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)",
        overflowY: "auto", padding: "64px 24px 24px",
      }}>
      <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-200">
          Mining Config
        </h2>
        <p className="text-sm text-neutral-600 mt-1">
          Configure and launch a new lead mining run
        </p>
      </div>

      {/* Config form */}
      <MiningPanel gemAccent="green" carved padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Vertical selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
              Industry Vertical
            </label>
            <select
              value={verticalId}
              onChange={(e) => setVerticalId(e.target.value)}
              disabled={isRunning}
              className="w-full rounded-lg px-4 py-2.5 text-sm text-neutral-200 border focus:outline-none transition-colors appearance-none cursor-pointer"
              style={{
                background: CAVE.surface1,
                borderColor: CAVE.stoneEdge,
              }}
            >
              <option value="" disabled>
                Select a vertical...
              </option>
              {VERTICALS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Location input */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
              <MapPin className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              Target Locations
            </label>
            <input
              type="text"
              value={locations}
              onChange={(e) => setLocations(e.target.value)}
              disabled={isRunning}
              placeholder="Austin TX, Dallas TX, Houston TX"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-600 border focus:outline-none transition-colors"
              style={{
                background: CAVE.surface1,
                borderColor: CAVE.stoneEdge,
              }}
            />
            <p className="text-[10px] text-neutral-600 mt-1">
              Comma-separated list of cities
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={
              !verticalId || !locations.trim() || submitting || isRunning
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${GEM.green}, #00CC66)`,
              color: "#000",
              boxShadow: `0 2px 12px rgba(0,255,136,0.25)`,
            }}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Pickaxe className="w-4 h-4" />
            )}
            {submitting ? "Starting..." : "Start Mining Run"}
          </button>
        </form>
      </MiningPanel>

      {/* Progress section */}
      {(isRunning || isDone || isFailed) && (
        <GlowBorder
          variant={isFailed ? "red" : isDone ? "green" : "yellow"}
          intensity="medium"
        >
          <MiningPanel
            status={isFailed ? "red" : isDone ? "green" : "yellow"}
            padding="lg"
          >
            <div className="space-y-4">
              {/* Status header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRunning && (
                    <Loader2
                      className="w-4 h-4 animate-spin"
                      style={{ color: GEM.yellow }}
                    />
                  )}
                  {isDone && (
                    <CheckCircle2
                      className="w-4 h-4"
                      style={{ color: GEM.green }}
                    />
                  )}
                  {isFailed && (
                    <XCircle
                      className="w-4 h-4"
                      style={{ color: GEM.red }}
                    />
                  )}
                  <span className="text-sm font-medium text-neutral-200">
                    {isRunning && "Mining in progress..."}
                    {isDone && "Mining complete"}
                    {isFailed && "Mining failed"}
                  </span>
                </div>
                {(isDone || isFailed) && (
                  <button
                    onClick={resetJob}
                    className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    New run
                  </button>
                )}
              </div>

              {/* Phase progress bar */}
              {progress && (
                <MiningProgress phase={toDisplayPhase(progress.phase)} />
              )}

              {/* Live stats */}
              {progress && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCell label="Found" value={progress.recordsFound} />
                  <StatCell
                    label="Enriched"
                    value={progress.recordsEnriched}
                  />
                  <StatCell label="Saved" value={progress.recordsSaved} />
                  <StatCell
                    label="Errors"
                    value={progress.errors.length}
                    variant={progress.errors.length > 0 ? "red" : undefined}
                  />
                </div>
              )}

              {/* Error detail */}
              {isFailed && error && (
                <div
                  className="flex items-start gap-2 rounded-lg p-3"
                  style={{
                    background: GLOW.red.bg,
                    border: `1px solid ${GLOW.red.border}`,
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 shrink-0"
                    style={{ color: GEM.red }}
                  />
                  <p className="text-xs text-neutral-300">{error}</p>
                </div>
              )}

              {/* Completion summary */}
              {isDone && progress && (
                <div
                  className="rounded-lg p-4 space-y-3"
                  style={{
                    background: CAVE.surface1,
                    border: `1px solid ${CAVE.stoneEdge}`,
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">
                    Run Summary
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCell
                      label="Total found"
                      value={progress.recordsFound}
                    />
                    <StatCell
                      label="Saved"
                      value={progress.recordsSaved}
                    />
                    <StatCell
                      label="Duplicates skipped"
                      value={progress.duplicatesSkipped}
                    />
                  </div>

                  {/* Gem grade breakdown from result */}
                  {result && !!(result as Record<string, unknown>).gradeBreakdown && (
                    <div className="pt-2 border-t" style={{ borderColor: CAVE.stoneMid }}>
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium mb-2">
                        Grade Breakdown
                      </p>
                      <div className="flex gap-4">
                        {Object.entries(
                          (result as Record<string, unknown>).gradeBreakdown as Record<string, number>
                        ).map(([grade, count]) => (
                          <div key={grade} className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                background:
                                  grade === "elite"
                                    ? GEM.green
                                    : grade === "refined"
                                    ? GEM.yellow
                                    : GEM.red,
                              }}
                            />
                            <span className="text-xs text-neutral-300 capitalize">
                              {grade}
                            </span>
                            <span className="text-xs font-semibold text-neutral-200">
                              {count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </MiningPanel>
        </GlowBorder>
      )}

      {/* Mining History */}
      {clientId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <h3 className="text-sm font-semibold text-neutral-300">
              Mining History
            </h3>
          </div>

          {historyLoading ? (
            <MiningPanel padding="lg">
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
              </div>
            </MiningPanel>
          ) : history.length === 0 ? (
            <MiningPanel padding="lg">
              <p className="text-sm text-neutral-600 text-center py-6">
                No mining runs yet
              </p>
            </MiningPanel>
          ) : (
            <div className="space-y-2">
              {history.map((entry) => (
                <MiningPanel key={entry.date} padding="sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-neutral-400">
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-sm font-semibold text-neutral-200">
                        {entry.total} lead{entry.total !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.elite > 0 && (
                        <GradeChip
                          label="Elite"
                          count={entry.elite}
                          color={GEM.green}
                        />
                      )}
                      {entry.refined > 0 && (
                        <GradeChip
                          label="Refined"
                          count={entry.refined}
                          color={GEM.yellow}
                        />
                      )}
                      {entry.rock > 0 && (
                        <GradeChip
                          label="Rock"
                          count={entry.rock}
                          color={GEM.red}
                        />
                      )}
                    </div>
                  </div>
                </MiningPanel>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
      </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${month}/${day}/${year}`;
}

function GradeChip({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[11px] text-neutral-400">{label}</span>
      <span className="text-[11px] font-semibold text-neutral-300">
        {count}
      </span>
    </div>
  );
}

// ── Stat cell ───────────────────────────────────────────────────────────────

function StatCell({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "red" | "green" | "yellow";
}) {
  return (
    <div
      className="rounded-lg p-2.5 text-center"
      style={{
        background: CAVE.surface1,
        border: `1px solid ${CAVE.stoneMid}`,
      }}
    >
      <p className="text-[10px] uppercase tracking-wider text-neutral-600">
        {label}
      </p>
      <p
        className="text-lg font-bold mt-0.5"
        style={{
          color: variant ? GEM[variant] : "#e5e5e5",
        }}
      >
        {value}
      </p>
    </div>
  );
}
