"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { GEM } from "@/lib/cave-theme";

const STORAGE_KEY = "gemmine_tutorial_complete_v2";

// ── Tutorial step definitions ─────────────────────────────────────────────────

interface TutorialStep {
  gem: "green" | "yellow" | "red";
  tag: string;
  title: string;
  body: string;
  switchTab?: number;
}

const STEPS: TutorialStep[] = [
  {
    gem: "green",
    tag: "Welcome",
    title: "Hey! I'm Gem — your LeadMine guide.",
    body: "I'll walk you through the platform in under 60 seconds. You'll learn how to mine property leads, grade opportunities, and close more deals — all on autopilot.",
  },
  {
    gem: "yellow",
    tag: "Navigation",
    title: "Three panels. One operation.",
    body: "Use the tabs at the top to navigate:\n\n· Command Center — KPI overview & signals\n· Lead Machine — active pipeline & mining\n· AI Assets — your autonomous agent fleet",
  },
  {
    gem: "green",
    tag: "Lead Machine",
    title: "Mine leads by ZIP code.",
    body: "Enter ZIP codes in the left panel, set your filters, then hit Mine. The AI fetches public assessor records, scores each property, and delivers graded leads.",
    switchTab: 1,
  },
  {
    gem: "yellow",
    tag: "Gem Grades",
    title: "Every lead gets a score: 0–100.",
    body: "Leads are graded automatically:\n\n· Elite Gem (65+) — call immediately\n· Refined (35–64) — nurture sequence\n· Rock (<35) — archived, not wasted",
    switchTab: 1,
  },
  {
    gem: "green",
    tag: "Take Action",
    title: "Call, text, or email in one click.",
    body: "Each lead card has action buttons. 📞 opens a live calling overlay with a timer. 💬 opens SMS with pre-written templates. ✉️ opens email — ready to send.",
    switchTab: 1,
  },
  {
    gem: "yellow",
    tag: "AI Assets",
    title: "Your 24/7 autonomous team.",
    body: "Deploy voice agents, SMS bots, and booking agents that work while you sleep. Monitor activity, pause agents, and review logs — all from AI Assets.",
    switchTab: 2,
  },
  {
    gem: "green",
    tag: "You're Ready!",
    title: "Start mining. Let's get to work.",
    body: "Enter ZIP codes → hit Mine → watch graded leads flow in. Tap the ? button in the header any time to replay this tour. Happy mining!",
    switchTab: 1,
  },
];

// ── Robot Mascot SVG ──────────────────────────────────────────────────────────

