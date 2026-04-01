import { Resend } from "resend";
import type { BriefData } from "@/app/api/brief/route";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.NOTIFICATION_FROM_EMAIL ?? "briefs@leadmine.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.leadmine.app";

// ── Tier emoji / label map ────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  diamond: "#00FFD4",
  hot:     "#00FF88",
  warm:    "#FFD60A",
  cold:    "#FF3B30",
};

const TIER_LABELS: Record<string, string> = {
  diamond: "💎 Diamond",
  hot:     "🔥 Hot",
  warm:    "⚡ Warm",
  cold:    "❄️ Cold",
};

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildEmailHtml(brief: BriefData, date: string): string {
  const { realtorName, aiSummary, tierCounts, priorityLeads, followUpLeads, dealGoal, daysSinceLastMine } = brief;

  const priorityRows = priorityLeads.slice(0, 5).map((lead) => {
    const name     = lead.owner_name || lead.business_name || "Unknown";
    const location = [lead.property_city, lead.property_state].filter(Boolean).join(", ") || "—";
    const tier     = lead.heat_tier ?? "cold";
    const score    = lead.heat_score ?? 0;
    const color    = TIER_COLORS[tier] ?? "#a3a3a3";
    const tierLabel = TIER_LABELS[tier] ?? tier;

    return `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:20px;font-weight:900;color:${color};font-family:monospace;">${score}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #1a1a1a;">
          <div style="font-size:13px;font-weight:600;color:#e5e5e5;">${name}</div>
          <div style="font-size:11px;color:#737373;margin-top:2px;">${location}</div>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:11px;color:${color};font-weight:600;">${tierLabel}</span>
        </td>
        <td style="padding:10px 16px;border-bottom:1px solid #1a1a1a;text-align:right;">
          <a href="${APP_URL}/dashboard/leads" style="font-size:11px;color:#00FF88;text-decoration:none;font-weight:600;">Draft →</a>
        </td>
      </tr>`;
  }).join("");

  const followUpSection = followUpLeads.length > 0 ? `
    <div style="margin-top:32px;">
      <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;margin:0 0 12px 0;">Follow-Up Queue (${followUpLeads.length})</p>
      ${followUpLeads.slice(0, 3).map((lead) => {
        const name = lead.owner_name || lead.business_name || "Unknown";
        const contactedAt = lead.last_contact_at
          ? Math.floor((Date.now() - new Date(lead.last_contact_at).getTime()) / (1000 * 60 * 60))
          : null;
        return `<div style="padding:10px 0;border-bottom:1px solid #1a1a1a;font-size:13px;color:#a3a3a3;">
          ${name}${contactedAt ? ` <span style="color:#525252;font-size:11px;">· contacted ${contactedAt}h ago</span>` : ""}
        </div>`;
      }).join("")}
    </div>` : "";

  const mineAlert = (daysSinceLastMine === null || daysSinceLastMine > 7) ? `
    <div style="margin-top:24px;padding:14px 16px;background:#111;border:1px solid #222;border-radius:10px;">
      <p style="margin:0;font-size:13px;color:#737373;">
        ⛏️ ${daysSinceLastMine === null ? "No mining runs yet." : `Last mined ${daysSinceLastMine} days ago.`}
        <a href="${APP_URL}/dashboard/mining" style="color:#00FF88;text-decoration:none;margin-left:6px;">Mine now →</a>
      </p>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your LeadMine War Room Brief</title></head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#525252;font-weight:700;">LEAD MINE</p>
          <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;color:#e5e5e5;">War Room Brief</h1>
          <p style="margin:4px 0 0;font-size:13px;color:#525252;">${date}</p>
        </td></tr>

        <!-- AI Summary -->
        <tr><td style="padding:20px;background:#0a0a0a;border:1px solid #1a1a1a;border-left:3px solid #00FF88;border-radius:10px;margin-bottom:24px;">
          <p style="margin:0;font-size:14px;color:#d4d4d4;line-height:1.6;">${aiSummary}</p>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:24px;"></td></tr>

        <!-- Pipeline stats -->
        <tr><td>
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;margin:0 0 12px 0;">Pipeline · Goal: ${dealGoal} deals/mo</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${[
                { label: "💎 Diamond", count: tierCounts.diamond, color: TIER_COLORS.diamond },
                { label: "🔥 Hot",     count: tierCounts.hot,     color: TIER_COLORS.hot },
                { label: "⚡ Warm",    count: tierCounts.warm,    color: TIER_COLORS.warm },
                { label: "❄️ Cold",    count: tierCounts.cold,    color: TIER_COLORS.cold },
              ].map(({ label, count, color }) => `
                <td style="width:25%;text-align:center;padding:14px 8px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;">
                  <div style="font-size:24px;font-weight:900;color:${color};">${count}</div>
                  <div style="font-size:10px;color:#525252;margin-top:4px;">${label}</div>
                </td>`).join('<td style="width:8px;"></td>')}
            </tr>
          </table>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:28px;"></td></tr>

        <!-- Priority calls -->
        ${priorityLeads.length > 0 ? `
        <tr><td>
          <p style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;margin:0 0 12px 0;">📞 Priority Calls Today (${priorityLeads.length})</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;overflow:hidden;">
            <tr style="background:#111;">
              <th style="padding:8px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;">Score</th>
              <th style="padding:8px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;">Lead</th>
              <th style="padding:8px 16px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;">Tier</th>
              <th style="padding:8px 16px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:#525252;font-weight:600;">Action</th>
            </tr>
            ${priorityRows}
          </table>
        </td></tr>` : `
        <tr><td style="padding:20px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#525252;">All caught up — no priority contacts pending today.</p>
        </td></tr>`}

        <!-- Follow-up + mine alert -->
        <tr><td>${followUpSection}${mineAlert}</td></tr>

        <!-- Spacer -->
        <tr><td style="height:32px;"></td></tr>

        <!-- CTA -->
        <tr><td style="text-align:center;">
          <a href="${APP_URL}/dashboard/hub"
             style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#00FF88,#00CC66);color:#000;font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;">
            Open War Room →
          </a>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:32px;"></td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#404040;">
            LeadMine · You're receiving this because daily briefs are enabled.
            <a href="${APP_URL}/dashboard/hub" style="color:#525252;text-decoration:underline;">Manage preferences</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ── Send function ─────────────────────────────────────────────────────────────

export async function sendDailyBriefEmail(
  toEmail: string,
  brief: BriefData
): Promise<{ success: boolean; error?: string }> {
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const highValue = brief.tierCounts.diamond + brief.tierCounts.hot;
  const subjectLine = brief.tierCounts.total === 0
    ? `LeadMine: Your pipeline is empty — time to mine`
    : `LeadMine: ${brief.priorityLeads.length} priority call${brief.priorityLeads.length !== 1 ? "s" : ""} today · ${highValue} high-value leads`;

  try {
    const { error } = await resend.emails.send({
      from:    FROM,
      to:      toEmail,
      subject: subjectLine,
      html:    buildEmailHtml(brief, date),
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
