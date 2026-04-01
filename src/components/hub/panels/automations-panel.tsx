"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Zap, Mail, Phone, MessageSquare, FileText, BarChart3,
  RefreshCw, Play, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Sparkles, Copy, Check, X, Loader2,
  ArrowRight, TrendingUp, Activity,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutomationStatus {
  sequences: {
    activeLeads:   number
    pendingSteps:  number
    nextFiresAt:   string | null
    nextChannel:   string | null
  }
  outreach: {
    emailQueued:  number
    smsQueued:    number
    recentDrafts: RecentDraft[]
  }
  calls: {
    today:           number
    thisWeek:        number
    appointmentRate: number
  }
  activity: ActivityEvent[]
}

interface RecentDraft {
  id:         string
  channel:    string
  tone:       string
  status:     string
  subject:    string | null
  created_at: string
}

interface ActivityEvent {
  id:          string
  event_type:  string
  title:       string
  description: string
  icon:        string
  severity:    string
  created_at:  string
}

type ContentType = "social_post" | "listing_description" | "market_summary" | "email_newsletter" | "cold_script"

interface GeneratedContent {
  type:     ContentType
  subject:  string | null
  body:     string
  fullText: string
}

export interface AutomationsPanelProps {
  isActive?:   boolean
  realtorSlug?: string
  plan?:       string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeUntil(isoDate: string): string {
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff <= 0) return "now"
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d`
  if (h > 0)   return `${h}h ${m}m`
  return `${m}m`
}

function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1)   return "just now"
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SEVERITY_COLOR: Record<string, string> = {
  success: "#00FF88",
  warning: "#FFD60A",
  error:   "#FF4040",
  info:    "#60A5FA",
}

// ── Content type config ───────────────────────────────────────────────────────

const CONTENT_TYPES: {
  type:        ContentType
  label:       string
  description: string
  platforms?:  string[]
}[] = [
  { type: "social_post",         label: "Social Post",         description: "LinkedIn, Instagram or Facebook",   platforms: ["linkedin", "instagram", "facebook"] },
  { type: "listing_description", label: "Listing Description", description: "Compelling property copy"           },
  { type: "market_summary",      label: "Market Summary",      description: "Share with buyers and sellers"      },
  { type: "email_newsletter",    label: "Email Newsletter",    description: "Monthly client update"              },
  { type: "cold_script",         label: "Cold Call Script",    description: "Outbound phone script"              },
]

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div style={{
      background:   "rgba(255,255,255,0.04)",
      border:       `1px solid ${accent ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 8,
      padding:      "10px 14px",
      minWidth:     100,
    }}>
      <p style={{ margin: 0, fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: accent ? "#00FF88" : "#e5e5e5", lineHeight: 1 }}>{value}</p>
    </div>
  )
}

// ── Automation card ───────────────────────────────────────────────────────────

