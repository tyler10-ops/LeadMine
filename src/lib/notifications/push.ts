import webpush from "web-push";

// VAPID keys must be set in env — generate once with:
//   node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"
let vapidInitialized = false;
function ensureVapid() {
  if (vapidInitialized) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return; // skip silently if not configured
  webpush.setVapidDetails(
    `mailto:${process.env.NOTIFICATION_FROM_EMAIL ?? "briefs@leadmine.app"}`,
    pub,
    priv
  );
  vapidInitialized = true;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendPush(
  subscription: PushSubscriptionRecord,
  payload: string,
  ttl = 86400
): Promise<{ success: boolean; gone?: boolean; error?: string }> {
  ensureVapid();
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
      { TTL: ttl }
    );
    return { success: true };
  } catch (err) {
    if (err instanceof Error && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
      return { success: false, gone: true };
    }
    return { success: false, error: err instanceof Error ? err.message : "Push failed" };
  }
}

export async function sendDailyBriefPush(
  subscription: PushSubscriptionRecord,
  brief: { tierCounts: { diamond: number; hot: number; total: number }; priorityLeads: unknown[] }
): Promise<{ success: boolean; gone?: boolean; error?: string }> {
  const highValue = brief.tierCounts.diamond + brief.tierCounts.hot;
  const priorityCount = brief.priorityLeads.length;

  const payload = JSON.stringify({
    title: "LeadMine War Room",
    body: priorityCount > 0
      ? `${priorityCount} priority call${priorityCount !== 1 ? "s" : ""} today · ${highValue} high-value leads`
      : brief.tierCounts.total === 0
        ? "Your pipeline is empty — time to run a mining job."
        : `${highValue} high-value leads in your pipeline. Check your War Room.`,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    url: "/dashboard/hub",
    data: { url: "/dashboard/hub" },
  });

  return sendPush(subscription, payload);
}

// ── Mining completion notification ────────────────────────────────────────────

export async function sendMiningCompletionPush(
  subscription: PushSubscriptionRecord,
  result: { eliteCount: number; totalSaved: number; location: string }
): Promise<{ success: boolean; gone?: boolean; error?: string }> {
  const { eliteCount, totalSaved, location } = result;

  const body = eliteCount > 0
    ? `${eliteCount} elite gem${eliteCount !== 1 ? "s" : ""} found in ${location} — ${totalSaved} leads saved total.`
    : totalSaved > 0
      ? `${totalSaved} leads mined from ${location}. Review your pipeline.`
      : `Mining complete for ${location}. No new leads this run.`;

  const payload = JSON.stringify({
    title: "Mining Complete",
    body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    url: "/dashboard/hub",
    data: { url: "/dashboard/hub", eliteCount, totalSaved },
  });

  return sendPush(subscription, payload, 3600);
}
