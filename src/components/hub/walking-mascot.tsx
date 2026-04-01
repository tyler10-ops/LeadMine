"use client";

import { useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const GEM_COLORS = ["#10b981", "#f59e0b", "#ef4444"] as const;

const TIPS = [
  "Elite Gems (65+) close 3× faster — call them within the first hour.",
  "Counties with high tax delinquency rates are your best source of distressed leads.",
  "Your AI Agent never sleeps. Let it handle initial outreach while you close.",
  "Distressed properties sell 15–30% below market. That's your margin.",
  "Follow up 5× before marking a lead cold. Most realtors stop at 1.",
  "Properties vacant 6+ months often have motivated sellers. Strike first.",
  "The Lead Machine mines 24/7. Let it work while you're with clients.",
  "High equity + life event = ready to move. First realtor to call wins.",
  "Export leads to CSV and run your own analysis on high-value zip codes.",
  "AI Assets handle the grind. You focus on closing.",
  "A Refined Gem today becomes Elite with the right nurture sequence.",
  "Response speed is your edge. First realtor to call wins 70% of the time.",
  "Mine 3 counties at once on the Miner plan. Cast a wider net.",
  "Gem grades update as new data comes in. Check back for movers.",
];

// ── Walking Robot SVG ─────────────────────────────────────────────────────────

function WalkingRobotSVG({
  gemColor,
  blinking,
  leftLegUp,
}: {
  gemColor: string;
  blinking: boolean;
  leftLegUp: boolean;
}) {
  const eyeH = blinking ? 1 : 11;

  return (
    <svg
      viewBox="0 -22 110 138"
      width="88"
      height="108"
      style={{ overflow: "visible", display: "block" }}
    >
      {/* ── Mining Hat dome ──────────────────────────────────────── */}
      <rect
        x="9" y="-18" width="58" height="22" rx="8"
        fill={gemColor}
        fillOpacity="0.9"
        style={{ filter: `drop-shadow(0 0 6px ${gemColor}70)` }}
      />
      {/* Hat brim */}
      <rect x="-2" y="1" width="80" height="5" rx="2.5"
        fill={gemColor} fillOpacity="0.72"
      />
      {/* Lamp housing */}
      <circle cx="38" cy="-7" r="5.5"
        fill="rgba(0,0,0,0.3)"
        stroke={gemColor} strokeWidth="1" strokeOpacity="0.5"
      />
      {/* Lamp glow */}
      <circle cx="38" cy="-7" r="2.8"
        fill="rgba(255,255,255,0.8)"
        style={{ filter: "drop-shadow(0 0 5px rgba(255,255,255,0.95))" }}
      />

      {/* ── Head ─────────────────────────────────────────────────── */}
      <rect x="5" y="10" width="66" height="42" rx="10"
        fill="#0b0b18"
        stroke={gemColor} strokeWidth="1.5" strokeOpacity="0.65"
        style={{ filter: `drop-shadow(0 0 8px ${gemColor}20)` }}
      />
      <rect x="6" y="11" width="64" height="6" rx="9" fill="rgba(255,255,255,0.04)" />

      {/* ── Eyes ─────────────────────────────────────────────────── */}
      <rect x="12" y="20" width="18" height="14" rx="3" fill="#06060f" />
      <rect
        x="13" y={blinking ? 26 : 21} width="16" height={eyeH} rx="2"
        fill={gemColor}
        style={{ filter: `drop-shadow(0 0 5px ${gemColor})`, transition: "height 0.07s ease" }}
      />
      <rect x="46" y="20" width="18" height="14" rx="3" fill="#06060f" />
      <rect
        x="47" y={blinking ? 26 : 21} width="16" height={eyeH} rx="2"
        fill={gemColor}
        style={{ filter: `drop-shadow(0 0 5px ${gemColor})`, transition: "height 0.07s ease" }}
      />

      {/* ── Smile ────────────────────────────────────────────────── */}
      <path
        d="M 17 40 Q 38 47 59 40"
        stroke={gemColor} strokeWidth="1.5" fill="none"
        strokeLinecap="round" strokeOpacity="0.7"
      />

      {/* ── Body ─────────────────────────────────────────────────── */}
      <rect x="8" y="56" width="60" height="36" rx="9"
        fill="#0b0b18" stroke={gemColor} strokeWidth="1" strokeOpacity="0.4"
      />
      {/* Chest gem indicator */}
      <circle cx="38" cy="73" r="7"
        fill={gemColor} fillOpacity="0.1"
        stroke={gemColor} strokeWidth="1" strokeOpacity="0.3"
      />
      <circle cx="38" cy="73" r="3"
        fill={gemColor} fillOpacity="0.75"
        style={{ filter: `drop-shadow(0 0 4px ${gemColor})` }}
      />

      {/* ── Left arm (swings opposite to right) ──────────────────── */}
      <rect x="0" y="58" width="7" height="26" rx="3.5"
        fill="#0b0b18" stroke={gemColor} strokeWidth="1" strokeOpacity="0.3"
        style={{
          transformOrigin: "3.5px 62px",
          transform: leftLegUp ? "rotate(18deg)" : "rotate(-18deg)",
          transition: "transform 0.28s ease",
        }}
      />

      {/* ── Right arm (holds pickaxe, swings) ────────────────────── */}
      <rect x="69" y="56" width="7" height="22" rx="3.5"
        fill="#0b0b18" stroke={gemColor} strokeWidth="1" strokeOpacity="0.3"
        style={{
          transformOrigin: "72.5px 62px",
          transform: leftLegUp ? "rotate(-22deg)" : "rotate(10deg)",
          transition: "transform 0.28s ease",
        }}
      />

      {/* ── Pickaxe (swings with right arm) ──────────────────────── */}
      <g
        style={{
          transformOrigin: "72px 80px",
          transform: leftLegUp ? "rotate(-22deg)" : "rotate(10deg)",
          transition: "transform 0.28s ease",
        }}
      >
        {/* Handle */}
        <line
          x1="74" y1="78" x2="103" y2="49"
          stroke={gemColor} strokeOpacity="0.8" strokeWidth="2.5" strokeLinecap="round"
        />
        {/* Pick head crossbar */}
        <line
          x1="91" y1="38" x2="111" y2="58"
          stroke={gemColor} strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${gemColor}70)` }}
        />
        {/* Front tip */}
        <path
          d="M 111 58 Q 116 63 108 56"
          stroke={gemColor} strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeOpacity="0.9"
        />
        {/* Back tip */}
        <path
          d="M 91 38 Q 87 33 94 42"
          stroke={gemColor} strokeWidth="2.5" fill="none"
          strokeLinecap="round" strokeOpacity="0.9"
        />
      </g>

      {/* ── Legs ─────────────────────────────────────────────────── */}
      <rect x="13" y="94" width="15" height="20" rx="6"
        fill="#0b0b18" stroke={gemColor} strokeWidth="1" strokeOpacity="0.3"
        style={{
          transformOrigin: "20.5px 94px",
          transform: leftLegUp ? "rotate(22deg)" : "rotate(-12deg)",
          transition: "transform 0.25s ease",
        }}
      />
      <rect x="48" y="94" width="15" height="20" rx="6"
        fill="#0b0b18" stroke={gemColor} strokeWidth="1" strokeOpacity="0.3"
        style={{
          transformOrigin: "55.5px 94px",
          transform: leftLegUp ? "rotate(-12deg)" : "rotate(22deg)",
          transition: "transform 0.25s ease",
        }}
      />
      {/* Feet */}
      <rect x="11" y="107" width="19" height="8" rx="4"
        fill={gemColor} fillOpacity="0.1"
        stroke={gemColor} strokeWidth="0.75" strokeOpacity="0.3"
        style={{
          transformOrigin: "20.5px 94px",
          transform: leftLegUp ? "rotate(22deg)" : "rotate(-12deg)",
          transition: "transform 0.25s ease",
        }}
      />
      <rect x="46" y="107" width="19" height="8" rx="4"
        fill={gemColor} fillOpacity="0.1"
        stroke={gemColor} strokeWidth="0.75" strokeOpacity="0.3"
        style={{
          transformOrigin: "55.5px 94px",
          transform: leftLegUp ? "rotate(-12deg)" : "rotate(22deg)",
          transition: "transform 0.25s ease",
        }}
      />

      {/* ── Ground shadow ────────────────────────────────────────── */}
      <ellipse cx="38" cy="117" rx="28" ry="4"
        fill={gemColor} fillOpacity="0.07"
        style={{ filter: "blur(3px)" }}
      />
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function WalkingMascot() {
  const [x, setX]                   = useState(80);
  const [direction, setDirection]   = useState<1 | -1>(1);
  const [colorIndex, setColorIndex] = useState(0);
  const [tipIndex, setTipIndex]     = useState(0);
  const [tipVisible, setTipVisible] = useState(true);
  const [bubbleOpen, setBubbleOpen] = useState(true);
  const [blinking, setBlinking]     = useState(false);
  const [leftLegUp, setLeftLegUp]   = useState(false);
  const [mounted, setMounted]       = useState(false);

  const xRef   = useRef(80);
  const dirRef = useRef<1 | -1>(1);

  useEffect(() => { setMounted(true); }, []);

  // Walking movement
  useEffect(() => {
    if (!mounted) return;
    const id = setInterval(() => {
      const maxX = window.innerWidth - 130;
      const next = xRef.current + dirRef.current * 1.8;

      if (next >= maxX) {
        dirRef.current = -1;
        setDirection(-1);
        xRef.current = maxX;
      } else if (next <= 20) {
        dirRef.current = 1;
        setDirection(1);
        xRef.current = 20;
      } else {
        xRef.current = next;
      }
      setX(xRef.current);
    }, 33);
    return () => clearInterval(id);
  }, [mounted]);

  // Leg alternation
  useEffect(() => {
    const id = setInterval(() => setLeftLegUp((v) => !v), 320);
    return () => clearInterval(id);
  }, []);

  // Color cycling — green → yellow → red → repeat
  useEffect(() => {
    const id = setInterval(() => {
      setColorIndex((i) => (i + 1) % GEM_COLORS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // Tip cycling
  useEffect(() => {
    const id = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        setTipVisible(true);
      }, 500);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  // Random blinking
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeoutId = setTimeout(() => {
        setBlinking(true);
        timeoutId = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 140);
      }, 3000 + Math.random() * 4000);
    };
    schedule();
    return () => clearTimeout(timeoutId);
  }, []);

  if (!mounted) return null;

  const gemColor = GEM_COLORS[colorIndex];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: `${x}px`,
        zIndex: 49,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      {/* ── Tip bubble ── */}
      {bubbleOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "116px",
            left: "44px",
            transform: "translateX(-50%)",
            width: "210px",
            opacity: tipVisible ? 1 : 0,
            transition: "opacity 0.45s ease",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              background: "#0d0d1c",
              border: `1px solid ${gemColor}30`,
              borderRadius: "12px",
              padding: "10px 13px",
              boxShadow: `0 0 0 1px ${gemColor}10, 0 8px 28px rgba(0,0,0,0.65), 0 0 18px ${gemColor}10`,
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setBubbleOpen(false)}
              style={{
                position: "absolute",
                top: "6px",
                right: "7px",
                width: "16px",
                height: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "4px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.4)",
                fontSize: "10px",
                lineHeight: 1,
                padding: 0,
              }}
              title="Dismiss"
            >
              ×
            </button>

            {/* Accent bar */}
            <div
              style={{
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${gemColor}, transparent)`,
                opacity: 0.65,
                borderRadius: "1px",
                marginBottom: "7px",
              }}
            />
            <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5", paddingRight: "10px" }}>
              <span
                style={{
                  display: "block",
                  color: gemColor,
                  fontSize: "9.5px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: "3px",
                }}
              >
                Gem Tip
              </span>
              {TIPS[tipIndex]}
            </p>
          </div>
          {/* Tail outer */}
          <div
            style={{
              position: "absolute",
              bottom: "-7px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: `7px solid ${gemColor}30`,
            }}
          />
          {/* Tail inner */}
          <div
            style={{
              position: "absolute",
              bottom: "-5px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #0d0d1c",
            }}
          />
        </div>
      )}

      {/* ── Robot (flips direction, clickable to toggle bubble) ── */}
      <div
        onClick={() => setBubbleOpen((v) => !v)}
        title={bubbleOpen ? "Hide tip" : "Show tip"}
        style={{
          transform: `scaleX(${direction})`,
          transformOrigin: "44px 100%",
          transition: "transform 0.18s ease",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      >
        <WalkingRobotSVG
          gemColor={gemColor}
          blinking={blinking}
          leftLegUp={leftLegUp}
        />
      </div>
    </div>
  );
}
