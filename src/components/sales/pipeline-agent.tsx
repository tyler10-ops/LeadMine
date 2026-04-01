"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";

interface Message {
  role:    "user" | "assistant";
  content: string;
  loading?: boolean;
}

const STARTER_PROMPTS = [
  "Who should I follow up with today?",
  "Which leads are most likely to convert?",
  "How's the pipeline looking overall?",
  "Which prospects engaged with my emails?",
  "Who's closest to booking a demo?",
];

function Gem({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size * 1.35,
      clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
      background: color,
      filter: `drop-shadow(0 0 4px ${color})`,
      flexShrink: 0,
    }} />
  );
}

export function PipelineAgent() {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Welcome message
      setMessages([{
        role:    "assistant",
        content: "Pipeline agent online. I have real-time access to your prospect data. Ask me who to contact, what's hot, or how the funnel looks.",
      }]);
    }
  }, [open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const loadingMsg: Message = { role: "assistant", content: "", loading: true };

    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res  = await fetch("/api/marketing/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      const reply = data.reply ?? data.error ?? "Something went wrong.";
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Connection error. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  // Collapsed toggle bar
  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all"
        style={{ background: "#080808", borderColor: `${GEM.diamond}25` }}
      >
        <Gem color={GEM.diamond} size={8} />
        <span className="text-xs font-semibold" style={{ color: GEM.diamond }}>Pipeline Agent</span>
        <span className="text-xs ml-1" style={{ color: "#333" }}>· Ask about your prospects</span>
        <Sparkles size={11} style={{ color: "#333", marginLeft: "auto" }} />
      </button>
    );
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "#080808", borderColor: `${GEM.diamond}25` }}>

      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b cursor-pointer"
        style={{ borderColor: `${GEM.diamond}15` }}
        onClick={() => setOpen(false)}
      >
        <Gem color={GEM.diamond} size={8} />
        <span className="text-xs font-semibold" style={{ color: GEM.diamond }}>Pipeline Agent</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GEM.green }} />
          <span className="text-xs" style={{ color: "#333" }}>Live pipeline data</span>
        </div>
        <ChevronDown size={12} style={{ color: "#333" }} />
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                background: msg.role === "assistant" ? `${GEM.diamond}15` : `${GEM.green}15`,
                border: `1px solid ${msg.role === "assistant" ? GEM.diamond : GEM.green}25`,
              }}
            >
              {msg.role === "assistant"
                ? <Bot size={11} style={{ color: GEM.diamond }} />
                : <User size={11} style={{ color: GEM.green }} />
              }
            </div>

            {/* Bubble */}
            <div
              className="max-w-xs rounded-2xl px-3 py-2"
              style={{
                background:  msg.role === "assistant" ? "#0f0f0f" : `${GEM.green}12`,
                border:      `1px solid ${msg.role === "assistant" ? CAVE.stoneEdge : GEM.green + "25"}`,
                borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
              }}
            >
              {msg.loading ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 size={11} className="animate-spin" style={{ color: GEM.diamond }} />
                  <span className="text-xs" style={{ color: "#444" }}>Analyzing pipeline…</span>
                </div>
              ) : (
                <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: msg.role === "assistant" ? "#bbb" : "#fff" }}>
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Starter prompts — show when only welcome message exists */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {STARTER_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ background: "#111", border: `1px solid ${CAVE.stoneEdge}`, color: "#555" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t flex gap-2" style={{ borderColor: `${GEM.diamond}10` }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask about your pipeline…"
          disabled={loading}
          className="flex-1 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-800 focus:outline-none disabled:opacity-40"
          style={{ background: "#0f0f0f", border: `1px solid ${CAVE.stoneEdge}` }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
          style={{
            background: input.trim() ? `${GEM.diamond}20` : "#0f0f0f",
            border: `1px solid ${input.trim() ? GEM.diamond + "40" : CAVE.stoneEdge}`,
          }}
        >
          {loading ? <Loader2 size={12} className="animate-spin" style={{ color: GEM.diamond }} /> : <Send size={12} style={{ color: GEM.diamond }} />}
        </button>
      </div>
    </div>
  );
}