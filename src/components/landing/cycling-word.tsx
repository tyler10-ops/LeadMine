"use client";

import { useState, useEffect, useRef } from "react";

const WORDS = ["Leads", "Insights", "Intelligence"];
const HOLD_MS       = 2500;
const TRANSITION_MS = 400;

export function CyclingWord() {
  const [index, setIndex]     = useState(0);
  const [visible, setVisible] = useState(true);
  const containerRef          = useRef<HTMLSpanElement>(null);
  const measureRef            = useRef<HTMLSpanElement>(null);

  // Lock the container to the widest word so layout never shifts
  useEffect(() => {
    if (!containerRef.current || !measureRef.current) return;
    const w = measureRef.current.offsetWidth;
    containerRef.current.style.width = `${w}px`;
  }, []);

  useEffect(() => {
    const cycle = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, TRANSITION_MS);
    }, HOLD_MS + TRANSITION_MS);

    return () => clearInterval(cycle);
  }, []);

  const gradientStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #00FF88 0%, #33FFB0 50%, #FFD60A 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <>
      {/* Off-screen element to measure the widest word */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          ...gradientStyle,
        }}
      >
        Intelligence
      </span>

      <span
        ref={containerRef}
        style={{
          display: "inline-block",
          overflow: "visible",
          paddingBottom: "0.5em",
          verticalAlign: "top",
        }}
      >
        <span
          style={{
            display: "block",
            whiteSpace: "nowrap",
            paddingBottom: "0.5em",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-10px)",
            transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
          }}
        >
          <span style={gradientStyle}>{WORDS[index]}</span>
        </span>
      </span>
    </>
  );
}