"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const GEM_GREEN = "#00FF88";

interface NavProps {
  isAuthenticated: boolean;
}

export function LandingNav({ isAuthenticated }: NavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <nav className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto relative z-20">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1 shrink-0" onClick={close}>
        <img src="/logo.png" alt="LeadMine" className="w-[52px] h-[52px] sm:w-[68px] sm:h-[68px] object-contain" />
        <div>
          <span className="text-sm font-bold tracking-[0.15em] text-neutral-100 uppercase">Lead</span>
          <span className="text-[10px] font-medium text-neutral-600 tracking-[0.3em] uppercase ml-1.5">MINE</span>
        </div>
      </Link>

      {/* Desktop links */}
      <div className="hidden sm:flex items-center gap-3">
        <Link href="#pricing" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
          Pricing
        </Link>
        <Link href="/auth/login" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
          Sign in
        </Link>
        {isAuthenticated ? (
          <Link
            href="/dashboard/hub"
            className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all"
            style={{ background: GEM_GREEN, color: "#000", boxShadow: "0 0 20px rgba(0,255,136,0.25)" }}
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            href="/auth/signup"
            className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-all"
            style={{ background: GEM_GREEN, color: "#000", boxShadow: "0 0 20px rgba(0,255,136,0.25)" }}
          >
            Start Mining
          </Link>
        )}
      </div>

      {/* Mobile hamburger button */}
      <button
        className="sm:hidden p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile menu overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: "rgba(7,7,13,0.97)" }}
          onClick={close}
        >
          <div
            className="absolute top-0 right-0 w-72 h-full flex flex-col px-6 pt-20 pb-10 gap-2"
            style={{ background: "#0d0d18", borderLeft: "1px solid rgba(255,255,255,0.06)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-5 right-5 p-2 text-neutral-500 hover:text-neutral-200"
              onClick={close}
            >
              <X size={20} />
            </button>

            <Link
              href="#pricing"
              onClick={close}
              className="text-base text-neutral-300 hover:text-white transition-colors py-3 border-b border-neutral-800"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              onClick={close}
              className="text-base text-neutral-300 hover:text-white transition-colors py-3 border-b border-neutral-800"
            >
              Sign in
            </Link>
            <div className="mt-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard/hub"
                  onClick={close}
                  className="block w-full text-center text-sm px-5 py-3 rounded-lg font-semibold"
                  style={{ background: GEM_GREEN, color: "#000" }}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link
                  href="/auth/signup"
                  onClick={close}
                  className="block w-full text-center text-sm px-5 py-3 rounded-lg font-semibold"
                  style={{ background: GEM_GREEN, color: "#000" }}
                >
                  Start Mining
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
