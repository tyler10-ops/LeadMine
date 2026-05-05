"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Zap, Mail, Phone, MessageSquare, BarChart3,
  RefreshCw, ChevronRight, CheckCircle2,
  AlertCircle, Sparkles, Copy, Check, X, Loader2,
  TrendingUp, Activity, FileText, ArrowRight,
} from "lucide-react"
import { GEM, CAVE } from "@/lib/cave-theme"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AutomationStatus {
  sequences: { activeLeads: number; pendingSteps: number; nextFiresAt: string | null; nextChannel: string | null }
  outreach:  { emailQueued: number; smsQueued: number; recentDrafts: RecentDraft[] }
  calls:     { today: number; thisWeek: number; appointmentRate: number }
  activity:  ActivityEvent[]
}

interface RecentDraft {
  id: string; channel: string; tone: string; status: string; subject: string | null; created_at: string
}

interface ActivityEvent {
  id: string; event_type: string; title: string; description: string; icon: string; severity: string; created_at: string
}

type ContentType = "social_post" | "listing_description" | "market_summary" | "email_newsletter" | "cold_script"

interface GeneratedContent { type: ContentType; subject: string | null; body: string; fullText: string }

export interface AutomationsPanelProps { isActive?: boolean; realtorSlug?: string; plan?: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeUntil(iso: string) {
  const d = new Date(iso).getTime() - Date.now()
  if (d <= 0) return "now"
  const h = Math.floor(d / 3_600_000), m = Math.floor((d % 3_600_000) / 60_000)
  if (h >= 24) return `${Math.floor(h / 24)}d`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function relativeTime(iso: string) {
  const d = Date.now() - new Date(iso).getTime()
  const m = Math.floor(d / 60_000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SEV_COLOR: Record<string, string> = { success: GEM.green, warning: GEM.yellow, error: "#FF4040", info: "#60A5FA" }

// ── 3D Animated Visuals ───────────────────────────────────────────────────────

// 1. Orbital rings — Follow-Up Sequences
function OrbitViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {/* Outer orbital ring */}
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 5s linear infinite" }}>
        <ellipse cx="45" cy="45" rx="38" ry="14" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
        <circle cx="45" cy="31" r="4.5" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      </g>
      {/* Inner orbital ring */}
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-b 3.2s linear infinite reverse" }}>
        <ellipse cx="45" cy="45" rx="22" ry="8" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="45" cy="37" r="2.8" fill={color} fillOpacity="0.75" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      </g>
      {/* Third tiny ring */}
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 2.1s linear infinite" }}>
        <circle cx="45" cy="41" r="1.8" fill={color} fillOpacity="0.5" />
      </g>
      {/* Core */}
      <circle cx="45" cy="45" r="9" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      <circle cx="45" cy="45" r="4" fill={color} fillOpacity="0.9" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}

// 2. Sonar ping — AI Calls
function SonarViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {[0, 1, 2].map(i => (
        <circle key={i} cx="45" cy="45" r="12"
          fill="none" stroke={color} strokeWidth="1.5"
          style={{ animation: `am-sonar 2.4s ease-out ${i * 0.8}s infinite`, transformOrigin: "45px 45px" }}
        />
      ))}
      {/* Center phone icon — drawn as SVG */}
      <rect x="38" y="33" width="14" height="24" rx="3" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />
      <rect x="41" y="36" width="8" height="11" rx="1" fill={color} fillOpacity="0.35" />
      <circle cx="45" cy="52" r="1.5" fill={color} fillOpacity="0.7" />
      <circle cx="45" cy="45" r="5" fill={color} fillOpacity="0.12" />
    </svg>
  )
}

// 3. Floating envelope — Email Outreach
function EnvelopeViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {/* Floating envelope */}
      <g style={{ animation: "am-float 3s ease-in-out infinite", transformOrigin: "45px 45px" }}>
        <rect x="23" y="34" width="44" height="28" rx="4" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.3" strokeOpacity="0.4" />
        <polyline points="23,34 45,50 67,34" fill="none" stroke={color} strokeWidth="1.3" strokeOpacity="0.5" />
      </g>
      {/* Rising particles */}
      {[0, 1, 2].map(i => (
        <circle key={i} cx={38 + i * 7} cy="30" r="2"
          fill={color} fillOpacity="0.6"
          style={{ animation: `am-rise 2s ease-out ${i * 0.55}s infinite`, transformOrigin: `${38 + i * 7}px 30px` }}
        />
      ))}
      {/* Glow */}
      <circle cx="45" cy="45" r="20" fill={color} fillOpacity="0.04" />
    </svg>
  )
}

