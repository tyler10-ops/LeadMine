"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "lm_cookie_consent_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: Date.now() }));
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, at: Date.now() }));
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 rounded-xl shadow-2xl"
      style={{
        background: "rgba(10,10,16,0.96)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
      role="dialog"
      aria-labelledby="cookie-banner-title"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Cookie className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#00FF88" }} />
          <div className="flex-1 min-w-0">
            <p id="cookie-banner-title" className="text-[12px] font-semibold text-neutral-200 mb-1">
              We use cookies
            </p>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              LeadMine uses essential cookies for authentication and analytics cookies to improve the product.
              See our{" "}
              <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>
              {" "}for details.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={accept}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-black transition-opacity hover:opacity-90"
                style={{ background: "#00FF88" }}
              >
                Accept
              </button>
              <button
                onClick={dismiss}
                className="text-[11px] font-medium text-neutral-500 hover:text-neutral-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-300 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}