"use client";

import { useEffect, useState } from "react";

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
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="LeadMine" className="w-6 h-6 object-contain" />
          <span className="text-xs font-bold tracking-[0.15em] text-neutral-600 uppercase">LEADMINE</span>
        </div>
        <p className="text-xs text-neutral-700">
          &copy; {new Date().getFullYear()} LeadMine. All rights reserved.
        </p>
      </div>
    </div>
  );
}