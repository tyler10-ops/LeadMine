"use client";

import { useEffect, useRef, useState } from "react";
import {
  Inbox,
  PhoneCall,
  ClipboardCheck,
  CalendarCheck2,
  BarChart3,
} from "lucide-react";

/**
 * How It Works — carousel slides.
 *
 * To replace placeholder icons with real graphics later, swap the `icon`
 * field for an <Image /> or SVG component and adjust the rendering in the
 * slide card below.
 */
const slides = [
  {
    title: "Lead Captured",
    icon: Inbox,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-500",
    description:
      "Leads arrive from your website, ads, or referrals and are instantly logged into the system — no manual entry required.",
  },
  {
    title: "AI Contact",
    icon: PhoneCall,
    iconBg: "bg-brand-100",
    iconColor: "text-brand-600",
    description:
      "Within seconds the AI agent reaches out via call, text, or email — professional, calm, and on-brand every time.",
  },
  {
    title: "Qualification",
    icon: ClipboardCheck,
    iconBg: "bg-aqua-50",
    iconColor: "text-teal-400",
    description:
      "The AI asks the right questions to determine budget, timeline, and intent so you only spend time on serious prospects.",
  },
  {
    title: "Booked Appointment",
    icon: CalendarCheck2,
    iconBg: "bg-brand-50",
    iconColor: "text-brand-400",
    description:
      "Qualified leads are booked directly onto your calendar. You show up, they show up — no back-and-forth scheduling.",
  },
  {
    title: "Dashboard Insight",
    icon: BarChart3,
    iconBg: "bg-aqua-50",
    iconColor: "text-brand-600",
    description:
      "Every interaction is logged. Track conversion rates, agent performance, and estimated ROI in real time.",
  },
];

const CARD_WIDTH = 300; // sm:w-[300px]
const GAP = 24; // gap-6
const STEP = CARD_WIDTH + GAP;
const TOTAL_WIDTH = slides.length * STEP;

function SlideCard({ slide, index }: { slide: (typeof slides)[number]; index: number }) {
  const Icon = slide.icon;
  const step = (index % slides.length) + 1;
  return (
    <article className="relative flex-shrink-0 w-[280px] sm:w-[300px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
      <span className="absolute top-4 right-4 text-[11px] font-semibold text-neutral-300 dark:text-neutral-600 tabular-nums">
        {String(step).padStart(2, "0")}
      </span>
      {/* Icon placeholder — swap with <Image /> for real assets */}
      <div
        className={`w-12 h-12 rounded-xl ${slide.iconBg} flex items-center justify-center mb-5`}
      >
        <Icon className={`w-6 h-6 ${slide.iconColor}`} />
      </div>
      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {slide.title}
      </h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
        {slide.description}
      </p>
      {/* Connector line */}
      <div className="hidden sm:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-neutral-300 dark:border-neutral-700" />
    </article>
  );
}

export function HowItWorksCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  /* ── Continuous loop animation ── */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let lastTime: number | null = null;
    const speed = 40; // pixels per second

    function tick(now: number) {
      if (lastTime !== null && !paused) {
        const dt = (now - lastTime) / 1000;
        offsetRef.current += speed * dt;

        // Reset seamlessly when one full set has scrolled past
        if (offsetRef.current >= TOTAL_WIDTH) {
          offsetRef.current -= TOTAL_WIDTH;
        }

        track!.style.transform = `translate3d(-${offsetRef.current}px, 0, 0)`;
      }
      lastTime = now;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused]);

  return (
    <section className="py-28 bg-neutral-50 dark:bg-neutral-950" id="how-it-works">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-[0.2em] mb-3">
            Step by Step
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
            How It Works
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed">
            From first contact to closed deal — here is how the automation
            works for you behind the scenes.
          </p>
        </div>

        {/* Carousel viewport */}
        <div
          className="overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          role="region"
          aria-label="How it works steps"
        >
          {/* Sliding track — 3 copies for seamless wrap */}
          <div
            ref={trackRef}
            className="flex gap-6 will-change-transform"
            style={{ width: `${TOTAL_WIDTH * 3}px` }}
          >
            {[0, 1, 2].map((copy) =>
              slides.map((slide, i) => (
                <SlideCard
                  key={`${copy}-${slide.title}`}
                  slide={slide}
                  index={i}
                />
              ))
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mt-8">
          {slides.map((slide, i) => {
            const Icon = slide.icon;
            return (
              <div
                key={slide.title}
                className="flex items-center gap-1.5 text-neutral-400"
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  {slide.title}
                </span>
                {i < slides.length - 1 && (
                  <span className="text-neutral-300 dark:text-neutral-600 ml-1.5">&rarr;</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
