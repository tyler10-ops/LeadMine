"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import {
  Zap, Mail, Phone, MessageSquare, BarChart3,
  RefreshCw, ChevronRight, CheckCircle2, Circle,
  AlertCircle, Sparkles, Copy, Check, X, Loader2,
  TrendingUp, Activity, FileText, ArrowRight, Send,
  PhoneCall, Clock, ChevronDown, Trash2, PlayCircle,
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
interface RecentDraft { id: string; channel: string; tone: string; status: string; subject: string | null; created_at: string }
interface ActivityEvent { id: string; event_type: string; title: string; description: string; icon: string; severity: string; created_at: string }
type ContentType = "social_post" | "listing_description" | "market_summary" | "email_newsletter" | "cold_script"
interface GeneratedContent { type: ContentType; subject: string | null; body: string; fullText: string }

interface SequenceLead {
  leadId: string; leadName: string; address: string; grade: string; score: number
  phone: string | null; email: string | null; sequenceName: string
  steps: { id: string; channel: string; status: string; scheduled_at: string; sequence_step: number; content: string }[]
  nextPending: { id: string; channel: string; sequence_step: number } | null
}

interface OutreachDraft {
  id: string; lead_id: string; subject: string | null; body: string
  channel: string; tone: string; status: string; created_at: string
  lead: { id: string; owner_name: string | null; property_address: string | null; email: string | null; phone: string | null } | null
}

interface CallRecord {
  id: string; lead_id: string | null; status: string; outcome: string | null
  started_at: string | null; duration_seconds: number | null
  lead_name?: string; lead_phone?: string
}

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

