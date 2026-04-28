"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, X, MapPin, ChevronRight } from "lucide-react";
import { TargetingCard } from "@/components/onboarding/targeting-card";
import type { TargetingFormData } from "@/components/onboarding/targeting-card";

const SUGGESTED_ZIPS = [
  "78701", // Austin, TX
  "77002", // Houston, TX
  "33101", // Miami, FL
  "85001", // Phoenix, AZ
  "98101", // Seattle, WA
  "89101", // Las Vegas, NV
  "30301", // Atlanta, GA
  "92801", // Anaheim, CA
];

type Stage = "profile" | "targeting";

export default function OnboardingPage() {
  const [stage, setStage]         = useState<Stage>("profile");
  const [realtorId, setRealtorId] = useState<string | null>(null);
  const [name, setName]           = useState("");
  const [zipInput, setZipInput]   = useState("");
  const [zipCodes, setZipCodes]   = useState<string[]>([]);
  const [zipError, setZipError]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [checking, setChecking]   = useState(true);
  const [submittingTarget, setSubmittingTarget] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
            router.push("/dashboard");
            return;
          }

          setRealtorId(realtor.id);
          if (client.target_locations?.length) setZipCodes(client.target_locations);
          setStage("targeting");
          setChecking(false);
          return;
        }

        const slug = `user-${user.id.slice(0, 8)}-${Date.now()}`;
        const { data: newRealtor } = await supabase
          .from("realtors")
          .insert({ user_id: user.id, name: "My Team", slug, city: "", state: null, brand_color: "#00FF88", plan: "free" })
          .select("id")
          .single();
        if (newRealtor) {
          setRealtorId(newRealtor.id);
          if (client.target_locations?.length) setZipCodes(client.target_locations);
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

  const addZip = (raw: string) => {
    const zip = raw.trim().replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) { setZipError("Enter a valid 5-digit ZIP code"); return; }
    if (zipCodes.includes(zip)) { setZipError("Already added"); return; }
    if (zipCodes.length >= 5) { setZipError("Max 5 ZIP codes for now"); return; }
    setZipCodes((prev) => [...prev, zip]);
    setZipInput("");
    setZipError("");
  };

  const removeZip = (z: string) =>
    setZipCodes((prev) => prev.filter((x) => x !== z));

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addZip(zipInput); }
  };

  // Stage 1: create client + realtor records, advance to targeting
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Enter your name or business name."); return; }
    if (zipCodes.length === 0) { setError("Add at least one target ZIP code."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expired. Please sign in again."); setLoading(false); return; }

    const { error: clientError } = await supabase.from("clients").insert({
      user_id:          user.id,
      business_name:    name.trim(),
      industry:         "real_estate",
      target_locations: zipCodes,
    });

    if (clientError) {
      setError("Failed to save profile. Please try again.");
      setLoading(false);
      return;
    }

    const slug = `${name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;

    const { data: realtor, error: realtorError } = await supabase
      .from("realtors")
      .insert({
        user_id:     user.id,
        name:        name.trim(),
        slug,
        city:        "",
        state:       null,
        brand_color: "#00FF88",
        plan:        "free",
      })
      .select("id")
      .single();

    if (realtorError || !realtor) {
      const { data: existing } = await supabase
        .from("realtors")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (existing) {
        setRealtorId(existing.id);
      } else {
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

    // Merge ZIPs from profile step with any from the targeting card
    const allZips = [...new Set([...zipCodes, ...(formData.zipCodes ?? [])])];

    await supabase.from("search_areas").insert({
      realtor_id:            realtorId,
      name:                  "Primary Mining Zone",
      zip_codes:             allZips,
      cities:                formData.cities,
      counties:              [],
      state:                 null,
      property_types:        formData.propertyTypes,
      min_years_owned:       formData.minYearsOwned,
      min_equity_pct:        formData.minEquityPct,
      opportunity_types:     ["seller", "buyer"],
      min_price:             formData.minPrice ? parseFloat(formData.minPrice) : null,
      max_price:             formData.maxPrice ? parseFloat(formData.maxPrice) : null,
      lead_type_preference:  formData.leadTypePreference,
      seller_signals:        formData.sellerSignals,
      buyer_signals:         formData.buyerSignals,
      deal_goal:             formData.dealGoal,
      is_onboarding_profile: true,
    });

    // Trigger first mining job using ZIP codes
    if (allZips.length > 0) {
      try {
        await fetch("/api/mining/property-start", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            zipCodes:      allZips,
            propertyTypes: formData.propertyTypes.length > 0 ? formData.propertyTypes : ["single_family"],
            minYearsOwned: formData.minYearsOwned,
            minEquityPct:  formData.minEquityPct,
          }),
        });
      } catch {
        // Non-fatal — user still proceeds to dashboard
      }
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
          <img src="/logo.png" alt="LeadMine" className="w-20 h-20 object-contain mb-4" />
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

          {/* ZIP Codes */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
              Target ZIP Codes
              <span className="ml-2 text-neutral-700 font-normal normal-case tracking-normal">up to 5</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zipInput}
                onChange={(e) => { setZipInput(e.target.value.replace(/\D/g, "")); setZipError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 78701"
                disabled={zipCodes.length >= 5}
                className="flex-1 rounded-xl px-4 py-3 text-[13px] text-neutral-100 placeholder:text-neutral-700 outline-none transition-colors disabled:opacity-40"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${zipError ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.08)"}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,136,0.4)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = zipError ? "rgba(255,59,48,0.4)" : "rgba(255,255,255,0.08)")}
              />
              <button
                type="button"
                onClick={() => addZip(zipInput)}
                disabled={zipCodes.length >= 5 || zipInput.length !== 5}
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

            {zipError && (
              <p className="text-[11px] mt-1.5" style={{ color: "#FF3B30" }}>{zipError}</p>
            )}

            {/* Added ZIPs */}
            {zipCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {zipCodes.map((z) => (
                  <span
                    key={z}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
                    style={{
                      background: "rgba(0,255,136,0.08)",
                      border: "1px solid rgba(0,255,136,0.2)",
                      color: "#00FF88",
                    }}
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    {z}
                    <button
                      type="button"
                      onClick={() => removeZip(z)}
                      className="opacity-60 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested ZIPs */}
            {zipCodes.length === 0 && (
              <div className="mt-3">
                <p className="text-[10px] text-neutral-700 mb-2">Popular markets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_ZIPS.map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => addZip(z)}
                      className="text-[10px] px-2.5 py-1 rounded-lg transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#525252",
                      }}
                    >
                      {z}
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