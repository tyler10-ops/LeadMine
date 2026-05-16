"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function StickyFooter() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t py-4 transition-transform duration-300 ease-out"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        background: "rgba(7,7,13,0.85)",
        backdropFilter: "blur(12px)",
        transform: visible ? "translateY(0)" : "translateY(100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-wrap items-center justify-between gap-y-2">
        <div className="flex items-center gap-1">
          <img src="/logo.png" alt="LeadMine" className="w-9 h-9 object-contain" />
          <span className="text-xs font-bold tracking-[0.15em] text-neutral-600 uppercase">LEADMINE</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-neutral-600">
          <Link href="/privacy" className="hover:text-neutral-300 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-neutral-300 transition-colors">Terms</Link>
          <span className="text-neutral-700 hidden sm:inline">
            &copy; {new Date().getFullYear()} LeadMine
          </span>
        </div>
      </div>
    </div>
  );
}