function fmtDuration(s: number | null) {
  if (!s) return "—"
  const m = Math.floor(s / 60), sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

const SEV_COLOR: Record<string, string> = { success: GEM.green, warning: GEM.yellow, error: "#FF4040", info: "#60A5FA" }

// ── Common drawer shell ───────────────────────────────────────────────────────

function DrawerShell({ title, icon: Icon, color = GEM.green, onClose, children }: {
  title: string; icon: React.ElementType; color?: string; onClose: () => void; children: React.ReactNode
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[480px] flex flex-col shadow-2xl"
        style={{ background: CAVE.deep, borderLeft: `1px solid ${CAVE.stoneMid}` }}>
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
          <div className="flex items-center gap-2.5">
            <Icon size={15} color={color} />
            <span className="text-[14px] font-bold text-neutral-100">{title}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            <X size={15} className="text-neutral-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  )
}

// ── Sequences Drawer ──────────────────────────────────────────────────────────

function SequencesDrawer({ onClose }: { onClose: () => void }) {
  const [sequences, setSequences] = useState<SequenceLead[]>([])
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState<string | null>(null) // activityId being acted on
  const [expanded, setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/sequences").then(r => r.json()).then(d => { setSequences(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const triggerStep = async (seq: SequenceLead, actId: string, channel: string) => {
    setGenerating(actId)
    try {
      if (channel === "call") {
        await fetch("/api/calling/initiate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: seq.leadId }) })
      } else {
        await fetch("/api/outreach/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: seq.leadId, channel, tone: "professional" }) })
      }
      await fetch("/api/sequences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activityId: actId }) })
      setSequences(prev => prev.map(s => s.leadId === seq.leadId
        ? { ...s, steps: s.steps.map(st => st.id === actId ? { ...st, status: "completed" } : st), nextPending: s.steps.find(st => st.status === "pending" && st.id !== actId) ?? null }
        : s
      ))
    } finally { setGenerating(null) }
  }

  const GRADE_COLOR: Record<string, string> = { elite: GEM.green, refined: GEM.yellow, rock: "#6b7280", ungraded: "#374151" }
  const CH_ICON: Record<string, React.ElementType> = { email: Mail, call: PhoneCall, sms: MessageSquare }

  return (
    <DrawerShell title="Follow-Up Sequences" icon={Zap} color={GEM.green} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin" style={{ color: GEM.green }} /></div>
      ) : sequences.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
          <Zap size={28} className="text-neutral-700" />
          <p className="text-[13px] font-semibold text-neutral-400">No active sequences</p>
          <p className="text-[11px] text-neutral-600">Sequences start automatically when a lead scores Elite or Refined in Lead Machine.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: CAVE.stoneEdge }}>
          {sequences.map(seq => {
            const isExpanded = expanded === seq.leadId
            const pending = seq.steps.filter(s => s.status === "pending")
            const done    = seq.steps.filter(s => s.status === "completed")
            return (
              <div key={seq.leadId} style={{ background: isExpanded ? `${GEM.green}05` : "transparent" }}>
                <button className="w-full px-5 py-3.5 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : seq.leadId)}>
                  <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: pending.length > 0 ? GEM.green : "#444", boxShadow: pending.length > 0 ? `0 0 6px ${GEM.green}` : "none" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-neutral-200 truncate">{seq.leadName}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{ color: GRADE_COLOR[seq.grade] ?? "#6b7280", background: `${GRADE_COLOR[seq.grade] ?? "#6b7280"}15`, border: `1px solid ${GRADE_COLOR[seq.grade] ?? "#6b7280"}30` }}>
                        {seq.grade.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-600 truncate mt-0.5">{seq.address || "—"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {seq.steps.map(s => {
                        const Icon = CH_ICON[s.channel] ?? Zap
                        return (
                          <div key={s.id} className="flex items-center gap-1" title={s.channel}>
                            <Icon size={10} style={{ color: s.status === "completed" ? GEM.green : s.status === "pending" ? "#60a5fa" : "#444" }} />
                            {s.status === "completed" ? <CheckCircle2 size={8} style={{ color: GEM.green }} /> : <Circle size={8} className="text-neutral-700" />}
                          </div>
                        )
                      })}
                      <span className="text-[10px] text-neutral-600">{done.length}/{seq.steps.length} done</span>
                    </div>
                  </div>
                  <ChevronDown size={13} className="text-neutral-600 flex-shrink-0 mt-1 transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "none" }} />
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 space-y-2">
                    {seq.steps.map(step => {
                      const Icon = CH_ICON[step.channel] ?? Zap
                      const isPending = step.status === "pending"
                      const isActing  = generating === step.id
                      return (
                        <div key={step.id} className="flex items-center gap-3 rounded-xl p-3"
                          style={{ background: CAVE.stoneDeep, border: `1px solid ${isPending ? "#60a5fa20" : CAVE.stoneEdge}` }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: isPending ? "rgba(96,165,250,0.12)" : `${GEM.green}10` }}>
                            <Icon size={12} style={{ color: isPending ? "#60a5fa" : GEM.green }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-neutral-300 capitalize">{step.channel.replace("_", " ")}</p>
                            <p className="text-[10px] text-neutral-600">{isPending ? `Due ${relativeTime(step.scheduled_at)}` : "Completed"}</p>
                          </div>
                          {isPending ? (
                            <button
                              disabled={!!generating}
                              onClick={() => triggerStep(seq, step.id, step.channel)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40"
                              style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}
                            >
                              {isActing ? <Loader2 size={10} className="animate-spin" /> : <PlayCircle size={10} />}
                              {step.channel === "call" ? "Call Now" : step.channel === "email" ? "Gen Email" : "Gen SMS"}
                            </button>
                          ) : (
                            <CheckCircle2 size={14} style={{ color: GEM.green }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DrawerShell>
  )
}

// ── Calls Drawer ──────────────────────────────────────────────────────────────

function CallsDrawer({ onClose }: { onClose: () => void }) {
  const [calls,    setCalls]    = useState<CallRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [calling,  setCalling]  = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/calling/calls?limit=30").then(r => r.json()).then(d => { setCalls(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const initiateCall = async (leadId: string) => {
    setCalling(leadId)
    try {
      const res = await fetch("/api/calling/initiate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lead_id: leadId }) })
      if (res.ok) {
        const data = await res.json()
        setCalls(prev => [{ id: data.callId ?? crypto.randomUUID(), lead_id: leadId, status: "initiated", outcome: null, started_at: new Date().toISOString(), duration_seconds: null }, ...prev])
      }
    } finally { setCalling(null) }
  }

  const OUTCOME_CFG: Record<string, { label: string; color: string }> = {
    appointment_set:  { label: "Booked",      color: GEM.green  },
    not_interested:   { label: "Not Int.",    color: "#6b7280"  },
    callback_requested:{ label: "Callback",   color: GEM.yellow },
    voicemail:        { label: "Voicemail",   color: "#60a5fa"  },
    no_answer:        { label: "No Answer",   color: "#6b7280"  },
    completed:        { label: "Completed",   color: GEM.green  },
  }

  return (
    <DrawerShell title="AI Outbound Calls" icon={Phone} color="#60A5FA" onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin" style={{ color: "#60A5FA" }} /></div>
      ) : calls.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
          <PhoneCall size={28} className="text-neutral-700" />
          <p className="text-[13px] font-semibold text-neutral-400">No calls yet</p>
          <p className="text-[11px] text-neutral-600">Calls are initiated from the Lead Machine panel when a lead is in an active sequence.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: CAVE.stoneEdge }}>
          {calls.map(call => {
            const outcome = call.outcome ? OUTCOME_CFG[call.outcome] : null
            return (
              <div key={call.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}>
                  <PhoneCall size={13} style={{ color: "#60A5FA" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-neutral-200 truncate">{call.lead_name ?? "Unknown Lead"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-neutral-600">{call.started_at ? relativeTime(call.started_at) : "—"}</span>
                    {call.duration_seconds != null && (
                      <span className="text-[10px] text-neutral-600 flex items-center gap-0.5"><Clock size={8} />{fmtDuration(call.duration_seconds)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {outcome ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ color: outcome.color, background: `${outcome.color}15`, border: `1px solid ${outcome.color}30` }}>
                      {outcome.label}
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-600 capitalize">{call.status}</span>
                  )}
                  {call.lead_id && (
                    <button
                      disabled={calling === call.lead_id}
                      onClick={() => initiateCall(call.lead_id!)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40"
                      style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}
                      title="Call again"
                    >
                      {calling === call.lead_id ? <Loader2 size={11} className="animate-spin text-[#60a5fa]" /> : <PhoneCall size={11} style={{ color: "#60a5fa" }} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DrawerShell>
  )
}

// ── Email Drafts Drawer ───────────────────────────────────────────────────────

function EmailDraftsDrawer({ onClose }: { onClose: () => void }) {
  const [drafts,   setDrafts]   = useState<OutreachDraft[]>([])
  const [loading,  setLoading]  = useState(true)
  const [sending,  setSending]  = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [statusFilter, setFilter] = useState<"" | "draft" | "sent">("draft")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ channel: "email", limit: "50" })
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`/api/outreach/drafts?${params}`)
    const data = await res.json()
    setDrafts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [statusFilter])

  useEffect(() => { load() }, [load])

  const sendDraft = async (draftId: string) => {
    setSending(draftId)
    setErrors(e => { const n = { ...e }; delete n[draftId]; return n })
    try {
      const res  = await fetch("/api/outreach/email/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draftId }) })
      const data = await res.json()
      if (!res.ok) { setErrors(e => ({ ...e, [draftId]: data.error ?? "Send failed" })); return }
      setDrafts(prev => prev.map(d => d.id === draftId ? { ...d, status: "sent" } : d))
    } finally { setSending(null) }
  }

  const deleteDraft = async (draftId: string) => {
    await fetch(`/api/outreach/drafts?id=${draftId}`, { method: "DELETE" })
    setDrafts(prev => prev.filter(d => d.id !== draftId))
  }

  const STATUS_CFG: Record<string, { label: string; color: string }> = {
    draft:          { label: "Draft",  color: GEM.yellow },
    queued_to_send: { label: "Queued", color: "#60a5fa"  },
    sent:           { label: "Sent",   color: GEM.green  },
    failed:         { label: "Failed", color: "#FF4040"  },
  }

  return (
    <DrawerShell title="Email Outreach" icon={Mail} color={GEM.green} onClose={onClose}>
      {/* Filter */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
        {[["", "All"], ["draft", "Draft"], ["sent", "Sent"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val as "" | "draft" | "sent")}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border"
            style={statusFilter === val
              ? { color: GEM.green, background: `${GEM.green}12`, borderColor: `${GEM.green}30` }
              : { color: "#525252", background: "transparent", borderColor: CAVE.stoneEdge }}>
            {label}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 rounded-lg text-neutral-600 hover:text-neutral-300 transition-colors">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin" style={{ color: GEM.green }} /></div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
          <Mail size={28} className="text-neutral-700" />
          <p className="text-[13px] font-semibold text-neutral-400">No email drafts</p>
          <p className="text-[11px] text-neutral-600">Drafts are generated automatically when a lead enters a follow-up sequence, or manually via Lead Machine.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: CAVE.stoneEdge }}>
          {drafts.map(draft => {
            const sc  = STATUS_CFG[draft.status] ?? { label: draft.status, color: "#6b7280" }
            const isX = expanded === draft.id
            const err = errors[draft.id]
            return (
              <div key={draft.id} style={{ background: isX ? `${GEM.green}04` : "transparent" }}>
                <button className="w-full px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors flex items-start gap-3"
                  onClick={() => setExpanded(isX ? null : draft.id)}>
                  <Mail size={13} style={{ color: GEM.green }} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-neutral-200 truncate">{draft.subject ?? "(no subject)"}</p>
                    <p className="text-[10px] text-neutral-600 truncate mt-0.5">{draft.lead?.owner_name ?? "Unknown Lead"} · {draft.lead?.property_address ?? ""}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: sc.color, background: `${sc.color}15`, border: `1px solid ${sc.color}30` }}>{sc.label}</span>
                      <span className="text-[9px] text-neutral-700">{relativeTime(draft.created_at)}</span>
                    </div>
                  </div>
                  <ChevronDown size={12} className="text-neutral-600 flex-shrink-0 mt-1 transition-transform" style={{ transform: isX ? "rotate(180deg)" : "none" }} />
                </button>

                {isX && (
                  <div className="px-5 pb-4 space-y-3">
                    {draft.lead?.email ? (
                      <p className="text-[10px] text-neutral-500">To: <span className="text-neutral-300">{draft.lead.email}</span></p>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[10px]" style={{ color: GEM.yellow }}>
                        <AlertCircle size={10} />No email on file — cannot send
                      </div>
                    )}
                    <pre className="text-[11px] text-neutral-400 whitespace-pre-wrap leading-relaxed p-3 rounded-xl max-h-48 overflow-y-auto"
                      style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
                      {draft.body}
                    </pre>
                    {err && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle size={11} />{err}</p>}
                    <div className="flex gap-2">
                      {draft.status !== "sent" && draft.lead?.email && (
                        <button
                          disabled={!!sending}
                          onClick={() => sendDraft(draft.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                          style={{ background: `${GEM.green}14`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
                        >
                          {sending === draft.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                          {sending === draft.id ? "Sending…" : "Send Email"}
                        </button>
                      )}
                      {draft.status !== "sent" && (
                        <button onClick={() => deleteDraft(draft.id)}
                          className="p-2 rounded-lg transition-colors text-neutral-600 hover:text-red-400"
                          style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DrawerShell>
  )
}

// ── SMS Drafts Drawer ─────────────────────────────────────────────────────────

function SMSDraftsDrawer({ onClose }: { onClose: () => void }) {
  const [drafts,  setDrafts]  = useState<OutreachDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)
  const [errors,  setErrors]  = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/outreach/drafts?channel=sms&limit=50")
      .then(r => r.json()).then(d => { setDrafts(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sendSms = async (draft: OutreachDraft) => {
    if (!draft.lead?.phone) { setErrors(e => ({ ...e, [draft.id]: "No phone number on file" })); return }
    setSending(draft.id)
    setErrors(e => { const n = { ...e }; delete n[draft.id]; return n })
    try {
      const res  = await fetch("/api/outreach/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: draft.lead.phone, message: draft.body, leadId: draft.lead_id }) })
      const data = await res.json()
      if (!res.ok) { setErrors(e => ({ ...e, [draft.id]: data.error ?? "Send failed" })); return }
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: "sent" } : d))
    } finally { setSending(null) }
  }

  return (
    <DrawerShell title="SMS Follow-Ups" icon={MessageSquare} color={GEM.yellow} onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin" style={{ color: GEM.yellow }} /></div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
          <MessageSquare size={28} className="text-neutral-700" />
          <p className="text-[13px] font-semibold text-neutral-400">No SMS drafts</p>
          <p className="text-[11px] text-neutral-600">SMS drafts are auto-generated on day 3 of a follow-up sequence.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: CAVE.stoneEdge }}>
          {drafts.map(draft => {
            const sent = draft.status === "sent"
            const err  = errors[draft.id]
            return (
              <div key={draft.id} className="px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-neutral-200 truncate">{draft.lead?.owner_name ?? "Unknown Lead"}</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{draft.lead?.phone ?? "No phone"} · {relativeTime(draft.created_at)}</p>
                  </div>
                  {sent && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ color: GEM.green, background: `${GEM.green}15`, border: `1px solid ${GEM.green}30` }}>Sent</span>}
                </div>
                <div className="p-3 rounded-xl text-[11px] text-neutral-300 leading-relaxed"
                  style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
                  {draft.body}
                </div>
                {err && <p className="text-[11px] text-red-400 flex items-center gap-1"><AlertCircle size={11} />{err}</p>}
                {!sent && (
                  <div className="flex gap-2">
                    <button
                      disabled={!!sending || !draft.lead?.phone}
                      onClick={() => sendSms(draft)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50"
                      style={{ background: `${GEM.yellow}12`, border: `1px solid ${GEM.yellow}30`, color: GEM.yellow }}
                    >
                      {sending === draft.id ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                      {sending === draft.id ? "Sending…" : draft.lead?.phone ? "Send SMS" : "No Phone"}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </DrawerShell>
  )
}

// ── Market Reports Drawer ─────────────────────────────────────────────────────

function MarketReportsDrawer({ onClose }: { onClose: () => void }) {
  const [emails, setEmails] = useState("")
  const [freq,   setFreq]   = useState("weekly")
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    const s = localStorage.getItem("lm_market_reports_config")
    if (s) { try { const c = JSON.parse(s); setEmails(c.emails ?? ""); setFreq(c.freq ?? "weekly") } catch {} }
  }, [])

  const save = () => {
    localStorage.setItem("lm_market_reports_config", JSON.stringify({ emails, freq }))
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}`, borderRadius: 8, padding: "8px 12px", color: "#d4d4d4", fontSize: 12, outline: "none", width: "100%", boxSizing: "border-box" }

  return (
    <DrawerShell title="Market Reports" icon={BarChart3} color={GEM.yellow} onClose={onClose}>
      <div className="p-5 space-y-5">
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: `${GEM.yellow}08`, border: `1px solid ${GEM.yellow}20` }}>
          <AlertCircle size={14} style={{ color: GEM.yellow }} className="flex-shrink-0 mt-0.5" />
          <p className="text-[11px]" style={{ color: GEM.yellow }}>Market report sending is coming soon. Configure your recipient list now and we'll start sending when the feature launches.</p>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Frequency</label>
          <div className="flex gap-2">
            {["weekly", "biweekly", "monthly"].map(f => (
              <button key={f} onClick={() => setFreq(f)}
                className="flex-1 py-2 rounded-lg text-[11px] font-medium capitalize border transition-all"
                style={freq === f ? { color: GEM.yellow, background: `${GEM.yellow}12`, borderColor: `${GEM.yellow}30` } : { color: "#525252", background: "transparent", borderColor: CAVE.stoneEdge }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">Client Emails</label>
          <textarea value={emails} onChange={e => setEmails(e.target.value)} rows={5}
            placeholder={"client1@email.com\nclient2@email.com\nclient3@email.com"}
            style={{ ...inp, resize: "vertical" }} />
          <p className="text-[10px] text-neutral-600 mt-1.5">One email per line</p>
        </div>

        <button onClick={save}
          className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ background: `${GEM.yellow}14`, border: `1px solid ${GEM.yellow}30`, color: GEM.yellow }}>
          {saved ? <><Check size={13} />Saved!</> : "Save Configuration"}
        </button>
      </div>
    </DrawerShell>
  )
}

// ── Content Generator Drawer ──────────────────────────────────────────────────

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

  const inp: React.CSSProperties = { background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}`, borderRadius: 8, padding: "8px 12px", color: "#e0e0e0", fontSize: 12, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }

  return (
    <DrawerShell title="AI Content Generator" icon={Sparkles} color="#c084fc" onClose={onClose}>
      <div className="p-5 space-y-4">
        {/* Type */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">Content Type</p>
          <div className="space-y-2">
            {CONTENT_TYPES.map(ct => (
              <button key={ct.type} onClick={() => setSelectedType(ct.type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{ background: selectedType === ct.type ? "#c084fc0d" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedType === ct.type ? "#c084fc30" : CAVE.stoneEdge}` }}>
                <div className="flex-1">
                  <p className="text-[12px] font-semibold" style={{ color: selectedType === ct.type ? "#c084fc" : "#ccc" }}>{ct.label}</p>
                  <p className="text-[10px] text-neutral-600">{ct.description}</p>
                </div>
                {selectedType === ct.type && <CheckCircle2 size={13} style={{ color: "#c084fc" }} />}
              </button>
            ))}
          </div>
        </div>

        {typeConfig.platforms && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">Platform</p>
            <div className="flex gap-2">
              {typeConfig.platforms.map(p => (
                <button key={p} onClick={() => setPlatform(p)}
                  className="flex-1 py-2 rounded-lg text-[11px] font-semibold capitalize border transition-all"
                  style={platform === p ? { color: "#c084fc", background: "#c084fc10", borderColor: "#c084fc30" } : { color: "#555", background: "transparent", borderColor: CAVE.stoneEdge }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">Tone</p>
          <div className="flex gap-2">
            {["professional", "casual", "urgent"].map(t => (
              <button key={t} onClick={() => setTone(t)}
                className="flex-1 py-2 rounded-lg text-[11px] font-semibold capitalize border transition-all"
                style={tone === t ? { color: "#c084fc", background: "#c084fc10", borderColor: "#c084fc30" } : { color: "#555", background: "transparent", borderColor: CAVE.stoneEdge }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 mb-2">Context</p>
          <textarea value={context} onChange={e => setContext(e.target.value)} rows={3}
            placeholder="Neighborhood, property type, market stats, target audience…" style={{ ...inp, resize: "vertical" }} />
        </div>

        <button onClick={generate} disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold transition-all disabled:opacity-60"
          style={{ background: "#c084fc14", border: "1px solid #c084fc30", color: "#c084fc" }}>
          {loading ? <><Loader2 size={14} className="animate-spin" />Generating…</> : <><Sparkles size={14} />Generate</>}
        </button>

        {error && <p className="text-[11px] text-red-400 flex items-center gap-1.5"><AlertCircle size={12} />{error}</p>}

        {generated && (
          <div className="space-y-3">
            {generated.subject && (
              <div className="p-3 rounded-xl" style={{ background: "#c084fc08", border: "1px solid #c084fc20" }}>
                <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#c084fc" }}>Subject</p>
                <p className="text-[13px] font-semibold text-neutral-200">{generated.subject}</p>
              </div>
            )}
            <div className="relative">
              <pre className="text-[11px] text-neutral-300 whitespace-pre-wrap leading-relaxed p-4 rounded-xl max-h-72 overflow-y-auto"
                style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
                {generated.body}
              </pre>
              <button onClick={copy}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", color: copied ? GEM.green : "#888" }}>
                {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
              </button>
            </div>
            <button onClick={generate}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors text-neutral-500 hover:text-neutral-300"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}` }}>
              <RefreshCw size={11} />Regenerate
            </button>
          </div>
        )}
      </div>
    </DrawerShell>
  )
}

// ── 3D Animated Visuals ───────────────────────────────────────────────────────

function OrbitViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 5s linear infinite" }}>
        <ellipse cx="45" cy="45" rx="38" ry="14" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.3" />
        <circle cx="45" cy="31" r="4.5" fill={color} style={{ filter: `drop-shadow(0 0 5px ${color})` }} />
      </g>
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-b 3.2s linear infinite reverse" }}>
        <ellipse cx="45" cy="45" rx="22" ry="8" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
        <circle cx="45" cy="37" r="2.8" fill={color} fillOpacity="0.75" style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      </g>
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 2.1s linear infinite" }}>
        <circle cx="45" cy="41" r="1.8" fill={color} fillOpacity="0.5" />
      </g>
      <circle cx="45" cy="45" r="9" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
      <circle cx="45" cy="45" r="4" fill={color} fillOpacity="0.9" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
    </svg>
  )
}

function SonarViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {[0, 1, 2].map(i => (
        <circle key={i} cx="45" cy="45" r="12" fill="none" stroke={color} strokeWidth="1.5"
          style={{ animation: `am-sonar 2.4s ease-out ${i * 0.8}s infinite`, transformOrigin: "45px 45px" }} />
      ))}
      <rect x="38" y="33" width="14" height="24" rx="3" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.2" strokeOpacity="0.5" />
      <rect x="41" y="36" width="8" height="11" rx="1" fill={color} fillOpacity="0.35" />
      <circle cx="45" cy="52" r="1.5" fill={color} fillOpacity="0.7" />
    </svg>
  )
}

function EnvelopeViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <g style={{ animation: "am-float 3s ease-in-out infinite", transformOrigin: "45px 45px" }}>
        <rect x="23" y="34" width="44" height="28" rx="4" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="1.3" strokeOpacity="0.4" />
        <polyline points="23,34 45,50 67,34" fill="none" stroke={color} strokeWidth="1.3" strokeOpacity="0.5" />
      </g>
      {[0, 1, 2].map(i => (
        <circle key={i} cx={38 + i * 7} cy="30" r="2" fill={color} fillOpacity="0.6"
          style={{ animation: `am-rise 2s ease-out ${i * 0.55}s infinite`, transformOrigin: `${38 + i * 7}px 30px` }} />
      ))}
    </svg>
  )
}

function BubbleViz({ color }: { color: string }) {
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <g style={{ animation: "am-float 2.6s ease-in-out infinite" }}>
        <rect x="14" y="30" width="36" height="22" rx="8" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" strokeOpacity="0.4" />
        <polygon points="20,52 14,60 28,52" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" strokeOpacity="0.3" />
        {[0, 1, 2].map(i => (
          <circle key={i} cx={25 + i * 8} cy="41" r="2.5" fill={color}
            style={{ animation: `am-dot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </g>
      <g style={{ animation: "am-float 2.6s ease-in-out 1.3s infinite" }}>
        <rect x="40" y="48" width="36" height="22" rx="8" fill={color} fillOpacity="0.08" stroke={color} strokeWidth="1" strokeOpacity="0.25" />
        <rect x="47" y="55" width="20" height="3" rx="1.5" fill={color} fillOpacity="0.4" />
        <rect x="47" y="61" width="14" height="3" rx="1.5" fill={color} fillOpacity="0.25" />
      </g>
    </svg>
  )
}

function SparkleViz({ color }: { color: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return { x1: 45 + 14 * Math.cos(a), y1: 45 + 14 * Math.sin(a), x2: 45 + 32 * Math.cos(a), y2: 45 + 32 * Math.sin(a), isMain: i % 2 === 0 }
  })
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      <g style={{ transformOrigin: "45px 45px", animation: "am-orb-a 8s linear infinite" }}>
        {rays.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2}
            stroke={color} strokeWidth={r.isMain ? 1.5 : 0.8} strokeOpacity={r.isMain ? 0.7 : 0.4} />
        ))}
        {rays.filter(r => r.isMain).map((r, i) => (
          <circle key={i} cx={r.x2} cy={r.y2} r="2.5" fill={color} fillOpacity="0.8"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        ))}
      </g>
      <circle cx="45" cy="45" r="5" fill={color} fillOpacity="0.9" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  )
}

function BarsViz({ color }: { color: string }) {
  const bars = [{ x: 16, delay: "0s", h: 30 }, { x: 29, delay: "0.3s", h: 48 }, { x: 42, delay: "0.15s", h: 38 }, { x: 55, delay: "0.45s", h: 55 }, { x: 68, delay: "0.1s", h: 28 }]
  return (
    <svg width="90" height="90" viewBox="0 0 90 90" overflow="visible">
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={90 - b.h - 10} width="9" height={b.h} rx="2" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" strokeOpacity="0.35"
            style={{ animation: `am-bar-${i} 2.5s ease-in-out ${b.delay} infinite`, transformOrigin: `${b.x + 4}px 80px` }} />
          <rect x={b.x} y={90 - b.h - 12} width="9" height="3" rx="1.5" fill={color}
            style={{ animation: `am-bar-${i} 2.5s ease-in-out ${b.delay} infinite`, filter: `drop-shadow(0 0 4px ${color})`, transformOrigin: `${b.x + 4}px 80px` }} />
        </g>
      ))}
    </svg>
  )
}

// ── AutoCard with 3D tilt ─────────────────────────────────────────────────────

type CardStatus = "active" | "idle" | "needs_setup"

function AutoCard({ viz, label, status, statusLabel, metric, metricLabel, detail, onAction, actionLabel = "View", color = GEM.green }: {
  viz: React.ReactNode; label: string; status: CardStatus; statusLabel: string
  metric: string | number; metricLabel: string; detail?: string
  onAction?: () => void; actionLabel?: string; color?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current; if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 14
    el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateZ(4px)`
    el.style.transition = "transform 0.05s linear"
  }
  const handleMouseLeave = () => {
    const el = cardRef.current; if (!el) return
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
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
      style={{ background: CAVE.stoneDeep, border: `1px solid ${status === "active" ? `${color}20` : CAVE.stoneEdge}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: status === "active" ? `0 0 24px ${color}08` : "none", willChange: "transform" }}>
      {/* Viz zone */}
      <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(ellipse at center, ${color}08 0%, transparent 70%)`, borderBottom: `1px solid ${color}12`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle, ${color}06 1px, transparent 1px)`, backgroundSize: "18px 18px" }} />
        <div style={{ position: "relative", zIndex: 1 }}>{viz}</div>
      </div>
      {/* Content */}
      <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0" }}>{label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, flexShrink: 0, background: sc.bg, border: `1px solid ${sc.border}`, fontSize: 10, fontWeight: 700, color: sc.text }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, boxShadow: status === "active" ? `0 0 6px ${sc.dot}` : "none", display: "inline-block" }} />
            {statusLabel}
          </div>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1, color: status === "idle" ? "#444" : color }}>{metric}</p>
          <p style={{ margin: "3px 0 0", fontSize: 11, color: "#444" }}>{metricLabel}</p>
        </div>
        {detail && <p style={{ margin: 0, fontSize: 11, color: "#3a3a3a", lineHeight: 1.5 }}>{detail}</p>}
        {onAction && (
          <button onClick={onAction} style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 600, color: status === "needs_setup" ? GEM.yellow : color, background: "rgba(255,255,255,0.03)", border: `1px solid ${status === "active" ? `${color}20` : "rgba(255,255,255,0.07)"}`, cursor: "pointer", width: "100%" }}>
            {actionLabel} <ChevronRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Keyframes ─────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes am-orb-a { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-orb-b { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-sonar { 0% { transform: scale(0.4); stroke-opacity: 0.7 } 100% { transform: scale(2.8); stroke-opacity: 0 } }
  @keyframes am-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-7px) } }
  @keyframes am-rise  { 0% { transform: translateY(0); opacity: 0.7 } 100% { transform: translateY(-28px); opacity: 0 } }
  @keyframes am-dot   { 0%, 80%, 100% { transform: scaleY(0.6); opacity: 0.3 } 40% { transform: scaleY(1.4); opacity: 1 } }
  @keyframes am-spin  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  @keyframes am-bar-0 { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.5) } }
  @keyframes am-bar-1 { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.4) } }
  @keyframes am-bar-2 { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.7) } }
  @keyframes am-bar-3 { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(0.6) } }
  @keyframes am-bar-4 { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.5) } }
`

// ── Main panel ────────────────────────────────────────────────────────────────

type DrawerType = "sequences" | "calls" | "email" | "sms" | "content" | "market" | null

export function AutomationsPanel({ isActive }: AutomationsPanelProps) {
  const [status,    setStatus]    = useState<AutomationStatus | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [drawer,    setDrawer]    = useState<DrawerType>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

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
    { viz: <OrbitViz color={GEM.green} />,    label: "Follow-Up Sequences", status: (seq && seq.activeLeads > 0 ? "active" : "idle") as CardStatus,                   statusLabel: seq && seq.activeLeads > 0 ? "Running" : "Idle",      metric: seq?.activeLeads ?? 0,        metricLabel: "leads in active sequence",    detail: seq?.nextFiresAt ? `Next (${seq.nextChannel}) in ${timeUntil(seq.nextFiresAt)}` : "No steps scheduled", color: GEM.green,  actionLabel: "Manage Sequences", onAction: () => setDrawer("sequences") },
    { viz: <SonarViz color="#60A5FA" />,      label: "AI Outbound Calls",   status: (calls && calls.today > 0 ? "active" : "idle") as CardStatus,                     statusLabel: calls && calls.today > 0 ? "Active" : "Idle",        metric: calls?.today ?? 0,            metricLabel: "calls placed today",          detail: calls?.thisWeek ? `${calls.thisWeek} this week · ${calls.appointmentRate}% book rate` : undefined, color: "#60A5FA", actionLabel: "Call Queue",       onAction: () => setDrawer("calls")     },
    { viz: <EnvelopeViz color={GEM.green} />, label: "Email Outreach",      status: (outreach && outreach.emailQueued > 0 ? "active" : "idle") as CardStatus,         statusLabel: outreach && outreach.emailQueued > 0 ? `${outreach.emailQueued} queued` : "No drafts", metric: outreach?.emailQueued ?? 0, metricLabel: "drafts ready to send", detail: "AI-written, approve & send",  color: GEM.green,  actionLabel: "Review & Send",    onAction: () => setDrawer("email")     },
    { viz: <BubbleViz color={GEM.yellow} />,  label: "SMS Follow-Ups",      status: (outreach && outreach.smsQueued > 0 ? "active" : "idle") as CardStatus,           statusLabel: outreach && outreach.smsQueued > 0 ? `${outreach.smsQueued} queued` : "No SMS",       metric: outreach?.smsQueued ?? 0,     metricLabel: "SMS drafts ready",            detail: "Auto-generated on day 3 of sequence",                color: GEM.yellow, actionLabel: "Review & Send",    onAction: () => setDrawer("sms")       },
    { viz: <SparkleViz color="#c084fc" />,    label: "Content Generator",   status: "active" as CardStatus,                                                           statusLabel: "On Demand",                                         metric: "5",                          metricLabel: "content types available",     detail: "Social, listing, market, email, script",             color: "#c084fc",  actionLabel: "Generate Now",     onAction: () => setDrawer("content")   },
    { viz: <BarsViz color={GEM.yellow} />,    label: "Market Reports",      status: "needs_setup" as CardStatus,                                                      statusLabel: "Setup Required",                                    metric: "—",                          metricLabel: "weekly auto-send",            detail: "Configure client list to enable",                    color: GEM.yellow, actionLabel: "Configure",        onAction: () => setDrawer("market")    },
  ]

  return (
    <div className={cn("h-full flex flex-col transition-all duration-500", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none")}
      style={{ background: CAVE.deep }}>
      <style>{KEYFRAMES}</style>

      {/* Header */}
      <div style={{ padding: "18px 24px 14px", borderBottom: `1px solid ${CAVE.stoneEdge}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Activity size={16} color={GEM.green} />
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#e5e5e5" }}>Automation Center</h2>
            {isLive && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${GEM.green}10`, border: `1px solid ${GEM.green}25`, color: GEM.green }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: GEM.green, boxShadow: `0 0 6px ${GEM.green}`, display: "inline-block" }} />LIVE
              </div>
            )}
          </div>
          <button onClick={fetchStatus} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${CAVE.stoneEdge}`, color: "#555", cursor: "pointer" }}>
            <RefreshCw size={12} style={{ animation: loading ? "am-spin 1s linear infinite" : "none" }} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { label: "In Sequence",   value: seq?.activeLeads    ?? "—", color: GEM.green  },
            { label: "Pending Steps", value: seq?.pendingSteps   ?? "—", color: GEM.green  },
            { label: "Emails",        value: outreach?.emailQueued ?? "—", color: "#60A5FA" },
            { label: "SMS",           value: outreach?.smsQueued   ?? "—", color: GEM.yellow},
            { label: "Calls Today",   value: calls?.today ?? "—",         color: "#60A5FA" },
            { label: "Book Rate",     value: calls ? `${calls.appointmentRate}%` : "—", color: GEM.green },
          ].map(s => (
            <div key={s.label} style={{ background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: 8, padding: "8px 14px", minWidth: 90, flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 800, color: s.value === "—" || s.value === 0 ? "#333" : s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {/* Cards grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14 }}>
            {CARDS.map(card => <AutoCard key={card.label} {...card} />)}
          </div>

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
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{draft.subject ?? `${draft.channel.replace("_", " ")} draft`}</p>
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

        {/* Activity feed */}
        <div style={{ width: 260, flexShrink: 0, borderLeft: `1px solid ${CAVE.stoneEdge}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px 10px", borderBottom: `1px solid rgba(255,255,255,0.04)`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: "0.08em" }}>Activity Feed</p>
            <button onClick={fetchStatus} className="text-neutral-700 hover:text-neutral-400 transition-colors">
              <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            </button>
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

          <div style={{ padding: "12px 18px", borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <p style={{ margin: "0 0 8px", fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Actions</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {([
                { label: "Manage Sequences",  icon: Zap,          onClick: () => setDrawer("sequences") },
                { label: "Generate Content",  icon: Sparkles,     onClick: () => setDrawer("content")   },
                { label: "Review Email Queue", icon: Mail,         onClick: () => setDrawer("email")     },
              ] as { label: string; icon: React.ElementType; onClick: () => void }[]).map(a => (
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

      {/* Drawers */}
      {drawer === "sequences" && <SequencesDrawer onClose={() => setDrawer(null)} />}
      {drawer === "calls"     && <CallsDrawer     onClose={() => setDrawer(null)} />}
      {drawer === "email"     && <EmailDraftsDrawer onClose={() => setDrawer(null)} />}
      {drawer === "sms"       && <SMSDraftsDrawer  onClose={() => setDrawer(null)} />}
      {drawer === "content"   && <ContentGeneratorDrawer onClose={() => setDrawer(null)} />}
      {drawer === "market"    && <MarketReportsDrawer    onClose={() => setDrawer(null)} />}
    </div>
  )
}
