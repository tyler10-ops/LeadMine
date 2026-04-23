"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";
import type { ClientIndustry } from "@/types";
import type { PaidPlan, BillingInterval } from "@/lib/stripe";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const INDUSTRIES: { value: ClientIndustry; label: string }[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "roofing",     label: "Roofing"     },
  { value: "plumbing",    label: "Plumbing"    },
  { value: "hvac",        label: "HVAC"        },
  { value: "dental",      label: "Dental"      },
  { value: "legal",       label: "Legal"       },
  { value: "landscaping", label: "Landscaping" },
  { value: "other",       label: "Other"       },
];

function SignupForm() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState<ClientIndustry>("real_estate");
  const [locationInput, setLocationInput] = useState("");
  const [targetLocations, setTargetLocations] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Plan intent from pricing page (e.g. ?plan=miner&billing=month)
  const planIntent    = searchParams.get("plan") as PaidPlan | null;
  const billingIntent = (searchParams.get("billing") ?? "month") as BillingInterval;

  const addLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !targetLocations.includes(trimmed)) {
      setTargetLocations([...targetLocations, trimmed]);
      setLocationInput("");
    }
  };

  const removeLocation = (loc: string) => setTargetLocations(targetLocations.filter((l) => l !== loc));

  const handleLocationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addLocation(); }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();

    // If a paid plan was chosen, encode the checkout redirect as the callback `next` param
    const callbackNext = planIntent
      ? `/api/stripe/checkout-redirect?plan=${planIntent}&billing=${billingIntent}`
      : "/dashboard";

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
      },
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (!authData.user) { setError("Failed to create account"); setLoading(false); return; }
    const { error: clientError } = await supabase.from("clients").insert({
      user_id: authData.user.id,
      business_name: businessName,
      industry,
      target_locations: targetLocations,
    });
    if (clientError) { setError("Account created but profile setup failed. Please contact support."); setLoading(false); return; }

    // If user came from a paid plan CTA, start Stripe checkout immediately
    if (planIntent) {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ plan: planIntent, billingInterval: billingIntent }),
        });
        const data = await res.json() as { url?: string };
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch {
        // Fall through to dashboard if checkout fails
      }
    }

    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative" style={{ background: "#07070d" }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(0,255,136,0.07) 0%, transparent 65%)",
      }} />

      <div className="w-full max-w-[380px] relative z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <img src="/logo.png" alt="LeadMine" className="w-10 h-10 object-contain" style={{ mixBlendMode: "lighten" }} />
          <span className="text-[15px] font-bold tracking-tight text-neutral-100">Lead Mine</span>
        </Link>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Create your account</h1>
          <p className="text-sm text-neutral-500 mt-1.5">Start finding high-equity leads automatically</p>
        </div>

        {/* Google — primary CTA */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-semibold text-[#1a1a1a] transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          style={{
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-600" /> : <GoogleIcon />}
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          <span className="text-[11px] text-neutral-600 tracking-wide">or sign up with email</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border p-6 relative" style={{ background: "#0d0d16", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.25), transparent)" }} />

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wider">Business Name</label>
              <Input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Jane Smith Realty"
                required
                className="bg-[#0a0a12] border-white/[0.08] text-neutral-100 placeholder:text-neutral-700 focus:border-[#00FF88]/40 h-10"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wider">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as ClientIndustry)}
                className="w-full rounded-xl border px-3 h-10 text-sm outline-none transition-colors appearance-none"
                style={{ background: "#0a0a12", borderColor: "rgba(255,255,255,0.08)", color: "#e5e5e5" }}
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.value} value={ind.value} style={{ background: "#0d0d14" }}>{ind.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wider">Target Markets</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={handleLocationKeyDown}
                  placeholder="Austin, TX"
                  className="bg-[#0a0a12] border-white/[0.08] text-neutral-100 placeholder:text-neutral-700 focus:border-[#00FF88]/40 h-10"
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="px-3 rounded-xl text-[11px] font-semibold text-neutral-400 shrink-0 transition-colors hover:text-neutral-100"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  Add
                </button>
              </div>
              {targetLocations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {targetLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      style={{ background: "rgba(0,255,136,0.08)", color: "#00FF88", border: "1px solid rgba(0,255,136,0.2)" }}
                    >
                      {loc}
                      <button type="button" onClick={() => removeLocation(loc)} className="hover:opacity-70 transition-opacity ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wider">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-[#0a0a12] border-white/[0.08] text-neutral-100 placeholder:text-neutral-700 focus:border-[#00FF88]/40 h-10"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 mb-1.5 block uppercase tracking-wider">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="bg-[#0a0a12] border-white/[0.08] text-neutral-100 placeholder:text-neutral-700 focus:border-[#00FF88]/40 h-10"
              />
            </div>

            {error && (
              <p className="text-[12px] py-2 px-3 rounded-lg" style={{ color: "#FF6B6B", background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.15)" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl text-[13px] font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#00FF88", boxShadow: "0 0 24px rgba(0,255,136,0.2)" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-neutral-600 mt-5">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold hover:text-neutral-200 transition-colors" style={{ color: "#00FF88" }}>
            Sign in
          </Link>
        </p>

        <p className="text-center text-[11px] text-neutral-700 mt-4">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="hover:text-neutral-500 transition-colors underline underline-offset-2">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:text-neutral-500 transition-colors underline underline-offset-2">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
