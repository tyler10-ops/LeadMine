"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X, MapPin, ChevronRight } from "lucide-react";
import { TargetingCard } from "@/components/onboarding/targeting-card";
import type { TargetingFormData } from "@/components/onboarding/targeting-card";

const SUGGESTED_MARKETS = [
  "Travis County, TX",
  "Harris County, TX",
  "Miami-Dade County, FL",
  "Maricopa County, AZ",
  "King County, WA",
  "Clark County, NV",
  "Fulton County, GA",
  "Orange County, CA",
];

type Stage = "profile" | "targeting";

export default function OnboardingPage() {
  const [stage, setStage]             = useState<Stage>("profile");
  const [realtorId, setRealtorId]     = useState<string | null>(null);
  const [name, setName]               = useState("");
  const [countyInput, setCountyInput] = useState("");
  const [counties, setCounties]       = useState<string[]>([]);
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [checking, setChecking]       = useState(true);
  const [submittingTarget, setSubmittingTarget] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // DEV PREVIEW: ?preview=1 skips auth so the form is visible without a session
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("preview") === "1") {
      setChecking(false);
      return;
    }

    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: client } = await supabase
        .from("clients")
        .select("id, target_locations")
        .eq("user_id", user.id)
        .single();

      if (client) {
        // Client exists — check if they already have search_areas configured
        const { data: realtor } = await supabase
          .from("realtors")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (realtor) {
          const { data: areas } = await supabase
            .from("search_areas")
            .select("id")
            .eq("realtor_id", realtor.id)
            .limit(1);

          if (areas && areas.length > 0) {
            // Fully onboarded — go to dashboard
            router.push("/dashboard");
            return;
          }

          // Has realtor but no search_areas — skip profile step, go straight to targeting
          setRealtorId(realtor.id);
          if (client.target_locations?.length) setCounties(client.target_locations);
          setStage("targeting");
          setChecking(false);
          return;
        }

        // Has client but no realtor — create one then show targeting
        const slug = `user-${user.id.slice(0, 8)}-${Date.now()}`;
        const { data: newRealtor } = await supabase
          .from("realtors")
          .insert({ user_id: user.id, name: "My Team", slug, city: "", state: null, brand_color: "#00FF88", plan: "free" })
          .select("id")
          .single();
        if (newRealtor) {
          setRealtorId(newRealtor.id);
          if (client.target_locations?.length) setCounties(client.target_locations);
          setStage("targeting");
        } else {
          router.push("/dashboard");
        }
        setChecking(false);
        return;
      }

      setChecking(false);
    };
    checkAuth();
  }, [router]);

  const addCounty = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !counties.includes(trimmed) && counties.length < 5) {
      setCounties([...counties, trimmed]);
      setCountyInput("");
    }
  };

  const removeCounty = (c: string) =>
    setCounties(counties.filter((x) => x !== c));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addCounty(countyInput); }
  };

  // Stage 1: create client + realtor records, advance to targeting
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name or business name."); return; }
    if (counties.length === 0) { setError("Add at least one target county."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please sign in again."); setLoading(false); return; }

    // Create client record
    const { error: clientError } = await supabase.from("clients").insert({
      user_id:          user.id,
      business_name:    name.trim(),
      industry:         "real_estate",
      target_locations: counties,
    });

    if (clientError) {
      setError("Failed to save profile. Please try again.");
      setLoading(false);
      return;
    }

    // Create realtor record (required for search_areas)
    const slug = `${name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
    const firstCounty = counties[0] || "";
    const parts = firstCounty.split(",");
    const city = parts[0]?.trim() || firstCounty;
    const state = parts[1]?.trim() || null;

    const { data: realtor, error: realtorError } = await supabase
      .from("realtors")
      .insert({
        user_id:     user.id,
        name:        name.trim(),
        slug,
        city,
        state,
        brand_color: "#00FF88",
        plan:        "free",
      })
      .select("id")
      .single();

    if (realtorError || !realtor) {
      // Realtor may already exist — try to fetch
      const { data: existing } = await supabase
        .from("realtors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        setRealtorId(existing.id);
      } else {
        // Non-fatal — skip targeting card
        router.push("/dashboard");
        return;
      }
    } else {
      setRealtorId(realtor.id);
    }

    setLoading(false);
    setStage("targeting");
  };

  // Stage 2: save targeting profile then go to dashboard
  const handleTargetingSubmit = async (formData: TargetingFormData) => {
    if (!realtorId) { router.push("/dashboard"); return; }

    setSubmittingTarget(true);
    const supabase = createClient();

    // Combine cities from targeting with original counties
    const allCities = [...new Set([...formData.cities, ...counties])];

    await supabase.from("search_areas").insert({
      realtor_id:           realtorId,
      name:                 "Primary Mining Zone",
      zip_codes:            formData.zipCodes,
      cities:               allCities,
      counties:             counties,
      state:                null,
      property_types:       formData.propertyTypes,
      min_years_owned:      formData.minYearsOwned,
      min_equity_pct:       formData.minEquityPct,
      opportunity_types:    ["seller", "buyer"],
      min_price:            formData.minPrice ? parseFloat(formData.minPrice) : null,
      max_price:            formData.maxPrice ? parseFloat(formData.maxPrice) : null,
      lead_type_preference: formData.leadTypePreference,
      seller_signals:       formData.sellerSignals,
      buyer_signals:        formData.buyerSignals,
      deal_goal:            formData.dealGoal,
      is_onboarding_profile: true,
    });

    // Trigger first mining job automatically so the user sees leads immediately
    try {
      const allCounties = counties.length > 0 ? counties : formData.cities;
      const firstEntry  = allCounties[0] || "";
      const parts       = firstEntry.split(",");
      const countyName  = parts[0]?.trim().replace(/\s+County$/i, "") || firstEntry;
      const state       = parts[1]?.trim() || "";

      if (countyName && state) {
        const countyNames = allCounties
          .filter((c) => c.split(",")[1]?.trim() === state)
          .map((c) => c.split(",")[0].trim().replace(/\s+County$/i, ""));

        await fetch("/api/mining/property-start", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            counties:      countyNames.length > 0 ? countyNames : [countyName],
            state,
            propertyTypes: formData.propertyTypes.length > 0 ? formData.propertyTypes : ["single_family"],
            zipCodes:      formData.zipCodes,
            minYearsOwned: formData.minYearsOwned,
            minEquityPct:  formData.minEquityPct,
          }),
        });
      }
    } catch {
      // Non-fatal — user still proceeds to dashboard
    }

    setSubmittingTarget(false);
    router.push("/dashboard/hub?mined=1");
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080f]">
        <Loader2 className="w-5 h-5 animate-spin text-[#00FF88]" />
      </div>
    );
  }

  // ── Stage 2: Targeting Card ────────────────────────────────────────────────

  if (stage === "targeting") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#08080f" }}>
        <TargetingCard onSubmit={handleTargetingSubmit} isSubmitting={submittingTarget} />
      </div>
    );
  }

  // ── Stage 1: Profile Setup ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#08080f" }}>
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-10">
          <img src="/logo.png" alt="LeadMine" className="w-16 h-16 object-contain mb-4" />
          <h1 className="text-[22px] font-bold text-neutral-100 tracking-tight">
            Set up your mine
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1.5 leading-relaxed">
            Tell us where you work and we&apos;ll start surfacing<br />
            buyer and seller signals in your markets.
          </p>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
              Your Name or Team Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Johnson · Keller Williams"
              className="w-full rounded-xl px-4 py-3 text-[13px] text-neutral-100 placeholder:text-neutral-700 outline-none transition-colors"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>

          {/* Counties */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
              Target Counties / Markets
              <span className="ml-2 text-neutral-700 font-normal normal-case tracking-normal">up to 5</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={countyInput}
                onChange={(e) => setCountyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Travis County, TX"
                disabled={counties.length >= 5}
                className="flex-1 rounded-xl px-4 py-3 text-[13px] text-neutral-100 placeholder:text-neutral-700 outline-none transition-colors disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <button
                type="button"
                onClick={() => addCounty(countyInput)}
                disabled={counties.length >= 5 || !countyInput.trim()}
                className="px-4 py-3 rounded-xl text-[12px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(0,255,136,0.1)",
                  border: "1px solid rgba(0,255,136,0.25)",
                  color: "#00FF88",
                }}
              >
                Add
              </button>
            </div>

            {/* Added counties */}
            {counties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {counties.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                    style={{
                      background: "rgba(0,255,136,0.08)",
                      border: "1px solid rgba(0,255,136,0.2)",
                      color: "#00FF88",
                    }}
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCounty(c)}
                      className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested markets */}
            {counties.length === 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-neutral-700 mb-2">Popular markets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => addCounty(m)}
                      className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#525252",
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-[12px] px-3 py-2 rounded-xl"
              style={{
                color: "#FF3B30",
                background: "rgba(255,59,48,0.08)",
                border: "1px solid rgba(255,59,48,0.2)",
              }}
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "#00FF88",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,255,136,0.35)",
            }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin text-black" />
              : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>
            }
          </button>

          <p className="text-center text-[10px] text-neutral-700">
            Next: configure your targeting parameters
          </p>
        </form>
      </div>
    </div>
  );
}
