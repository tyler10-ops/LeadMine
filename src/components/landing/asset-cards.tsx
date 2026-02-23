"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserCheck,
  Mail,
  LineChart,
  Megaphone,
  PhoneMissed,
} from "lucide-react";

const assets = [
  {
    title: "AI Lead Qualification Engine",
    description:
      "Scores and qualifies every inbound lead before it ever reaches your phone.",
    badge: "High ROI",
    strength: 93,
    icon: UserCheck,
  },
  {
    title: "Smart Follow-Up Sequences",
    description:
      "Multi-channel drip campaigns that re-engage cold leads automatically.",
    badge: "Revenue Driver",
    strength: 88,
    icon: Mail,
  },
  {
    title: "Market Trend Intelligence",
    description:
      "Surfaces neighborhood-level signals so you advise clients with precision.",
    badge: "Premium Asset",
    strength: 85,
    icon: LineChart,
  },
  {
    title: "Listing Exposure Amplifier",
    description:
      "Distributes new listings across channels the moment they go live.",
    badge: "Conversion Booster",
    strength: 76,
    icon: Megaphone,
  },
  {
    title: "Missed Call Conversion Bot",
    description:
      "Instantly texts back missed callers and books them into your calendar.",
    badge: "Time Multiplier",
    strength: 91,
    icon: PhoneMissed,
  },
];

/* ── Arc-gauge asset meter ── */
function AssetMeter({ value, animate }: { value: number; animate: boolean }) {
  const radius = 38;
  const stroke = 5;
  const center = 48;
  // Arc from 220° to 320° (a 240° sweep)
  const startAngle = 150;
  const sweep = 240;
  const endAngle = startAngle + sweep;

  const toRad = (d: number) => (d * Math.PI) / 180;

  const arcPath = (angleDeg: number) => {
    const r = toRad(angleDeg);
    return `${center + radius * Math.cos(r)} ${center + radius * Math.sin(r)}`;
  };

  const bgD = `M ${arcPath(startAngle)} A ${radius} ${radius} 0 1 1 ${arcPath(endAngle)}`;

  const fillAngle = startAngle + (sweep * (animate ? value : 0)) / 100;
  const largeArc = fillAngle - startAngle > 180 ? 1 : 0;
  const fillD = `M ${arcPath(startAngle)} A ${radius} ${radius} 0 ${largeArc} 1 ${arcPath(fillAngle)}`;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 96 96" className="w-full h-full">
        <defs>
          <linearGradient id={`meter-grad-${value}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0592D1" />
            <stop offset="100%" stopColor="#2CC3C3" />
          </linearGradient>
        </defs>
        {/* Background track */}
        <path
          d={bgD}
          fill="none"
          stroke="currentColor"
          className="text-neutral-200 dark:text-neutral-800"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={fillD}
          fill="none"
          stroke={`url(#meter-grad-${value})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: "drop-shadow(0 0 4px rgba(5,146,209,0.4))",
          }}
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center pt-2">
        <span className="text-xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {animate ? value : 0}
          <span className="text-xs font-medium text-neutral-400">%</span>
        </span>
      </div>
    </div>
  );
}

export function AssetCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950" />
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(5,146,209,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-brand-400 uppercase tracking-[0.2em] mb-3">
            Revenue-Grade Automations
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
            Your AI Asset Portfolio
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto leading-relaxed">
            Each automation is a measurable, revenue-generating asset — always
            on, always compounding.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset, i) => {
            const Icon = asset.icon;
            return (
              <div
                key={asset.title}
                className="group relative rounded-2xl p-[1px] transition-all duration-500"
                style={{
                  animationDelay: `${i * 80}ms`,
                  background:
                    "linear-gradient(135deg, rgba(5,146,209,0.25) 0%, rgba(44,195,195,0.10) 50%, rgba(5,146,209,0.05) 100%)",
                }}
              >
                {/* Hover glow ring */}
                <div
                  className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(5,146,209,0.45) 0%, rgba(44,195,195,0.25) 50%, rgba(5,146,209,0.15) 100%)",
                    filter: "blur(1px)",
                  }}
                />

                {/* Card body */}
                <div className="relative bg-neutral-900/95 backdrop-blur-sm rounded-2xl p-7 h-full flex flex-col group-hover:-translate-y-0.5 transition-transform duration-300">
                  {/* Badge */}
                  <div className="absolute top-5 right-5">
                    <span
                      className="relative inline-flex items-center text-[10px] font-semibold uppercase tracking-wider text-brand-400 px-2.5 py-1 rounded-full overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(5,146,209,0.15), rgba(44,195,195,0.10))",
                        boxShadow: "0 0 8px rgba(5,146,209,0.15)",
                      }}
                    >
                      {/* Shimmer overlay */}
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                          animation: "shimmer 2s ease-in-out infinite",
                        }}
                      />
                      <span className="relative">{asset.badge}</span>
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>

                  {/* Title & description */}
                  <h3 className="text-base font-semibold text-white mb-2 pr-20">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                    {asset.description}
                  </p>

                  {/* Asset meter */}
                  <div className="mt-auto">
                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider text-center mb-1">
                      Asset Strength
                    </p>
                    <AssetMeter value={asset.strength} animate={visible} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </section>
  );
}
