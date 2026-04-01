"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Radio, Bot, Zap, TrendingUp, MapPin } from "lucide-react";
import type Anthropic from "@anthropic-ai/sdk";
import { GEM, CAVE } from "@/lib/cave-theme";
import { cn } from "@/lib/utils";
import { SubscriptionGate } from "@/components/ui/subscription-gate";
import type { Plan } from "@/lib/plan-limits";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface IntelligenceAgentPanelProps {
  isActive: boolean;
  realtorSlug?: string;
  businessName?: string;
  plan?: string;
  isUnlocked?: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BRIEFING_PROMPT =
  "Generate my intelligence briefing for today. Surface the top buyer and seller signals you've detected — be specific with budgets, timelines, locations, and sources. Rank them by deal potential. Then tell me the single most important action I should take right now.";

const QUICK_ACTIONS = [
  { label: "Morning Briefing", icon: TrendingUp, prompt: BRIEFING_PROMPT },
  {
    label: "Buyer Signals",
    icon: Zap,
    prompt:
      "Show me all active buyer intent signals in my target counties. Give me budget ranges, timelines, and what type of property they want. Rank by urgency.",
  },
  {
    label: "Draft Outreach",
    icon: MapPin,
    prompt:
      "Based on the top signal you see right now, write me a complete outreach message — ready to send. Include subject line, body, and a clear CTA. Make it feel personal, not templated.",
  },
];

// ── Message rendering ─────────────────────────────────────────────────────────

function AgentMessage({ message }: { message: Message }) {
  const lines = message.content.split("\n");

  return (
    <div className="flex flex-col gap-1.5">
      {/* Avatar row */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${GEM.green}18`, border: `1px solid ${GEM.green}35` }}
        >
          <Bot className="w-2.5 h-2.5" style={{ color: GEM.green }} />
        </div>
        <span
          className="text-[9.5px] font-bold uppercase tracking-[0.18em]"
          style={{ color: `${GEM.green}65` }}
        >
          Intelligence Agent
        </span>
        <span className="text-[9px] text-neutral-700">
          {message.timestamp.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Bubble */}
      <div
        className="ml-7 rounded-2xl rounded-tl-sm p-4"
        style={{
          background: "#1a1a1a",
          borderTop: `1px solid ${CAVE.stoneEdge}`,
          borderRight: `1px solid ${CAVE.stoneEdge}`,
          borderBottom: `1px solid ${CAVE.stoneEdge}`,
          borderLeft: `2px solid ${GEM.green}50`,
        }}
      >
        <div className="space-y-1 text-[12.5px] text-neutral-300 leading-relaxed">
          {lines.map((line, i) => {
            // Section headers: ## or ###
            if (line.startsWith("### ")) {
              return (
                <p key={i} className="text-[11.5px] font-bold text-neutral-200 mt-3 mb-0.5 first:mt-0">
                  {line.slice(4)}
                </p>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <p key={i} className="text-[13px] font-bold text-neutral-100 mt-4 mb-1 first:mt-0">
                  {line.slice(3)}
                </p>
              );
            }
            // Bold-prefixed lines: **Label** content
            if (line.startsWith("**") && line.includes("**", 2)) {
              const endBold = line.indexOf("**", 2);
              const boldPart = line.slice(2, endBold);
              const rest = line.slice(endBold + 2);
              const color =
                boldPart.includes("🔴") ? GEM.red
                : boldPart.includes("🟡") ? GEM.yellow
                : boldPart.includes("🟢") ? GEM.green
                : undefined;
              return (
                <p key={i} className="mt-2 first:mt-0">
                  <strong
                    className="font-semibold text-[12px]"
                    style={{ color: color ?? "rgba(255,255,255,0.85)" }}
                  >
                    {boldPart}
                  </strong>
                  <span className="text-neutral-400">{rest}</span>
                </p>
              );
            }
            // Bullet list items
            if (line.startsWith("- ") || line.startsWith("• ")) {
              const content = line.slice(2);
              return (
                <div key={i} className="flex gap-2 ml-1">
                  <span
                    className="shrink-0 mt-[3px] text-[9px]"
                    style={{ color: `${GEM.green}80` }}
                  >
                    ▸
                  </span>
                  <span className="text-neutral-350 text-[12px] leading-relaxed">
                    {content}
                  </span>
                </div>
              );
            }
            // Horizontal dividers
            if (line.startsWith("---")) {
              return (
                <div
                  key={i}
                  className="my-2 h-px"
                  style={{ background: CAVE.stoneEdge }}
                />
              );
            }
            // Empty lines
            if (line.trim() === "") return <div key={i} className="h-1" />;
            // Regular text
            return (
              <p key={i} className="text-[12.5px] text-neutral-300 leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>

        {/* Streaming cursor */}
        {message.isStreaming && message.content && (
          <span
            className="inline-block w-[2px] h-3.5 rounded-full ml-0.5 animate-pulse"
            style={{ background: GEM.green, verticalAlign: "text-bottom" }}
          />
        )}
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[9px] text-neutral-700 mr-2">You</span>
      <div
        className="rounded-2xl rounded-tr-sm px-4 py-3 max-w-[82%]"
        style={{
          background: "#222222",
          border: `1px solid ${CAVE.stoneEdge}`,
        }}
      >
        <p className="text-[12.5px] text-neutral-300 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function IntelligenceAgentPanel({
  isActive,
  businessName,
  plan,
  isUnlocked,
}: IntelligenceAgentPanelProps) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [signalCount]             = useState(() => Math.floor(Math.random() * 9) + 4);

  const messagesEndRef  = useRef<HTMLDivElement>(null);
  const inputRef        = useRef<HTMLTextAreaElement>(null);
  const briefingDone    = useRef(false);
  const conversationRef = useRef<Anthropic.MessageParam[]>([]);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Core send function (stable via ref pattern)
  const sendToAgent = useCallback(
    async (prompt: string, hidden = false) => {
      // Optionally show user message
      if (!hidden) {
        const userMsg: Message = {
          id: `u-${Date.now()}`,
          role: "user",
          content: prompt,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
      }

      // Append to conversation history
      conversationRef.current = [
        ...conversationRef.current,
        { role: "user", content: prompt },
      ];

      // Placeholder agent message
      const agentId = `a-${Date.now()}`;
      const agentMsg: Message = {
        id: agentId,
        role: "agent",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, agentMsg]);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/intelligence/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: conversationRef.current,
            context: { businessName, plan },
          }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId
                ? { ...m, content: "Failed to connect. Please try again.", isStreaming: false }
                : m
            )
          );
          return;
        }

        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let agentContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          agentContent += decoder.decode(value, { stream: true });
          const snapshot = agentContent;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === agentId ? { ...m, content: snapshot, isStreaming: true } : m
            )
          );
        }

        // Finalize message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId ? { ...m, content: agentContent, isStreaming: false } : m
          )
        );

        conversationRef.current = [
          ...conversationRef.current,
          { role: "assistant", content: agentContent },
        ];
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentId
              ? { ...m, content: "Connection error. Please try again.", isStreaming: false }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [businessName, plan]
  );

  // Keep a stable ref so the effect below never becomes stale
  const sendToAgentRef = useRef(sendToAgent);
  useEffect(() => {
    sendToAgentRef.current = sendToAgent;
  }, [sendToAgent]);

  // Auto-briefing on first activation
  useEffect(() => {
    if (isActive && !briefingDone.current) {
      briefingDone.current = true;
      const t = setTimeout(() => sendToAgentRef.current(BRIEFING_PROMPT, true), 700);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendToAgent(text);
  }, [input, isStreaming, sendToAgent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (isUnlocked === false) {
    return (
      <SubscriptionGate
        featureName="Intelligence Agent"
        description="AI-powered market briefings, signal detection, and strategic recommendations — delivered as a live conversation."
        requiredPlan="operator"
        currentPlan={(plan as Plan) ?? "free"}
        isUnlocked={false}
        unlocks={[
          "Daily AI market briefings",
          "Buyer & seller signal detection",
          "Live strategic recommendations",
          "Natural language Q&A with your data",
        ]}
      >
        <div />
      </SubscriptionGate>
    );
  }

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all duration-500",
        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
      )}
      style={{ background: CAVE.deep }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-3.5"
        style={{ borderBottom: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: GEM.green }}
            />
            <div
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{ background: GEM.green, opacity: 0.45 }}
            />
          </div>
          <Radio className="w-3.5 h-3.5" style={{ color: GEM.green }} />
          <div>
            <p className="text-[13px] font-bold text-neutral-200 leading-none">
              Intelligence Agent
            </p>
            <p className="text-[10px] text-neutral-600 mt-0.5">
              Scanning public signals &middot; {signalCount} opportunities detected today
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
            <button
              key={label}
              onClick={() => !isStreaming && sendToAgent(prompt)}
              disabled={isStreaming}
              className="flex items-center gap-1.5 text-[10.5px] px-3 py-1.5 rounded-xl font-medium transition-all disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: `${GEM.green}0d`,
                border: `1px solid ${GEM.green}22`,
                color: GEM.green,
              }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scroll-smooth">
        {/* Loading state before first message */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: GEM.green }} />
            <p className="text-[12px] text-neutral-500">
              Agent is preparing your briefing…
            </p>
          </div>
        )}

        {messages.map((msg) =>
          msg.role === "agent" ? (
            <AgentMessage key={msg.id} message={msg} />
          ) : (
            <UserMessage key={msg.id} message={msg} />
          )
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 px-6 py-4"
        style={{ borderTop: `1px solid ${CAVE.stoneMid}` }}
      >
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask your agent… What's trending in Travis County? Draft outreach for the top buyer signal."
              rows={1}
              disabled={isStreaming}
              className="w-full resize-none rounded-2xl px-4 py-3 text-[12.5px] text-neutral-200 placeholder:text-neutral-700 outline-none transition-colors"
              style={{
                background: "#1a1a1a",
                border: `1px solid ${isStreaming ? CAVE.stoneMid : CAVE.stoneEdge}`,
                maxHeight: "120px",
                scrollbarWidth: "none",
                lineHeight: "1.5",
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background:
                input.trim() && !isStreaming
                  ? GEM.green
                  : "rgba(255,255,255,0.045)",
              border: `1px solid ${
                input.trim() && !isStreaming ? GEM.green : CAVE.stoneEdge
              }`,
            }}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
            ) : (
              <Send
                className="w-4 h-4"
                style={{ color: input.trim() ? "#000" : "#555" }}
              />
            )}
          </button>
        </div>

        <p className="text-[10px] text-neutral-800 mt-2 ml-1">
          Enter to send &middot; Shift+Enter for new line &middot; Powered by Claude Opus
        </p>
      </div>
    </div>
  );
}
