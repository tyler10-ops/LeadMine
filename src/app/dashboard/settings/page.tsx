"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import {
  ArrowLeft,
  MapPin,
  LogOut,
  Loader2,
  Check,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  email:         string;
  businessName:  string;
  industry:      string;
  plan:          string;
  markets:       string[];
  clientId:      string | null;
  realtorId:     string | null;
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: CAVE.surface1, border: `1px solid ${CAVE.stoneEdge}` }}
    >
      <div
        className="px-5 py-3.5 border-b"
        style={{ borderColor: CAVE.stoneEdge }}
      >
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          {title}
        </h2>
      </div>
      <div className="divide-y" style={{ borderColor: CAVE.stoneEdge }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 gap-4">
      <span className="text-[13px] text-neutral-400 shrink-0 w-36">{label}</span>
      <div className="flex-1 flex items-center justify-end">{children}</div>
    </div>
  );
}

function ReadOnlyField({ value }: { value: string }) {
  return (
    <span className="text-[13px] text-neutral-300">{value}</span>
  );
}

function EditableField({
  value,
  onSave,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          placeholder={placeholder}
          className="px-3 py-1.5 rounded-lg text-[13px] text-neutral-100 outline-none"
          style={{
            background: CAVE.surface2,
            border: `1px solid ${GLOW.green.border}`,
            minWidth: "200px",
          }}
        />
        <button
          onClick={handleSave}
          disabled={saving || !draft.trim()}
          className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
          style={{ background: "rgba(0,255,136,0.12)", color: GEM.green }}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => { setDraft(value); setEditing(false); }}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors"
          style={{ background: CAVE.surface2 }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 group"
    >
      <span className="text-[13px] text-neutral-300 group-hover:text-neutral-100 transition-colors">
        {value || <span className="text-neutral-600">{placeholder}</span>}
      </span>
      <span className="text-[10px] text-neutral-700 group-hover:text-neutral-500 transition-colors uppercase tracking-wider">
        Edit
      </span>
    </button>
  );
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free:      { label: "Free",      color: "#737373" },
  miner:     { label: "Miner",     color: GEM.green  },
  operator:  { label: "Operator",  color: GEM.yellow },
  brokerage: { label: "Brokerage", color: "#00FFD4"  },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile,      setProfile]      = useState<ProfileData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [marketInput,  setMarketInput]  = useState("");
  const [savingMarket, setSavingMarket] = useState(false);
  const [emailNotifs,  setEmailNotifs]  = useState(true);
  const [pushNotifs,   setPushNotifs]   = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const router = useRouter();

  // ── Load profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: client } = await supabase
        .from("clients")
        .select("id, business_name, industry, plan, target_locations")
        .eq("user_id", user.id)
        .single();

      const { data: realtor } = await supabase
        .from("realtors")
        .select("id, name, plan, city, state")
        .eq("user_id", user.id)
        .single();

      const { data: notifPrefs } = await supabase
        .from("notification_preferences")
        .select("email_enabled, push_enabled")
        .eq("user_id", user.id)
        .single();

      if (notifPrefs) {
        setEmailNotifs(notifPrefs.email_enabled ?? true);
        setPushNotifs(notifPrefs.push_enabled ?? false);
      }

      // Build markets from realtor city/state if no client record
      const realtorMarket = realtor?.city
        ? `${realtor.city}${realtor.state ? `, ${realtor.state}` : ""}`
        : null;

      setProfile({
        email:        user.email ?? "",
        businessName: client?.business_name ?? realtor?.name ?? "",
        industry:     client?.industry ?? "real_estate",
        plan:         client?.plan ?? realtor?.plan ?? "free",
        markets:      client?.target_locations ?? (realtorMarket ? [realtorMarket] : []),
        clientId:     client?.id ?? null,
        realtorId:    realtor?.id ?? null,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  // ── Activity logging helper ──────────────────────────────────────────────────
  const logEvent = (eventType: string, title: string, description?: string) => {
    fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, title, description }),
    }).catch(() => {});
  };

  // ── Save business name ───────────────────────────────────────────────────────
  const saveBusinessName = async (name: string) => {
    const supabase = createClient();
    if (profile?.clientId) {
      await supabase.from("clients").update({ business_name: name }).eq("id", profile.clientId);
    } else if (profile?.realtorId) {
      await supabase.from("realtors").update({ name }).eq("id", profile.realtorId);
    } else return;
    setProfile((p) => p ? { ...p, businessName: name } : p);
    logEvent("settings_updated", `Business name updated to "${name}"`);
  };

  // ── Markets ──────────────────────────────────────────────────────────────────
  const addMarket = async () => {
    const trimmed = marketInput.trim();
    if (!trimmed || (!profile?.clientId && !profile?.realtorId)) return;
    if (profile.markets.includes(trimmed)) { setMarketInput(""); return; }
    setSavingMarket(true);
    const updated = [...profile.markets, trimmed];
    const supabase = createClient();
    if (profile.clientId) {
      await supabase.from("clients").update({ target_locations: updated }).eq("id", profile.clientId);
    }
    setProfile((p) => p ? { ...p, markets: updated } : p);
    setMarketInput("");
    setSavingMarket(false);
    logEvent("market_added", `Market added: ${trimmed}`);
  };

  const removeMarket = async (market: string) => {
    if (!profile?.clientId && !profile?.realtorId) return;
    const updated = profile.markets.filter((m) => m !== market);
    const supabase = createClient();
    if (profile.clientId) {
      await supabase.from("clients").update({ target_locations: updated }).eq("id", profile.clientId);
    }
    setProfile((p) => p ? { ...p, markets: updated } : p);
    logEvent("market_removed", `Market removed: ${market}`);
  };

  // ── Notification toggles ────────────────────────────────────────────────────
  const toggleNotif = async (type: "email" | "push", val: boolean) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (type === "email") setEmailNotifs(val);
    else setPushNotifs(val);
    await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, email_enabled: type === "email" ? val : emailNotifs, push_enabled: type === "push" ? val : pushNotifs })
      .eq("user_id", user.id);
  };

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setSignOutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080808" }}>
        <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
      </div>
    );
  }

  const planInfo = PLAN_LABELS[profile?.plan ?? "free"] ?? PLAN_LABELS.free;

  return (
    <div className="min-h-screen" style={{ background: "#080808" }}>

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 h-[52px] border-b backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.95)", borderColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/hub"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-white/[0.06]" />
          <h1 className="text-[13px] font-semibold text-neutral-200">Settings</h1>
        </div>

        {/* Plan badge */}
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
          style={{
            color:       planInfo.color,
            background:  `${planInfo.color}14`,
            border:      `1px solid ${planInfo.color}30`,
          }}
        >
          {planInfo.label}
        </span>
      </header>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">

        {/* ── Profile ── */}
        <Section title="Profile">
          <Row label="Business Name">
            <EditableField
              value={profile?.businessName ?? ""}
              onSave={saveBusinessName}
              placeholder="Your name or team name"
            />
          </Row>
          <Row label="Email">
            <ReadOnlyField value={profile?.email ?? ""} />
          </Row>
          <Row label="Industry">
            <ReadOnlyField value={(profile?.industry ?? "real_estate").replace(/_/g, " ")} />
          </Row>
        </Section>

        {/* ── Target Markets ── */}
        <Section title="Target Markets">
          <div className="px-5 py-4 space-y-3">
            <p className="text-[12px] text-neutral-500 leading-relaxed">
              These markets define where LeadMine mines for leads and how your heat scores are calculated.
            </p>

            {/* Current markets */}
            {(profile?.markets ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile!.markets.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{
                      background: "rgba(0,255,136,0.07)",
                      border:     `1px solid ${GLOW.green.border}`,
                      color:      GEM.green,
                    }}
                  >
                    <MapPin className="w-3 h-3 opacity-70" />
                    {m}
                    <button
                      onClick={() => removeMarket(m)}
                      className="opacity-50 hover:opacity-100 transition-opacity ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-neutral-700 italic">No markets added yet.</p>
            )}

            {/* Add market */}
            <div className="flex gap-2 pt-1">
              <input
                value={marketInput}
                onChange={(e) => setMarketInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addMarket()}
                placeholder="Travis County, TX"
                className="flex-1 rounded-lg px-3 py-2 text-[13px] text-neutral-200 placeholder:text-neutral-700 outline-none"
                style={{
                  background: CAVE.surface2,
                  border:     `1px solid ${CAVE.stoneEdge}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = GLOW.green.border)}
                onBlur={(e)  => (e.currentTarget.style.borderColor = CAVE.stoneEdge)}
              />
              <button
                onClick={addMarket}
                disabled={!marketInput.trim() || savingMarket}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-30"
                style={{
                  background: "rgba(0,255,136,0.1)",
                  border:     `1px solid ${GLOW.green.border}`,
                  color:      GEM.green,
                }}
              >
                {savingMarket ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Notifications ── */}
        <Section title="Notifications">
          <Row label="Email Alerts">
            <Toggle value={emailNotifs} onChange={(v) => toggleNotif("email", v)} />
          </Row>
          <Row label="Push Notifications">
            <Toggle value={pushNotifs} onChange={(v) => toggleNotif("push", v)} />
          </Row>
        </Section>

        {/* ── Plan & Billing ── */}
        <Section title="Plan & Billing">
          <Row label="Current Plan">
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-semibold" style={{ color: planInfo.color }}>
                {planInfo.label}
              </span>
              {profile?.plan === "free" && (
                <Link
                  href="/dashboard/upgrade"
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    background: `rgba(0,255,136,0.1)`,
                    border:     `1px solid ${GLOW.green.border}`,
                    color:      GEM.green,
                  }}
                >
                  Upgrade <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </Row>
          {profile?.plan !== "free" && (
            <Row label="Billing">
              <ManageBillingButton />
            </Row>
          )}
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <Row label="Security">
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Change password
            </Link>
          </Row>
          <Row label="Session">
            <button
              onClick={handleSignOut}
              disabled={signOutLoading}
              className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {signOutLoading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <LogOut className="w-3.5 h-3.5" />
              }
              Sign out
            </button>
          </Row>
        </Section>

      </div>
    </div>
  );
}

// ── Manage Billing Button ──────────────────────────────────────────────────────

function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={openPortal}
      disabled={loading}
      className="flex items-center gap-1.5 text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors disabled:opacity-50"
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <ChevronRight className="w-3.5 h-3.5" />
      }
      {loading ? "Opening…" : "Manage subscription"}
    </button>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0"
      style={{
        background: value ? GEM.green : CAVE.surface2,
        border:     `1px solid ${value ? GEM.green : CAVE.stoneMid}`,
        boxShadow:  value ? GLOW.green.soft : "none",
      }}
    >
      <span
        className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
        style={{
          background: value ? "#000" : "#555",
          left:       value ? "calc(100% - 16px)" : "2px",
        }}
      />
    </button>
  );
}
