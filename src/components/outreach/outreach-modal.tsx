"use client";

import { useState } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import {
  X,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import type { PropertyLead, OutreachChannel, OutreachTone, OutreachDraft } from "@/types";

// ── Channel / Tone configs ──────────────────────────────────────────────────

const CHANNELS: { value: OutreachChannel; label: string; icon: React.ReactNode }[] = [
  { value: "email",       label: "Email",       icon: <Mail className="w-3.5 h-3.5" /> },
  { value: "sms",         label: "SMS",         icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { value: "call_script", label: "Call Script", icon: <Phone className="w-3.5 h-3.5" /> },
];

const TONES: { value: OutreachTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "casual",       label: "Casual" },
  { value: "urgent",       label: "Urgent" },
];

// ── Props ──────────────────────────────────────────────────────────────────

interface OutreachModalProps {
  lead: PropertyLead;
  realtorId: string | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────

export function OutreachModal({ lead, realtorId, onClose }: OutreachModalProps) {
  const [channel, setChannel] = useState<OutreachChannel>("email");
  const [tone,    setTone]    = useState<OutreachTone>("professional");
  const [draft,   setDraft]   = useState<OutreachDraft | null>(null);
  const [body,    setBody]    = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [copied,  setCopied]  = useState(false);
  const [approved, setApproved] = useState(false);

  const name = lead.owner_name || lead.business_name || "the owner";

  const generate = async () => {
    setLoading(true);
    setError(null);
    setApproved(false);

    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, channel, tone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate outreach");
        return;
      }

      setDraft(data.draft as OutreachDraft);
      setBody(data.draft.body);
      setSubject(data.draft.subject ?? "");
    } catch {
      setError("Network error — could not reach server");
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!draft) return;

    await Promise.allSettled([
      fetch("/api/outreach/generate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id, status: "approved", body, subject }),
      }),
      fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          last_contact_at: new Date().toISOString(),
          stage: "contacted",
        }),
      }),
    ]);

    setApproved(true);
  };

  const copyToClipboard = async () => {
    const text = channel === "email" && subject ? `Subject: ${subject}\n\n${body}` : body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl flex flex-col max-h-[90vh]"
        style={{
          background: CAVE.surface1,
          border: `1px solid ${CAVE.stone}`,
          boxShadow: GLOW.green.medium,
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b"
          style={{ borderColor: CAVE.stoneEdge }}
        >
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Draft Outreach</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 truncate max-w-xs">
              {name}
              {lead.property_city ? ` · ${lead.property_city}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-600 hover:text-neutral-300 transition-colors mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Config bar */}
        <div
          className="flex items-center gap-4 px-5 py-3 border-b flex-wrap"
          style={{ borderColor: CAVE.stoneEdge }}
        >
          {/* Channel */}
          <div className="flex gap-1">
            {CHANNELS.map((c) => {
              const active = channel === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => { setChannel(c.value); setDraft(null); setBody(""); setSubject(""); setApproved(false); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: active ? `${GEM.green}14` : "transparent",
                    border: `1px solid ${active ? GLOW.green.border : "transparent"}`,
                    color: active ? GEM.green : "#737373",
                  }}
                >
                  {c.icon}
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Tone */}
          <div className="flex gap-1 ml-auto">
            {TONES.map((t) => {
              const active = tone === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => { setTone(t.value); setDraft(null); setBody(""); setSubject(""); setApproved(false); }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    color: active ? "#e5e5e5" : "#737373",
                    border: `1px solid ${active ? CAVE.stone : "transparent"}`,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!draft && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="w-8 h-8 text-neutral-700 mb-3" />
              <p className="text-sm text-neutral-500 mb-1">
                Generate a personalized {channel === "call_script" ? "call script" : channel} for this lead
              </p>
              <p className="text-[11px] text-neutral-600">
                Tone: {tone} · Channel: {CHANNELS.find((c) => c.value === channel)?.label}
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-500 mb-2" />
              <p className="text-sm text-neutral-500">Writing your message...</p>
            </div>
          )}

          {error && !loading && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: GLOW.red.bg, border: `1px solid ${GLOW.red.border}`, color: GEM.red }}
            >
              {error}
            </div>
          )}

          {draft && !loading && (
            <div className="space-y-3">
              {/* Subject line (email only) */}
              {channel === "email" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                    Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-neutral-200 border focus:outline-none transition-colors"
                    style={{ background: CAVE.surface2, borderColor: CAVE.stoneEdge }}
                  />
                </div>
              )}

              {/* Message body */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-600 mb-1.5 font-medium">
                  {channel === "call_script" ? "Script" : "Message"}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={channel === "call_script" ? 12 : 8}
                  className="w-full rounded-lg px-3 py-2 text-sm text-neutral-200 border focus:outline-none transition-colors resize-none leading-relaxed"
                  style={{ background: CAVE.surface2, borderColor: CAVE.stoneEdge }}
                />
              </div>

              {approved && (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{ background: GLOW.green.bg, border: `1px solid ${GLOW.green.border}`, color: GEM.green }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approved — ready to send
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div
          className="flex items-center gap-2 px-5 py-4 border-t flex-wrap"
          style={{ borderColor: CAVE.stoneEdge }}
        >
          {!draft ? (
            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${GEM.green}, #00CC66)`,
                color: "#000",
                boxShadow: `0 2px 12px rgba(0,255,136,0.25)`,
              }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              Generate Message
            </button>
          ) : (
            <>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${CAVE.stoneEdge}`,
                  color: "#a3a3a3",
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>

              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${CAVE.stoneEdge}`,
                  color: copied ? GEM.green : "#a3a3a3",
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>

              {!approved && (
                <button
                  onClick={approve}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ml-auto"
                  style={{
                    background: `${GEM.green}14`,
                    border: `1px solid ${GLOW.green.border}`,
                    color: GEM.green,
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