function RobotMascot({
  gemColor,
  step,
  totalSteps,
  blinking,
  waving,
}: {
  gemColor: string;
  step: number;
  totalSteps: number;
  blinking: boolean;
  waving: boolean;
}) {
  const eyeH = blinking ? 1 : 11;

  return (
    <svg
      viewBox="0 0 110 116"
      width="110"
      height="116"
      style={{ overflow: "visible" }}
    >
      {/* ── Antenna ─────────────────────────────────────────────────── */}
      <line x1="38" y1="10" x2="38" y2="2" stroke={gemColor} strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="1" r="3" fill={gemColor} style={{ filter: `drop-shadow(0 0 5px ${gemColor})` }} />
      <circle cx="38" cy="1" r="6" fill={gemColor} fillOpacity="0.2"
        style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }}
      />

      {/* ── Head ────────────────────────────────────────────────────── */}
      <rect x="5" y="10" width="66" height="42" rx="10"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1.5"
        strokeOpacity="0.65"
        style={{ filter: `drop-shadow(0 0 8px ${gemColor}20)` }}
      />
      {/* Head highlight */}
      <rect x="6" y="11" width="64" height="6" rx="9"
        fill="rgba(255,255,255,0.04)"
      />

      {/* ── Eyes ────────────────────────────────────────────────────── */}
      {/* Left eye socket */}
      <rect x="12" y="20" width="18" height="14" rx="3" fill="#06060f" />
      {/* Left eye LED */}
      <rect
        x="13" y={blinking ? 26 : "21"} width="16" height={eyeH} rx="2"
        fill={gemColor}
        style={{
          filter: `drop-shadow(0 0 5px ${gemColor})`,
          transition: "height 0.07s ease, y 0.07s ease",
        }}
      />
      {/* Right eye socket */}
      <rect x="46" y="20" width="18" height="14" rx="3" fill="#06060f" />
      {/* Right eye LED */}
      <rect
        x="47" y={blinking ? 26 : "21"} width="16" height={eyeH} rx="2"
        fill={gemColor}
        style={{
          filter: `drop-shadow(0 0 5px ${gemColor})`,
          transition: "height 0.07s ease, y 0.07s ease",
        }}
      />

      {/* ── Smile ───────────────────────────────────────────────────── */}
      <path
        d={step === STEPS.length - 1
          ? "M 14 40 Q 38 50 62 40"   // big smile at the end
          : "M 17 40 Q 38 47 59 40"}   // regular smile
        stroke={gemColor}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeOpacity="0.7"
        style={{ transition: "d 0.3s ease" }}
      />

      {/* ── Body ────────────────────────────────────────────────────── */}
      <rect x="8" y="56" width="60" height="36" rx="9"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      {/* Chest panel */}
      <rect x="15" y="62" width="46" height="22" rx="4"
        fill={gemColor}
        fillOpacity="0.055"
        stroke={gemColor}
        strokeWidth="0.75"
        strokeOpacity="0.2"
      />
      {/* Progress bar */}
      <rect x="18" y="66" width="40" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="18" y="66" width={40 * (step / totalSteps)} height="4" rx="2"
        fill={gemColor}
        style={{ transition: "width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
      {/* Step readout */}
      <text x="38" y="79" fontSize="5.5" fill={gemColor} fillOpacity="0.55"
        textAnchor="middle" fontFamily="'SF Mono', 'Fira Mono', monospace" letterSpacing="0.5"
      >
        {step}/{totalSteps}
      </text>

      {/* ── Left arm ────────────────────────────────────────────────── */}
      <rect
        x="0" y={waving ? "52" : "58"} width="7" height="26" rx="3.5"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1"
        strokeOpacity="0.3"
        style={{
          transformOrigin: "3.5px 58px",
          transform: waving ? "rotate(-40deg)" : "rotate(0deg)",
          transition: "transform 0.3s ease, y 0.3s ease",
        }}
      />

      {/* ── Right arm (holding clipboard) ───────────────────────────── */}
      <rect x="69" y="56" width="7" height="28" rx="3.5"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1"
        strokeOpacity="0.3"
      />

      {/* ── Clipboard ───────────────────────────────────────────────── */}
      {/* Board */}
      <rect x="74" y="44" width="34" height="44" rx="4"
        fill="#0d0d1e"
        stroke={gemColor}
        strokeWidth="1.2"
        strokeOpacity="0.55"
      />
      {/* Paper highlight */}
      <rect x="75" y="45" width="32" height="6" rx="3"
        fill="rgba(255,255,255,0.03)"
      />
      {/* Clip */}
      <rect x="84" y="40" width="14" height="7" rx="3"
        fill={gemColor}
        fillOpacity="0.55"
      />
      <rect x="87" y="38" width="8" height="5" rx="2"
        fill={gemColor}
        fillOpacity="0.75"
      />

      {/* Checklist items */}
      {Array.from({ length: totalSteps }).map((_, i) => (
        <g key={i}>
          {/* Checkbox */}
          <rect
            x="77" y={52 + i * 5} width="4.5" height="4.5" rx="1"
            fill={i < step ? gemColor : "transparent"}
            fillOpacity={i < step ? 0.85 : 0}
            stroke={gemColor}
            strokeWidth="0.75"
            strokeOpacity={i < step ? 0.9 : 0.3}
          />
          {/* Checkmark tick */}
          {i < step && (
            <path
              d={`M ${78} ${54.2 + i * 5} l 1.1 1.4 l 2.3 -2.6`}
              stroke="#000"
              strokeWidth="0.9"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          {/* Line */}
          <rect
            x="84" y={54 + i * 5} width={i < step ? 18 : 15} height="1.5" rx="0.75"
            fill={gemColor}
            fillOpacity={i < step ? 0.55 : 0.18}
            style={{ transition: "width 0.4s ease, fill-opacity 0.4s ease" }}
          />
        </g>
      ))}

      {/* ── Legs ────────────────────────────────────────────────────── */}
      <rect x="13" y="94" width="15" height="20" rx="6"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      <rect x="48" y="94" width="15" height="20" rx="6"
        fill="#0b0b18"
        stroke={gemColor}
        strokeWidth="1"
        strokeOpacity="0.3"
      />
      {/* Feet */}
      <rect x="11" y="107" width="19" height="8" rx="4"
        fill={gemColor}
        fillOpacity="0.1"
        stroke={gemColor}
        strokeWidth="0.75"
        strokeOpacity="0.3"
      />
      <rect x="46" y="107" width="19" height="8" rx="4"
        fill={gemColor}
        fillOpacity="0.1"
        stroke={gemColor}
        strokeWidth="0.75"
        strokeOpacity="0.3"
      />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface TutorialOverlayProps {
  onTabChange: (index: number) => void;
  forceOpen?: boolean;
  onClose?: () => void;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TutorialOverlay({ onTabChange, forceOpen = false, onClose }: TutorialOverlayProps) {
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState(0);
  const [mounted, setMounted]   = useState(false);
  const [blinking, setBlinking] = useState(false);
  const [waving, setWaving]     = useState(false);
  const [leaving, setLeaving]   = useState(false);

  // Show on first visit or forceOpen
  useEffect(() => {
    setMounted(true);
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done || forceOpen) {
      const t = setTimeout(() => {
        setVisible(true);
        // Wave on welcome
        setTimeout(() => { setWaving(true); setTimeout(() => setWaving(false), 800); }, 400);
      }, 700);
      return () => clearTimeout(t);
    }
  }, [forceOpen]);

  // Blink randomly
  useEffect(() => {
    if (!visible) return;
    const schedule = () => {
      const delay = 3000 + Math.random() * 4000;
      return setTimeout(() => {
        setBlinking(true);
        setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 140);
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [visible]);

  // Tab switching on step change
  useEffect(() => {
    const switchTab = STEPS[step]?.switchTab;
    if (switchTab !== undefined) onTabChange(switchTab);
  }, [step, onTabChange]);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      setVisible(false);
      setLeaving(false);
      localStorage.setItem(STORAGE_KEY, "1");
      onClose?.();
    }, 320);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      // Wave on last step
      if (step === STEPS.length - 2) {
        setTimeout(() => { setWaving(true); setTimeout(() => setWaving(false), 1200); }, 200);
      }
    } else {
      dismiss();
    }
  };

  const back = () => { if (step > 0) setStep((s) => s - 1); };

  if (!mounted || !visible) return null;

  const current  = STEPS[step];
  const gemColor = GEM[current.gem];
  const isFirst  = step === 0;
  const isLast   = step === STEPS.length - 1;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 z-[90]"
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(2px)",
          animation: leaving ? "fade-out 300ms ease forwards" : "fade-in 300ms ease forwards",
        }}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* ── Robot + Speech Bubble (fixed bottom-right) ── */}
      <div
        className="fixed z-[100] flex flex-col items-end"
        style={{
          bottom: "28px",
          right: "28px",
          gap: "10px",
          animation: leaving
            ? "robot-exit 300ms cubic-bezier(0.4,0,1,1) forwards"
            : "robot-enter 400ms cubic-bezier(0.22,1,0.36,1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Speech Bubble ── */}
        <div
          className="relative"
          style={{
            width: "340px",
            animation: `step-in 260ms cubic-bezier(0.22,1,0.36,1) forwards`,
            animationDelay: "60ms",
            opacity: 0,
          }}
          key={step}
        >
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#0d0d1c",
              border: `1px solid ${gemColor}35`,
              boxShadow: `0 0 0 1px ${gemColor}10, 0 20px 48px rgba(0,0,0,0.7), 0 0 32px ${gemColor}12`,
            }}
          >
            {/* Top gem bar */}
            <div
              className="h-[3px] w-full"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${gemColor} 35%, ${gemColor} 65%, transparent 100%)`,
                opacity: 0.75,
              }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.22em]"
                    style={{ color: `${gemColor}88` }}
                  >
                    {current.tag}
                  </span>
                  <h3
                    className="text-[14px] font-bold leading-tight mt-0.5"
                    style={{ color: gemColor }}
                  >
                    {current.title}
                  </h3>
                </div>
                <button
                  onClick={dismiss}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-neutral-700 hover:text-neutral-400 transition-colors ml-2 shrink-0 mt-0.5"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  aria-label="Skip tutorial"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <p className="text-[12px] text-neutral-400 leading-relaxed whitespace-pre-line">
                {current.body}
              </p>

              {/* Step dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4 mb-4">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Step ${i + 1}`}
                    style={{
                      width:  i === step ? "18px" : "5px",
                      height: "5px",
                      borderRadius: "3px",
                      background: i === step ? gemColor : i < step ? `${gemColor}45` : "rgba(255,255,255,0.1)",
                      boxShadow: i === step ? `0 0 8px ${gemColor}60` : "none",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div>
                  {isFirst ? (
                    <button
                      onClick={dismiss}
                      className="text-[11px] text-neutral-700 hover:text-neutral-500 transition-colors"
                    >
                      Skip tour
                    </button>
                  ) : (
                    <button
                      onClick={back}
                      className="flex items-center gap-1.5 text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back
                    </button>
                  )}
                </div>
                <button
                  onClick={next}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-black transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: gemColor,
                    boxShadow: `0 0 16px ${gemColor}40`,
                  }}
                >
                  {isLast ? "Start Mining 🎉" : <>Next <ArrowRight className="w-3 h-3" /></>}
                </button>
              </div>
            </div>
          </div>

          {/* Speech bubble tail — points down toward robot head */}
          <div
            className="absolute"
            style={{
              bottom: "-9px",
              right: "72px",
              width: 0,
              height: 0,
              borderLeft:  "9px solid transparent",
              borderRight: "9px solid transparent",
              borderTop:   `9px solid ${gemColor}35`,
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: "-7px",
              right: "73px",
              width: 0,
              height: 0,
              borderLeft:  "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop:   "8px solid #0d0d1c",
            }}
          />
        </div>

        {/* ── Robot (floats below bubble) ── */}
        <div
          style={{
            animation: "robot-float 3.2s ease-in-out infinite",
            alignSelf: "flex-end",
            marginRight: "8px",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "70px",
              height: "10px",
              background: gemColor,
              filter: "blur(14px)",
              opacity: 0.2,
              borderRadius: "50%",
            }}
          />
          <RobotMascot
            gemColor={gemColor}
            step={step}
            totalSteps={STEPS.length}
            blinking={blinking}
            waving={waving}
          />
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes robot-float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-6px); }
        }
        @keyframes robot-enter {
          from { opacity: 0; transform: translateY(24px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes robot-exit {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(24px) scale(0.92); }
        }
        @keyframes step-in {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes fade-in  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </>
  );
}