// 4. Chat bubbles — SMS
function BubbleViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {/* Left bubble */}
      <g style={{ animation: "am-float 2.6s ease-in-out infinite" }}>
        <rect x="14" y="30" width="36" height="22" rx="8" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
        <polygon points="20,52 14,60 28,52" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" strokeOpacity="0.3" />
        {/* Typing dots */}
        {[0, 1, 2].map(i => (
          <circle key={i} cx={25 + i * 8} cy="41" r="2.5" fill={color}
            style={{ animation: `am-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </g>
      {/* Right bubble */}
      <g style={{ animation: "am-float 2.6s ease-in-out 1.3s infinite" }}>
        <rect x="40" y="48" width="36" height="22" rx="8" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
        <polygon points="70,70 76,78 62,70" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
        <rect x="47" y="55" width="20" height="3" rx="1.5" fill={color} fillOpacity="0.4" />
        <rect x="47" y="61" width="14" height="3" rx="1.5" fill={color} fillOpacity="0.25" />
      </g>
    </svg>
  )
}

// 5. Sparkle spin — Content Generator
function SparkleViz({ color }: { color: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    const r1 = 14, r2 = 32
    return { x1: 45 + r1 * Math.cos(a), y1: 45 + r1 * Math.sin(a), x2: 45 + r2 * Math.cos(a), y2: 45 + r2 * Math.sin(a) }
  })
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 8s linear infinite" }}>
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
            stroke={color} strokeWidth={i % 2 === 0 ? 1.5 : 0.8} strokeOpacity={i % 2 === 0 ? 0.7 : 0.4}
            style={{ filter: `drop-shadow(0 0 2px ${color})` }}
          />
        ))}
        {/* Diamond tips */}
        {rays.filter((_, i) => i % 2 === 0).map((r, i) => (
          <circle key={i} cx={r.x2} cy={r.y2} r="2.5" fill={color} fillOpacity="0.8" style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        ))}
      </g>
      {/* Center pulse */}
      <circle cx="45" cy="45" r="10" fill={color} fillOpacity="0.08" style={{ animation: "am-pulse 2s ease-in-out infinite" }} />
      <circle cx="45" cy="45" r="5" fill={color} fillOpacity="0.9" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  )
}

// 6. Animated bars — Market Reports
function BarsViz({ color }: { color: string }) {
  const bars = [
    { x: 16, delay: "0s",    h: 30 },
    { x: 29, delay: "0.3s",  h: 48 },
    { x: 42, delay: "0.15s", h: 38 },
    { x: 55, delay: "0.45s", h: 55 },
    { x: 68, delay: "0.1s",  h: 28 },
  ]
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {/* Grid lines */}
      {[0, 1, 2].map(i => (
        <line key={i} x1="12" y1={25 + i * 16} x2="78" y2={25 + i * 16} stroke={color} strokeWidth="0.5" strokeOpacity="0.08" />
      ))}
      {bars.map((b, i) => (
        <g key={i}>
          {/* Bar */}
          <rect x={b.x} y={90 - b.h - 10} width="9" height={b.h} rx="2"
            fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" strokeOpacity="0.35"
            style={{ animation: `am-bar-${i} 2.5s ease-in-out ${b.delay} infinite`, transformOrigin: `${b.x + 4}px 80px` }}
          />
          {/* Glowing top */}
          <rect x={b.x} y={90 - b.h - 12} width="9" height="3" rx="1.5"
            fill={color}
            style={{ animation: `am-bar-${i} 2.5s ease-in-out ${b.delay} infinite`, filter: `drop-shadow(0 0 4px ${color})`, transformOrigin: `${b.x + 4}px 80px` }}
          />
        </g>
      ))}
    </svg>
  )
}

// ── Auto Card with 3D tilt ─────────────────────────────────────────────────────

type CardStatus = "active" | "idle" | "needs_setup"

function AutoCard({
  viz, label, status, statusLabel, metric, metricLabel, detail, onAction, actionLabel = "View", color = GEM.green,
}: {
  viz:          React.ReactNode
  label:        string
  status:       CardStatus
  statusLabel:  string
  metric:       string | number
  metricLabel:  string
  detail?:      string
  onAction?:    () => void
  actionLabel?: string
  color?:       string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateZ(4px)`
    el.style.transition = "transform 0.05s linear"
  }

  const handleMouseLeave = () => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = "perspective(700px) rotateX(0deg) rotateY(0deg) translateZ(0)"
    el.style.transition = "transform 0.4s cubic-bezier(0.23,1,0.32,1)"
  }

  const SC: Record<CardStatus, { dot: string; text: string; bg: string; border: string }> = {
    active:      { dot: GEM.green,  text: GEM.green,  bg: `${GEM.green}10`,  border: `${GEM.green}25`  },
    idle:        { dot: "#444",     text: "#444",     bg: "rgba(255,255,255,0.03)", border: "rgba(255,255,255,0.06)" },
    needs_setup: { dot: GEM.yellow, text: GEM.yellow, bg: `${GEM.yellow}0d`, border: `${GEM.yellow}25` },
  }
  const sc = SC[status]

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background:    CAVE.stoneDeep,
        border:        `1px solid ${status === "active" ? `${color}20` : CAVE.stoneEdge}`,
        borderRadius:  16,
        overflow:      "hidden",
        display:       "flex",
        flexDirection: "column",
        boxShadow:     status === "active" ? `0 0 24px ${color}08` : "none",
        willChange:    "transform",
      }}
    >
      {/* Viz zone */}
      <div style={{
        height:          120,
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "center",
        background:      `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`,
        borderBottom:    `1px solid ${color}12`,
        position:        "relative",
        overflow:        "hidden",
      }}>
        {/* Subtle grid bg */}
        <div style={{
          position:   "absolute", inset: 0,
          backgroundImage: `radial-gradient(circle, ${color}06 1px, transparent 1px)`,
          backgroundSize:  "18px 18px",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>{viz}</div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Label + status */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0" }}>{label}</span>
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "3px 8px", borderRadius: 20, flexShrink: 0,
            background: sc.bg, border: `1px solid ${sc.border}`,
            fontSize: 10, fontWeight: 700, color: sc.text,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: sc.dot,
              boxShadow: status === "active" ? `0 0 6px ${sc.dot}` : "none",
              display: "inline-block",
            }} />
            {statusLabel}
          </div>
        </div>

        {/* Metric */}
        <div>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1, color: status === "idle" ? "#444" : color }}>
            {metric}
          </p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#444" }}>{metricLabel}</p>
        </div>

        {detail && <p style={{ margin: 0, fontSize: 11, color: "#3a3a3a", lineHeight: 1.5 }}>{detail}</p>}

        {onAction && (
          <button onClick={onAction} style={{
            marginTop: "auto",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 600,
            color:      status === "needs_setup" ? GEM.yellow : color,
            background: "rgba(255,255,255,0.03)",
            border:     `1px solid ${status === "active" ? `${color}20` : "rgba(255,255,255,0.07)"}`,
            cursor:     "pointer", width: "100%",
          }}>
            {actionLabel} <ChevronRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Content generator drawer ──────────────────────────────────────────────────

const CONTENT_TYPES: { type: ContentType; label: string; description: string; platforms?: string[] }[] = [
  { type: "social_post",         label: "Social Post",         description: "LinkedIn, Instagram or Facebook", platforms: ["linkedin", "instagram", "facebook"] },
  { type: "listing_description", label: "Listing Description", description: "Compelling property copy"          },
  { type: "market_summary",      label: "Market Summary",      description: "Share with buyers and sellers"     },
  { type: "email_newsletter",    label: "Email Newsletter",    description: "Monthly client update"             },
  { type: "cold_script",         label: "Cold Call Script",    description: "Outbound phone script"             },
]

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
    setLoading(true); setGenerated(null); setError(null)
    try {
      const res  = await fetch("/api/automation/content", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: selectedType, platform, tone, context }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Generation failed")
      setGenerated(data)
    } catch (err) { setError(err instanceof Error ? err.message : "Unknown error") }
    finally { setLoading(false) }
  }

  const copy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated.subject ? `Subject: ${generated.subject}\n\n${generated.body}` : generated.body)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  const inp: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}`,
    borderRadius: 8, padding: "8px 12px", color: "#e0e0e0", fontSize: 12,
    outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{
        position: "fixed", right: 0, top: 0, bottom: 0, zIndex: 50, width: 560,
        background: CAVE.deep, borderLeft: `1px solid ${CAVE.stoneMid}`,
        display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "-24px 0 48px rgba(0,0,0,0.5)",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${CAVE.stoneEdge}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={16} color={GEM.green} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#e5e5e5" }}>AI Content Generator</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Content type */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Content Type</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {CONTENT_TYPES.map(ct => (
                <button key={ct.type} onClick={() => setSelectedType(ct.type)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  background: selectedType === ct.type ? `${GEM.green}0d` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${selectedType === ct.type ? `${GEM.green}30` : "rgba(255,255,255,0.06)"}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: selectedType === ct.type ? GEM.green : "#ccc" }}>{ct.label}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "#555" }}>{ct.description}</p>
                  </div>
                  {selectedType === ct.type && <CheckCircle2 size={13} color={GEM.green} />}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          {typeConfig.platforms && (
            <div>
              <p style={{ margin: "0 0 6px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Platform</p>
              <div style={{ display: "flex", gap: 6 }}>
                {typeConfig.platforms.map(p => (
                  <button key={p} onClick={() => setPlatform(p)} style={{
                    flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, textTransform: "capitalize", cursor: "pointer",
                    background: platform === p ? `${GEM.green}10` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${platform === p ? `${GEM.green}30` : "rgba(255,255,255,0.07)"}`,
                    color: platform === p ? GEM.green : "#666",
                  }}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {/* Tone */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tone</p>
            <div style={{ display: "flex", gap: 6 }}>
              {["professional", "casual", "urgent"].map(t => (
                <button key={t} onClick={() => setTone(t)} style={{
                  flex: 1, padding: "7px 0", borderRadius: 7, fontSize: 11, fontWeight: 600, textTransform: "capitalize", cursor: "pointer",
                  background: tone === t ? `${GEM.green}10` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${tone === t ? `${GEM.green}30` : "rgba(255,255,255,0.07)"}`,
                  color: tone === t ? GEM.green : "#666",
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em" }}>Context</p>
            <textarea value={context} onChange={e => setContext(e.target.value)}
              placeholder="Add details: neighborhood, property type, market stats…" rows={3}
              style={{ ...inp, resize: "vertical" }} />
          </div>

          <button onClick={generate} disabled={loading} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "12px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: `${GEM.green}12`, border: `1px solid ${GEM.green}30`,
            color: GEM.green, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
          }}>
            {loading ? <><Loader2 size={14} style={{ animation: "am-spin 1s linear infinite" }} /> Generating…</> : <><Sparkles size={14} /> Generate</>}
          </button>

          {/* Output */}
          {error && (
            <div style={{ padding: "12px 14px", background: "rgba(255,64,64,0.08)", border: "1px solid rgba(255,64,64,0.2)", borderRadius: 8, fontSize: 12, color: "#FF4040" }}>
              <AlertCircle size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />{error}
            </div>
          )}

          {generated && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {generated.subject && (
                <div style={{ padding: "10px 14px", background: `${GEM.green}08`, border: `1px solid ${GEM.green}20`, borderRadius: 8 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 10, color: GEM.green, textTransform: "uppercase", letterSpacing: "0.06em" }}>Subject</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#e5e5e5" }}>{generated.subject}</p>
                </div>
              )}
              <div style={{ position: "relative" }}>
                <pre style={{ margin: 0, padding: "14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#ccc", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: "inherit", maxHeight: 280, overflow: "auto" }}>
                  {generated.body}
                </pre>
                <button onClick={copy} style={{
                  position: "absolute", top: 10, right: 10,
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)",
                  color: copied ? GEM.green : "#888", cursor: "pointer",
                }}>
                  {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
                </button>
              </div>
              <button onClick={generate} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px 0", borderRadius: 7, fontSize: 11, fontWeight: 600,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#888", cursor: "pointer",
              }}>
                <RefreshCw size={12} /> Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, color = "#444" }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 8, padding: "8px 14px", minWidth: 90, flexShrink: 0 }}>
      <p style={{ margin: 0, fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color: value === "—" || value === 0 ? "#333" : color, lineHeight: 1 }}>{value}</p>
    </div>
  )
}

// ── Keyframes ─────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes am-orb-a   { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-orb-b   { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-sonar   { 0% { transform: scale(0.4); stroke-opacity: 0.7; } 100% { transform: scale(2.8); stroke-opacity: 0; } }
  @keyframes am-float   { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
  @keyframes am-rise    { 0% { transform: translateY(0); opacity: 0.7 } 100% { transform: translateY(-28px); opacity: 0 } }
  @keyframes am-dot     { 0%, 80%, 100% { transform: scaleY(0.6); opacity: 0.3 } 40% { transform: scaleY(1.4); opacity: 1 } }
  @keyframes am-pulse   { 0%, 100% { r: 10; opacity: 0.08 } 50% { r: 14; opacity: 0.18 } }
  @keyframes am-spin    { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-bar-0   { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.5) } }
  @keyframes am-bar-1   { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.4) } }
  @keyframes am-bar-2   { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.7) } }
  @keyframes am-bar-3   { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.6) } }
  @keyframes am-bar-4   { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.5) } }
`

// ── Main panel ────────────────────────────────────────────────────────────────

export function AutomationsPanel({ isActive }: AutomationsPanelProps) {
  const [status,     setStatus]     = useState<AutomationStatus | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [hasLoaded,  setHasLoaded]  = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/automation/status")
      if (res.ok) setStatus(await res.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (isActive && !hasLoaded) { fetchStatus(); setHasLoaded(true) }
  }, [isActive, hasLoaded, fetchStatus])

  useEffect(() => {
    if (!isActive) return
    const t = setInterval(fetchStatus, 30_000)
    return () => clearInterval(t)
  }, [isActive, fetchStatus])

  const seq      = status?.sequences
  const outreach = status?.outreach
  const calls    = status?.calls
  const isLive   = (seq?.activeLeads ?? 0) > 0 || (calls?.today ?? 0) > 0

  const CARDS = [
    {
      viz:         <OrbitViz color={GEM.green} />,
      label:       "Follow-Up Sequences",
      status:      (seq && seq.activeLeads > 0 ? "active" : "idle") as CardStatus,
      statusLabel: seq && seq.activeLeads > 0 ? "Running" : "Idle",
      metric:      seq?.activeLeads ?? 0,
      metricLabel: "leads in active sequence",
      detail:      seq?.nextFiresAt ? `Next (${seq.nextChannel}) fires in ${timeUntil(seq.nextFiresAt)}` : "No steps scheduled",
      color:       GEM.green,
      actionLabel: "View Sequences",
      onAction:    () => {},
    },
    {
      viz:         <SonarViz color="#60A5FA" />,
      label:       "AI Outbound Calls",
      status:      (calls && calls.today > 0 ? "active" : "idle") as CardStatus,
      statusLabel: calls && calls.today > 0 ? "Active" : "Idle",
      metric:      calls?.today ?? 0,
      metricLabel: "calls placed today",
      detail:      calls?.thisWeek ? `${calls.thisWeek} this week · ${calls.appointmentRate}% book rate` : undefined,
      color:       "#60A5FA",
      actionLabel: "Call Queue",
      onAction:    () => {},
    },
    {
      viz:         <EnvelopeViz color={GEM.green} />,
      label:       "Email Outreach",
      status:      (outreach && outreach.emailQueued > 0 ? "active" : "idle") as CardStatus,
      statusLabel: outreach && outreach.emailQueued > 0 ? `${outreach.emailQueued} queued` : "No drafts",
      metric:      outreach?.emailQueued ?? 0,
      metricLabel: "drafts ready to send",
      detail:      "AI-written, ready for Resend",
      color:       GEM.green,
      actionLabel: "Review Drafts",
      onAction:    () => {},
    },
    {
      viz:         <BubbleViz color={GEM.yellow} />,
      label:       "SMS Follow-Ups",
      status:      (outreach && outreach.smsQueued > 0 ? "active" : "idle") as CardStatus,
      statusLabel: outreach && outreach.smsQueued > 0 ? `${outreach.smsQueued} queued` : "No SMS",
      metric:      outreach?.smsQueued ?? 0,
      metricLabel: "SMS drafts ready",
      detail:      "Auto-generated on day 3 of sequence",
      color:       GEM.yellow,
      actionLabel: "Review SMS",
      onAction:    () => {},
    },
    {
      viz:         <SparkleViz color="#c084fc" />,
      label:       "Content Generator",
      status:      "active" as CardStatus,
      statusLabel: "On Demand",
      metric:      "5",
      metricLabel: "content types available",
      detail:      "Social, listing, market, email, script",
      color:       "#c084fc",
      actionLabel: "Generate Now",
      onAction:    () => setShowDrawer(true),
    },
    {
      viz:         <BarsViz color={GEM.yellow} />,
      label:       "Market Reports",
      status:      "needs_setup" as CardStatus,
      statusLabel: "Setup Required",
      metric:      "—",
      metricLabel: "weekly auto-send",
      detail:      "Configure client list to enable",
      color:       GEM.yellow,
      actionLabel: "Configure",
      onAction:    () => {},
    },
  ]

  return (
    <div className={cn("h-full flex flex-col transition-all duration-500", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none")}
      style={{ background: CAVE.deep, fontFamily: "inherit" }}>

      <style>{KEYFRAMES}</style>

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${CAVE.stoneEdge}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={16} color={GEM.green} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e5e5e5" }}>Automation Center</h2>
            {isLive && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${GEM.green}10`, border: `1px solid ${GEM.green}25`, color: GEM.green }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: GEM.green, boxShadow: `0 0 6px ${GEM.green}`, display: "inline-block" }} />
                LIVE
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowDrawer(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${GEM.green}10`, border: `1px solid ${GEM.green}25`, color: GEM.green, cursor: "pointer" }}>
              <Sparkles size={12} /> Generate Content
            </button>
            <button onClick={fetchStatus} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}`, color: "#555", cursor: "pointer" }}>
              <RefreshCw size={12} style={{ animation: loading ? "am-spin 1s linear infinite" : "none" }} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
          <StatChip label="In Sequence"   value={seq?.activeLeads   ?? "—"} color={GEM.green}  />
          <StatChip label="Pending Steps" value={seq?.pendingSteps  ?? "—"} color={GEM.green}  />
          <StatChip label="Emails"        value={outreach?.emailQueued ?? "—"} color="#60A5FA"  />
          <StatChip label="SMS"           value={outreach?.smsQueued   ?? "—"} color={GEM.yellow} />
          <StatChip label="Calls Today"   value={calls?.today ?? "—"} color="#60A5FA"           />
          <StatChip label="Book Rate"     value={calls ? `${calls.appointmentRate}%` : "—"} color={GEM.green} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

        {/* Cards grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
            {CARDS.map(card => <AutoCard key={card.label} {...card} />)}
          </div>

          {/* Recent drafts */}
          {outreach?.recentDrafts && outreach.recentDrafts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <p style={{ margin: "0 0 12px", fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Drafts</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {outreach.recentDrafts.map(draft => (
                  <div key={draft.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(255,255,255,0.025)", border: `1px solid ${CAVE.stoneEdge}` }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {draft.channel === "email"       && <Mail size={12} color="#60A5FA" />}
                      {draft.channel === "sms"         && <MessageSquare size={12} color={GEM.yellow} />}
                      {draft.channel === "call_script" && <FileText size={12} color={GEM.green} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {draft.subject ?? `${draft.channel.replace("_", " ")} draft`}
                      </p>
                      <p style={{ margin: 0, fontSize: 10, color: "#444" }}>{relativeTime(draft.created_at)} · {draft.tone}</p>
                    </div>
                    <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: draft.status === "queued_to_send" ? `${GEM.green}0d` : "rgba(255,255,255,0.04)", border: `1px solid ${draft.status === "queued_to_send" ? `${GEM.green}25` : "rgba(255,255,255,0.07)"}`, color: draft.status === "queued_to_send" ? GEM.green : "#555" }}>
                      {draft.status.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity feed sidebar */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: `1px solid ${CAVE.stoneEdge}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
            <p style={{ margin: 0, fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Feed</p>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {status?.activity?.length ? (
              status.activity.map(ev => (
                <div key={ev.id} style={{ padding: "10px 18px", borderBottom: `1px solid rgba(255,255,255,0.03)`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5, background: SEV_COLOR[ev.severity] ?? "#444", boxShadow: ev.severity === "success" ? `0 0 6px ${GEM.green}` : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ccc", lineHeight: 1.3 }}>{ev.title}</p>
                    {ev.description && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#555", lineHeight: 1.4 }}>{ev.description}</p>}
                    <p style={{ margin: "4px 0 0", fontSize: 10, color: "#333" }}>{relativeTime(ev.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "40px 18px", textAlign: "center" }}>
                <TrendingUp size={22} color="#222" style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 12, color: "#333" }}>No activity yet</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#262626" }}>Events appear as automations run</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ padding: "12px 18px", borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {[
                { label: "Score New Leads",     icon: TrendingUp },
                { label: "Generate Social Post", icon: Sparkles,  onClick: () => setShowDrawer(true) },
                { label: "View Outreach Queue",  icon: Mail       },
              ].map(a => (
                <button key={a.label} onClick={a.onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.025)", border: `1px solid ${CAVE.stoneEdge}`, color: "#555", cursor: "pointer", textAlign: "left" }}>
                  <a.icon size={11} />
                  {a.label}
                  <ArrowRight size={10} style={{ marginLeft: "auto" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDrawer && <ContentGeneratorDrawer onClose={() => setShowDrawer(false)} />}
    </div>
  )
}
