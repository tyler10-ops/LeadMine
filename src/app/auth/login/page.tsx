"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `https://www.leadmineapp.com/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ background: "#07070d" }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 40% at 50% -5%, rgba(0,255,136,0.07) 0%, transparent 65%)",
      }} />

      <div className="w-full max-w-[360px] relative z-10">

        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-10">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-black"
            style={{ background: "linear-gradient(135deg, #00FF88 0%, #00CC66 100%)", boxShadow: "0 2px 16px rgba(0,255,136,0.35)" }}
          >
            LM
          </div>
          <span className="text-[15px] font-bold tracking-tight text-neutral-100">Lead Mine</span>
        </Link>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1.5">Sign in to your account to continue</p>
        </div>

        {/* Google — primary CTA */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
          <span className="text-[11px] text-neutral-600 tracking-wide">or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* Email / Password card */}
        <div className="rounded-2xl border p-6 relative" style={{ background: "#0d0d16", borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.25), transparent)" }} />

          <form onSubmit={handleLogin} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Password</label>
                <Link href="/auth/forgot" className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors">Forgot?</Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-neutral-600 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="font-semibold hover:text-neutral-200 transition-colors" style={{ color: "#00FF88" }}>
            Get started free
          </Link>
        </p>
      </div>
    </div>
  );
}
