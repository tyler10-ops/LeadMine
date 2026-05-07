"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, DollarSign, Zap, LogIn, LayoutDashboard } from "lucide-react";

const GEM_GREEN = "#00FF88";

interface NavProps {
  isAuthenticated: boolean;
}

const NAV_LINKS = [
  { href: "/about",    label: "How It Works", sub: "The full pipeline explained",   icon: BookOpen    },
  { href: "/#pricing", label: "Pricing",       sub: "Plans for solo agents & teams", icon: DollarSign  },
  { href: "/demo",     label: "Book a Demo",   sub: "See LeadMine live in action",   icon: Zap         },
];

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
        <Link href="/about" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
          How It Works
        </Link>
        <Link href="/#pricing" className="text-sm text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-2">
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

      {/* Mobile hamburger */}
      <button
        className="sm:hidden p-2 text-neutral-400 hover:text-neutral-100 transition-colors"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          style={{ background: "rgba(7,7,13,0.85)" }}
          onClick={close}
        >
          <div
            className="absolute top-0 right-0 w-80 h-full flex flex-col"
            style={{ background: "#0d0d18", borderLeft: "1px solid rgba(255,255,255,0.07)" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="LeadMine" className="w-8 h-8 object-contain" />
                <span className="text-xs font-bold tracking-widest text-neutral-400 uppercase">LeadMine</span>
              </div>
              <button className="p-1.5 text-neutral-600 hover:text-neutral-200 transition-colors" onClick={close}>
                <X size={18} />
              </button>
            </div>

            {/* Nav links with icons + subtitles */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {NAV_LINKS.map(({ href, label, sub, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl group transition-colors hover:bg-white/[0.04]"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors group-hover:bg-white/[0.06]" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <Icon size={15} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">{label}</div>
                    <div className="text-[11px] text-neutral-700 mt-0.5">{sub}</div>
                  </div>
                </Link>
              ))}

              {/* Divider */}
              <div className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }} />

              {/* Auth links */}
              <Link
                href="/auth/login"
                onClick={close}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl group transition-colors hover:bg-white/[0.04]"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <LogIn size={15} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">Sign In</div>
                  <div className="text-[11px] text-neutral-700 mt-0.5">Access your dashboard</div>
                </div>
              </Link>

              {isAuthenticated && (
                <Link
                  href="/dashboard/hub"
                  onClick={close}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl group transition-colors hover:bg-white/[0.04]"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,136,0.08)" }}>
                    <LayoutDashboard size={15} style={{ color: GEM_GREEN }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-300 group-hover:text-white transition-colors">Dashboard</div>
                    <div className="text-[11px] text-neutral-700 mt-0.5">Go to your command center</div>
                  </div>
                </Link>
              )}
            </div>

            {/* CTA at bottom */}
            <div className="px-4 pb-8 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <Link
                href={isAuthenticated ? "/dashboard/hub" : "/auth/signup"}
                onClick={close}
                className="block w-full text-center text-sm py-3.5 rounded-xl font-bold transition-all"
                style={{ background: GEM_GREEN, color: "#000", boxShadow: "0 0 24px rgba(0,255,136,0.2)" }}
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Mining Free"}
              </Link>
              {!isAuthenticated && (
                <p className="text-center text-[11px] text-neutral-700 mt-2.5">No credit card required</p>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