function AutomationCard({
  icon: Icon,
  label,
  status,
  statusLabel,
  metric,
  metricLabel,
  detail,
  onAction,
  actionLabel = "View",
  accentColor = "#00FF88",
}: {
  icon:          React.ElementType
  label:         string
  status:        "active" | "idle" | "needs_setup"
  statusLabel:   string
  metric:        string | number
  metricLabel:   string
  detail?:       string
  onAction?:     () => void
  actionLabel?:  string
  accentColor?:  string
}) {
  const statusColors = {
    active:      { dot: "#00FF88", text: "#00FF88", bg: "rgba(0,255,136,0.08)", border: "rgba(0,255,136,0.15)" },
    idle:        { dot: "#555",    text: "#555",    bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
    needs_setup: { dot: "#FFD60A", text: "#FFD60A", bg: "rgba(255,214,10,0.06)", border: "rgba(255,214,10,0.15)" },
  }
  const sc = statusColors[status]

  return (
    <div style={{
      background:   "#111",
      border:       "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding:      "16px",
      display:      "flex",
      flexDirection: "column",
      gap:          10,
      transition:   "border-color 0.15s",
      cursor:       "default",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `rgba(${accentColor === "#00FF88" ? "0,255,136" : accentColor === "#60A5FA" ? "96,165,250" : accentColor === "#FFD60A" ? "255,214,10" : "255,136,255"},0.1)`,
            border:     `1px solid rgba(${accentColor === "#00FF88" ? "0,255,136" : accentColor === "#60A5FA" ? "96,165,250" : accentColor === "#FFD60A" ? "255,214,10" : "255,136,255"},0.2)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={15} color={accentColor} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>{label}</span>
        </div>
        {/* Status badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "3px 8px", borderRadius: 20,
          background: sc.bg, border: `1px solid ${sc.border}`,
          fontSize: 10, fontWeight: 600, color: sc.text,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, display: "inline-block",
            boxShadow: status === "active" ? `0 0 6px ${sc.dot}` : "none" }} />
          {statusLabel}
        </div>
      </div>

      {/* Metric */}
      <div>
        <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: status === "active" ? accentColor : "#777", lineHeight: 1 }}>
          {metric}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#444" }}>{metricLabel}</p>
      </div>

      {/* Detail */}
      {detail && (
        <p style={{ margin: 0, fontSize: 11, color: "#555", lineHeight: 1.4 }}>{detail}</p>
      )}

      {/* Action */}
      {onAction && (
        <button onClick={onAction} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "7px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
          color:      status === "needs_setup" ? "#FFD60A" : accentColor,
          background: "rgba(255,255,255,0.04)",
          border:     "1px solid rgba(255,255,255,0.07)",
          cursor:     "pointer", width: "100%",
        }}>
          {actionLabel} <ChevronRight size={11} />
        </button>
      )}
    </div>
  )
}

// ── Content generator drawer ──────────────────────────────────────────────────

function ContentGeneratorDrawer({ onClose }: { onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<ContentType>("social_post")
  const [platform,     setPlatform]     = useState("linkedin")
  const [tone,         setTone]         = useState("professional")
  const [context,      setContext]      = useState("")
  const [loading,      setLoading]      = useState(false)
  const [generated,    setGenerated]    = useState<GeneratedContent | null>(null)
  const [copied,       setCopied]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  const typeConfig = CONTENT_TYPES.find(t => t.type === selectedType)!

  const generate = async () => {
    setLoading(true)
    setGenerated(null)
    setError(null)
    try {
      const res = await fetch("/api/automation/content", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type: selectedType, platform, tone, context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setGenerated(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const copy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated.subject ? `Subject: ${generated.subject}\n\n${generated.body}` : generated.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxHeight: "80vh",
        background: "#0d0d0d",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px 16px 0 0",
        padding: "24px",
        overflow: "auto",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} color="#00FF88" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#e5e5e5" }}>AI Content Generator</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {/* Config column */}
          <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Content type */}
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Content Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {CONTENT_TYPES.map(ct => (
                  <button key={ct.type} onClick={() => setSelectedType(ct.type)} style={{
                    display:    "flex", alignItems: "center", gap: 10,
                    padding:    "9px 12px", borderRadius: 8,
                    background: selectedType === ct.type ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)",
                    border:     `1px solid ${selectedType === ct.type ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.06)"}`,
                    cursor:     "pointer", textAlign: "left",
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: selectedType === ct.type ? "#00FF88" : "#ccc" }}>{ct.label}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "#555" }}>{ct.description}</p>
                    </div>
                    {selectedType === ct.type && <CheckCircle2 size={13} color="#00FF88" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform (for social) */}
            {typeConfig.platforms && (
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Platform</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {typeConfig.platforms.map(p => (
                    <button key={p} onClick={() => setPlatform(p)} style={{
                      flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      textTransform: "capitalize",
                      background: platform === p ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.04)",
                      border:     `1px solid ${platform === p ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.07)"}`,
                      color:      platform === p ? "#00FF88" : "#666",
                      cursor:     "pointer",
                    }}>{p}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Tone */}
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Tone</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["professional", "casual", "urgent"].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    textTransform: "capitalize",
                    background: tone === t ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.04)",
                    border:     `1px solid ${tone === t ? "rgba(0,255,136,0.25)" : "rgba(255,255,255,0.07)"}`,
                    color:      tone === t ? "#00FF88" : "#666",
                    cursor:     "pointer",
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Context (optional)</label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Add details: neighborhood, property type, market stats, target audience…"
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#e5e5e5", fontSize: 12, resize: "vertical",
                  outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
              />
            </div>

            <button onClick={generate} disabled={loading} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "12px 0", borderRadius: 8, fontSize: 13, fontWeight: 700,
              background: loading ? "rgba(0,255,136,0.06)" : "rgba(0,255,136,0.12)",
              border: "1px solid rgba(0,255,136,0.3)",
              color: "#00FF88", cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : <><Sparkles size={14} /> Generate</>}
            </button>
          </div>

          {/* Output column */}
          <div style={{ flex: 1, minWidth: 280 }}>
            {error && (
              <div style={{ padding: "12px 14px", background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.2)", borderRadius: 8, fontSize: 12, color: "#FF4040" }}>
                <AlertCircle size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />{error}
              </div>
            )}

            {!generated && !loading && !error && (
              <div style={{
                height: "100%", minHeight: 200, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: 12,
              }}>
                <Sparkles size={28} color="#333" />
                <p style={{ margin: 0, fontSize: 13, color: "#444" }}>Configure and click Generate</p>
              </div>
            )}

            {loading && (
              <div style={{
                height: "100%", minHeight: 200, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 12,
              }}>
                <Loader2 size={24} color="#00FF88" style={{ animation: "spin 1s linear infinite" }} />
                <p style={{ margin: 0, fontSize: 13, color: "#555" }}>Claude is writing your content…</p>
              </div>
            )}

            {generated && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {generated.subject && (
                  <div style={{ padding: "10px 14px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 10, color: "#00FF88", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Subject</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>{generated.subject}</p>
                  </div>
                )}

                <div style={{ position: "relative" }}>
                  <pre style={{
                    margin: 0, padding: "14px", borderRadius: 10,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 12, color: "#ccc", whiteSpace: "pre-wrap", lineHeight: 1.6,
                    fontFamily: "inherit", maxHeight: 320, overflow: "auto",
                  }}>{generated.body}</pre>

                  <button onClick={copy} style={{
                    position: "absolute", top: 10, right: 10,
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)",
                    color: copied ? "#00FF88" : "#888", cursor: "pointer",
                  }}>
                    {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>

                <button onClick={generate} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "9px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#888", cursor: "pointer",
                }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function AutomationsPanel({ isActive }: AutomationsPanelProps) {
  const [status,     setStatus]     = useState<AutomationStatus | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [hasLoaded,  setHasLoaded]  = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch("/api/automation/status")
      const data = await res.json()
      if (res.ok) setStatus(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isActive && !hasLoaded) {
      fetchStatus()
      setHasLoaded(true)
    }
  }, [isActive, hasLoaded, fetchStatus])

  // Auto-refresh every 30s when active
  useEffect(() => {
    if (!isActive) return
    const t = setInterval(fetchStatus, 30_000)
    return () => clearInterval(t)
  }, [isActive, fetchStatus])

  const seq      = status?.sequences
  const outreach = status?.outreach
  const calls    = status?.calls

  const totalPending = (seq?.pendingSteps ?? 0) + (outreach?.emailQueued ?? 0) + (outreach?.smsQueued ?? 0)
  const isLive       = totalPending > 0 || (calls?.today ?? 0) > 0

  return (
    <div style={{
      position: "relative", inset: 0, width: "100%", height: "100%",
      background: "#0a0a0a", display: "flex", flexDirection: "column",
      fontFamily: "inherit", overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <Activity size={18} color="#00FF88" />
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e5e5e5" }}>Automation Center</h2>
            {isLive && (
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)",
                color: "#00FF88",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00FF88", display: "inline-block", animation: "pulse 2s infinite" }} />
                LIVE
              </div>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#444" }}>AI agents running 24/7 across your sales pipeline</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowDrawer(true)} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)",
            color: "#00FF88", cursor: "pointer",
          }}>
            <Sparkles size={13} /> Generate Content
          </button>
          <button onClick={fetchStatus} disabled={loading} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            color: "#555", cursor: "pointer",
          }}>
            <RefreshCw size={13} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        display: "flex", gap: 10, flexWrap: "wrap",
        flexShrink: 0,
      }}>
        <StatChip label="Active Leads in Sequence" value={seq?.activeLeads  ?? "—"} accent={(seq?.activeLeads ?? 0) > 0} />
        <StatChip label="Pending Steps"            value={seq?.pendingSteps ?? "—"} accent={(seq?.pendingSteps ?? 0) > 0} />
        <StatChip label="Emails Queued"            value={outreach?.emailQueued ?? "—"} />
        <StatChip label="SMS Queued"               value={outreach?.smsQueued  ?? "—"} />
        <StatChip label="Calls Today"              value={calls?.today ?? "—"} accent={(calls?.today ?? 0) > 0} />
        <StatChip label="Appt Rate (7d)"           value={calls ? `${calls.appointmentRate}%` : "—"} />
      </div>

      {/* ── Body: cards + feed ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", gap: 0 }}>

        {/* Left: automation cards */}
        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px" }}>
          <p style={{ margin: "0 0 14px", fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Active Automations</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>

            {/* Follow-Up Sequences */}
            <AutomationCard
              icon={Zap}
              label="Follow-Up Sequences"
              status={seq && seq.activeLeads > 0 ? "active" : "idle"}
              statusLabel={seq && seq.activeLeads > 0 ? "Running" : "Idle"}
              metric={seq?.activeLeads ?? 0}
              metricLabel="leads in active sequence"
              detail={seq?.nextFiresAt
                ? `Next step (${seq.nextChannel}) fires in ${timeUntil(seq.nextFiresAt)}`
                : "No steps scheduled"}
              accentColor="#00FF88"
              actionLabel="View Sequences"
              onAction={() => {}}
            />

            {/* AI Calls */}
            <AutomationCard
              icon={Phone}
              label="AI Outbound Calls"
              status={calls && calls.today > 0 ? "active" : "idle"}
              statusLabel={calls && calls.today > 0 ? "Active" : "Idle"}
              metric={calls?.today ?? 0}
              metricLabel="calls placed today"
              detail={calls?.thisWeek ? `${calls.thisWeek} this week · ${calls.appointmentRate}% book rate` : undefined}
              accentColor="#60A5FA"
              actionLabel="Call Queue"
              onAction={() => {}}
            />

            {/* Email Outreach */}
            <AutomationCard
              icon={Mail}
              label="Email Outreach"
              status={outreach && outreach.emailQueued > 0 ? "active" : "idle"}
              statusLabel={outreach && outreach.emailQueued > 0 ? `${outreach.emailQueued} queued` : "No drafts"}
              metric={outreach?.emailQueued ?? 0}
              metricLabel="drafts ready to send"
              detail="AI-written, ready for Resend"
              accentColor="#00FF88"
              actionLabel="Review Drafts"
              onAction={() => {}}
            />

            {/* SMS Follow-Ups */}
            <AutomationCard
              icon={MessageSquare}
              label="SMS Follow-Ups"
              status={outreach && outreach.smsQueued > 0 ? "active" : "idle"}
              statusLabel={outreach && outreach.smsQueued > 0 ? `${outreach.smsQueued} queued` : "No SMS"}
              metric={outreach?.smsQueued ?? 0}
              metricLabel="SMS drafts ready"
              detail="Auto-generated on day 3 of sequence"
              accentColor="#FFD60A"
              actionLabel="Review SMS"
              onAction={() => {}}
            />

            {/* Content Generator */}
            <AutomationCard
              icon={Sparkles}
              label="Content Generator"
              status="active"
              statusLabel="On Demand"
              metric="5 types"
              metricLabel="social, listing, market, email, script"
              detail="Claude writes it, you approve it"
              accentColor="#FF88FF"
              actionLabel="Generate Now"
              onAction={() => setShowDrawer(true)}
            />

            {/* Market Reports */}
            <AutomationCard
              icon={BarChart3}
              label="Market Reports"
              status="needs_setup"
              statusLabel="Setup Required"
              metric="—"
              metricLabel="weekly auto-send"
              detail="Configure client list to enable"
              accentColor="#FFD60A"
              actionLabel="Configure"
              onAction={() => {}}
            />

          </div>

          {/* ── Recent outreach drafts ── */}
          {outreach?.recentDrafts && outreach.recentDrafts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Drafts</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {outreach.recentDrafts.map(draft => (
                  <div key={draft.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {draft.channel === "email" && <Mail size={12} color="#60A5FA" />}
                      {draft.channel === "sms"   && <MessageSquare size={12} color="#FFD60A" />}
                      {draft.channel === "call_script" && <FileText size={12} color="#00FF88" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {draft.subject ?? `${draft.channel.replace("_", " ")} draft`}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: "#444" }}>{relativeTime(draft.created_at)} · {draft.tone}</p>
                    </div>
                    <span style={{
                      padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                      background: draft.status === "queued_to_send" ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${draft.status === "queued_to_send" ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.07)"}`,
                      color: draft.status === "queued_to_send" ? "#00FF88" : "#555",
                    }}>{draft.status.replace(/_/g, " ")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: activity feed */}
        <div style={{
          width: 280, flexShrink: 0,
          borderLeft: "1px solid rgba(255,255,255,0.06)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 18px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ margin: 0, fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Feed</p>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "10px 0" }}>
            {status?.activity && status.activity.length > 0 ? (
              status.activity.map(event => (
                <div key={event.id} style={{
                  padding: "10px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: SEVERITY_COLOR[event.severity] ?? "#555",
                    boxShadow: event.severity === "success" ? "0 0 6px #00FF88" : "none",
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ccc", lineHeight: 1.3 }}>{event.title}</p>
                    {event.description && (
                      <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555", lineHeight: 1.4 }}>{event.description}</p>
                    )}
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "#333" }}>{relativeTime(event.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "40px 18px", textAlign: "center" }}>
                <TrendingUp size={24} color="#222" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#333" }}>No activity yet</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#2a2a2a" }}>Events will appear as automations run</p>
              </div>
            )}
          </div>

          {/* Bottom: quick run actions */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Score All New Leads",    icon: TrendingUp,    href: "/api/leads/score"   },
                { label: "Generate Social Post",   icon: Sparkles,      onClick: () => setShowDrawer(true) },
                { label: "View Outreach Queue",    icon: Mail,          href: "/dashboard/hub"     },
              ].map(action => (
                <button key={action.label} onClick={action.onClick} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 7, fontSize: 11, fontWeight: 500,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  color: "#666", cursor: "pointer", textAlign: "left",
                }}>
                  <action.icon size={12} />
                  {action.label}
                  <ArrowRight size={10} style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content generator drawer ── */}
      {showDrawer && <ContentGeneratorDrawer onClose={() => setShowDrawer(false)} />}

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.4 } }
      `}</style>
    </div>
  )
}
