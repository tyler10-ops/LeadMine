"use client";

import { useEffect, useState, useCallback } from "react";
import { GEM, GLOW, CAVE } from "@/lib/cave-theme";
import { Bell, Mail, Smartphone, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

interface NotifPrefs {
  email_enabled: boolean;
  push_enabled:  boolean;
  send_time:     string;
  timezone:      string;
  last_sent_at:  string | null;
}

const TIMEZONES = [
  { value: "America/New_York",    label: "Eastern (ET)"  },
  { value: "America/Chicago",     label: "Central (CT)"  },
  { value: "America/Denver",      label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)"  },
  { value: "America/Phoenix",     label: "Arizona (MT, no DST)" },
  { value: "America/Anchorage",   label: "Alaska (AKT)"  },
  { value: "Pacific/Honolulu",    label: "Hawaii (HT)"   },
];

const SEND_TIMES = [
  "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00",
];

function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

// ── Web push helpers ──────────────────────────────────────────────────────────

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buf = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return buf;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationSettings() {
  const [prefs,        setPrefs]        = useState<NotifPrefs | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [pushStatus,   setPushStatus]   = useState<"idle" | "requesting" | "granted" | "denied" | "unsupported">("idle");
  const [saved,        setSaved]        = useState(false);
  const [pushSubbed,   setPushSubbed]   = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) setPrefs(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  // Check if already subscribed to push
  useEffect(() => {
    if (!("serviceWorker" in navigator)) { setPushStatus("unsupported"); return; }
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setPushSubbed(true);
      });
    }).catch(() => {});
  }, []);

  const savePrefs = async (updates: Partial<NotifPrefs>) => {
    if (!prefs) return;
    setSaving(true);
    const merged = { ...prefs, ...updates };
    setPrefs(merged);
    try {
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  const enablePushNotifications = async () => {
    setPushStatus("requesting");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setPushStatus("denied");
      return;
    }

    const reg = await registerServiceWorker();
    if (!reg) { setPushStatus("unsupported"); return; }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) { setPushStatus("unsupported"); return; }

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
        }),
      });

      setPushStatus("granted");
      setPushSubbed(true);
      setPrefs((p) => p ? { ...p, push_enabled: true } : p);
    } catch {
      setPushStatus("denied");
    }
  };

  const disablePushNotifications = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unsubscribe", subscription: sub.toJSON() }),
      });
      await sub.unsubscribe();
    }
    setPushSubbed(false);
    await savePrefs({ push_enabled: false });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-600" />
        <span className="text-sm text-neutral-600">Loading notification settings...</span>
      </div>
    );
  }

  if (!prefs) return null;

  return (
    <div
      className="rounded-xl"
      style={{ background: CAVE.surface1, border: `1px solid ${CAVE.stoneEdge}` }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: CAVE.stoneEdge }}
      >
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-300">Daily Brief Notifications</h3>
        </div>
        {saved && (
          <div className="flex items-center gap-1.5 text-xs" style={{ color: GEM.green }}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </div>
        )}
        {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-600" />}
      </div>

      <div className="px-5 py-4 space-y-5">

        {/* Email toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Mail className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-200">Email Briefing</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Daily War Room summary delivered to your inbox
              </p>
            </div>
          </div>
          <button
            onClick={() => savePrefs({ email_enabled: !prefs.email_enabled })}
            className="relative flex-shrink-0 w-10 h-5 rounded-full transition-colors"
            style={{
              background: prefs.email_enabled ? GEM.green : CAVE.stoneDeep,
              boxShadow: prefs.email_enabled ? GLOW.green.soft : undefined,
            }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm"
              style={{ transform: `translateX(${prefs.email_enabled ? "22px" : "2px"})` }}
            />
          </button>
        </div>

        {/* Push toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Smartphone className="w-4 h-4 text-neutral-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-neutral-200">Push Notifications</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Real alerts on your phone — works on Android &amp; iOS (home screen)
              </p>
            </div>
          </div>

          {pushStatus === "unsupported" ? (
            <span className="text-[11px] text-neutral-600">Not supported</span>
          ) : pushSubbed ? (
            <button
              onClick={disablePushNotifications}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: `${GEM.green}14`,
                border: `1px solid ${GLOW.green.border}`,
                color: GEM.green,
              }}
            >
              {pushStatus === "requesting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enabled ✓"}
            </button>
          ) : (
            <button
              onClick={enablePushNotifications}
              disabled={pushStatus === "requesting"}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${CAVE.stoneEdge}`,
                color: "#a3a3a3",
              }}
            >
              {pushStatus === "requesting" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enable"}
            </button>
          )}
        </div>

        {pushStatus === "denied" && (
          <div
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            style={{ background: GLOW.red.bg, border: `1px solid ${GLOW.red.border}`, color: "#f87171" }}
          >
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Notifications blocked. Enable them in your browser's site settings, then try again.
          </div>
        )}

        {/* Time + timezone (shown when either is enabled) */}
        {(prefs.email_enabled || pushSubbed) && (
          <div
            className="grid grid-cols-2 gap-3 pt-3 border-t"
            style={{ borderColor: CAVE.stoneMid }}
          >
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1.5">
                Send Time
              </label>
              <select
                value={prefs.send_time}
                onChange={(e) => savePrefs({ send_time: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs text-neutral-200 border focus:outline-none appearance-none cursor-pointer transition-colors"
                style={{ background: CAVE.surface2, borderColor: CAVE.stoneEdge }}
              >
                {SEND_TIMES.map((t) => (
                  <option key={t} value={t}>{formatTime(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-neutral-600 font-medium mb-1.5">
                Timezone
              </label>
              <select
                value={prefs.timezone}
                onChange={(e) => savePrefs({ timezone: e.target.value })}
                className="w-full rounded-lg px-3 py-2 text-xs text-neutral-200 border focus:outline-none appearance-none cursor-pointer transition-colors"
                style={{ background: CAVE.surface2, borderColor: CAVE.stoneEdge }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Last sent */}
        {prefs.last_sent_at && (
          <p className="text-[11px] text-neutral-600">
            Last brief sent {new Date(prefs.last_sent_at).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
            })}
          </p>
        )}
      </div>
    </div>
  );
}
