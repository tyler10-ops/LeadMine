import { Resend } from "resend";
import type { BriefData } from "@/app/api/brief/route";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.NOTIFICATION_FROM_EMAIL ?? "briefs@leadmine.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.leadmineapp.com";

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
  const { realtorName, aiSummary, tierCounts, priorityLeads, followUpLeads, dealGoal, daysSinceLastMine, newLeadsCount, topNewGems } = brief;

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
        <tr><td style="padding-bottom:28px;border-bottom:1px solid #1a1a1a;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td>
              <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;color:#00FF88;font-weight:700;">⛏ LEADMINE</p>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#f5f5f5;letter-spacing:-0.5px;">Morning Brief</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#404040;">Good morning, ${realtorName} · ${date}</p>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>

        ${(newLeadsCount ?? 0) > 0 ? `
        <!-- New Leads Overnight -->
        <tr><td style="padding:20px;background:#020f07;border:1px solid #00FF8822;border-left:3px solid #00FF88;border-radius:12px;">
          <p style="margin:0 0 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#00FF88;font-weight:700;">⛏ Mined Overnight · ${newLeadsCount} New Lead${(newLeadsCount??0) !== 1 ? "s" : ""}</p>
          ${(topNewGems ?? []).map((gem) => {
            const addr  = gem.property_address || gem.owner_name || "Unknown";
            const city  = [gem.property_city, gem.property_state].filter(Boolean).join(", ") || "—";
            const val   = gem.estimated_value   ? `$${Math.round(gem.estimated_value / 1000)}k`   : null;
            const equity = gem.estimated_equity ? `$${Math.round(gem.estimated_equity / 1000)}k equity` : null;
            const grade = gem.gem_grade === "elite" ? "◆ Elite Gem" : "◈ Refined";
            const gradeColor = gem.gem_grade === "elite" ? "#00FF88" : "#FFD60A";
            return `<div style="padding:10px 0;border-bottom:1px solid #0a1a0d;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;font-weight:600;color:#e5e5e5;">${addr}</span>
                <span style="font-size:11px;font-weight:700;color:${gradeColor};">${grade}</span>
              </div>
              <div style="margin-top:3px;font-size:11px;color:#525252;">${city}${val ? ` · ${val}` : ""}${equity ? ` · ${equity}` : ""}</div>
            </div>`;
          }).join("")}
          <div style="margin-top:14px;">
            <a href="${APP_URL}/dashboard/hub" style="font-size:12px;color:#00FF88;text-decoration:none;font-weight:600;">View all new leads →</a>
          </div>
        </td></tr>
        <tr><td style="height:20px;"></td></tr>` : ""}

        <!-- AI Summary -->
        <tr><td style="padding:18px 20px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;">
          <p style="margin:0;font-size:13px;color:#c4c4c4;line-height:1.7;">${aiSummary}</p>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>

        <!-- Pipeline stats -->
        <tr><td>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#404040;font-weight:600;margin:0 0 10px 0;">Pipeline · Goal: ${dealGoal} deals/mo</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            ${[
              { label: "Diamond", count: tierCounts.diamond, color: TIER_COLORS.diamond, icon: "◆" },
              { label: "Hot",     count: tierCounts.hot,     color: TIER_COLORS.hot,     icon: "▲" },
              { label: "Warm",    count: tierCounts.warm,    color: TIER_COLORS.warm,    icon: "◈" },
              { label: "Cold",    count: tierCounts.cold,    color: TIER_COLORS.cold,    icon: "◇" },
            ].map(({ label, count, color, icon }) => `
              <td style="width:25%;text-align:center;padding:14px 6px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;">
                <div style="font-size:10px;color:${color};margin-bottom:6px;">${icon}</div>
                <div style="font-size:22px;font-weight:900;color:${color};line-height:1;">${count}</div>
                <div style="font-size:10px;color:#404040;margin-top:5px;">${label}</div>
              </td>`).join('<td style="width:6px;"></td>')}
          </tr></table>
        </td></tr>
        <tr><td style="height:24px;"></td></tr>

        <!-- Priority calls -->
        ${priorityLeads.length > 0 ? `
        <tr><td>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#404040;font-weight:600;margin:0 0 10px 0;">Priority Calls Today · ${priorityLeads.length}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;overflow:hidden;">
            ${priorityRows}
          </table>
        </td></tr>` : `
        <tr><td style="padding:16px 20px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#404040;">All caught up — no priority contacts pending.</p>
        </td></tr>`}

        <!-- Follow-up + mine alert -->
        <tr><td>${followUpSection}${mineAlert}</td></tr>
        <tr><td style="height:28px;"></td></tr>

        <!-- CTA -->
        <tr><td style="text-align:center;">
          <a href="${APP_URL}/dashboard/hub"
             style="display:inline-block;padding:14px 36px;background:#00FF88;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">
            Open War Room →
          </a>
        </td></tr>
        <tr><td style="height:32px;"></td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #111;padding-top:20px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#00FF88;letter-spacing:0.15em;">⛏ LEADMINE</p>
          <p style="margin:0;font-size:11px;color:#333;">
            You're receiving this because daily briefs are enabled ·
            <a href="${APP_URL}/dashboard/hub" style="color:#444;text-decoration:underline;">Manage</a>
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
  const newNote = (brief.newLeadsCount ?? 0) > 0 ? `⛏ ${brief.newLeadsCount} new leads · ` : "";
  const subjectLine = brief.tierCounts.total === 0
    ? `LeadMine: Your pipeline is empty — time to mine`
    : `${newNote}LeadMine: ${brief.priorityLeads.length} priority call${brief.priorityLeads.length !== 1 ? "s" : ""} today · ${highValue} high-value`;

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
