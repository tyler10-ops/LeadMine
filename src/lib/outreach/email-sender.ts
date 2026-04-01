/**
 * Outreach Email Sender
 *
 * Dispatches outreach_drafts that are in "queued_to_send" status via Resend.
 * Called by the /api/cron/send-outreach cron job every 15 minutes.
 *
 * Rate limiting: 2 emails per lead per day max (avoids spam flags).
 */

import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

const resend  = new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL ?? "outreach@leadmineapp.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.leadmineapp.com";

// Max emails to dispatch per cron run (avoid Resend rate limits)
const BATCH_SIZE = 20;

export interface SendResult {
  draftId:  string
  leadId:   string
  success:  boolean
  resendId?: string
  error?:   string
}

// ── HTML builder for outreach emails ─────────────────────────────────────────

function buildOutreachHtml(body: string, realtorName: string, realtorEmail: string): string {
  // Convert plain-text markdown-lite to basic HTML paragraphs
  const htmlBody = body
    .split("\n\n")
    .filter(Boolean)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;color:#d4d4d4;line-height:1.7;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Message from ${realtorName}</title>
</head>
<body style="margin:0;padding:0;background:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="padding-bottom:28px;">
          <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#404040;font-weight:700;">LEADMINE</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:28px;background:#0a0a0a;border:1px solid #1a1a1a;border-radius:12px;">
          ${htmlBody}
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:24px;"></td></tr>

        <!-- CTA -->
        <tr><td style="text-align:center;">
          <a href="${APP_URL}/dashboard/hub"
             style="display:inline-block;padding:12px 28px;background:#00FF88;color:#000;font-weight:700;font-size:14px;border-radius:8px;text-decoration:none;">
            View in LeadMine →
          </a>
        </td></tr>

        <!-- Spacer -->
        <tr><td style="height:28px;"></td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #1a1a1a;padding-top:20px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#404040;">
            Sent by ${realtorName} via LeadMine ·
            <a href="mailto:${realtorEmail}" style="color:#525252;">Reply directly</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Main dispatch function ────────────────────────────────────────────────────

/**
 * Processes up to BATCH_SIZE queued outreach drafts and sends them via Resend.
 * Updates draft status to "sent" on success or "failed" on error.
 * Skips leads that already received an email in the last 24 hours.
 */
export async function processOutreachQueue(
  supabase: SupabaseClient
): Promise<{ processed: number; sent: number; failed: number; results: SendResult[] }> {

  // Fetch queued email drafts with lead + realtor info
  const { data: drafts, error: fetchError } = await supabase
    .from("outreach_drafts")
    .select(`
      id,
      lead_id,
      realtor_id,
      subject,
      body,
      channel,
      leads!inner ( id, email, owner_name, company_name, stage ),
      realtors ( id, name, email )
    `)
    .eq("channel", "email")
    .eq("status", "queued_to_send")
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (fetchError || !drafts || drafts.length === 0) {
    return { processed: 0, sent: 0, failed: 0, results: [] }
  }

  // Deduplicate: only one email per lead per run
  const seenLeads = new Set<string>()
  const toSend = drafts.filter(d => {
    if (seenLeads.has(d.lead_id)) return false
    seenLeads.add(d.lead_id)
    return true
  })

  const results: SendResult[] = []

  for (const draft of toSend) {
    const lead    = draft.leads    as unknown as { id: string; email: string; owner_name: string | null; company_name: string | null; stage: string }
    const realtor = draft.realtors as unknown as { id: string; name: string; email: string | null } | null

    // Skip if lead has no email or is already booked/dead
    if (!lead?.email || ["booked", "dead"].includes(lead.stage ?? "")) {
      await supabase
        .from("outreach_drafts")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", draft.id)

      results.push({ draftId: draft.id, leadId: draft.lead_id, success: false, error: "Lead has no email or is in terminal stage" })
      continue
    }

    // Check: did this lead already get an email in the last 24 hours?
    const { count: recentCount } = await supabase
      .from("outreach_drafts")
      .select("id", { count: "exact", head: true })
      .eq("lead_id", draft.lead_id)
      .eq("channel", "email")
      .eq("status", "sent")
      .gte("updated_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString())

    if ((recentCount ?? 0) > 0) {
      results.push({ draftId: draft.id, leadId: draft.lead_id, success: false, error: "Rate limited — email sent to this lead in last 24h" })
      continue
    }

    const realtorName  = realtor?.name          ?? "Your Agent"
    const realtorEmail = realtor?.email        ?? FROM
    const leadName     = lead.owner_name ?? lead.company_name ?? "there"
    const subject      = draft.subject ?? `A quick note from ${realtorName}`

    try {
      const { data: sent, error: sendError } = await resend.emails.send({
        from:    `${realtorName} <${FROM}>`,
        to:      lead.email,
        subject,
        html:    buildOutreachHtml(draft.body ?? "", realtorName, realtorEmail),
        replyTo: realtorEmail !== FROM ? realtorEmail : undefined,
        tags: [
          { name: "lead_id",   value: draft.lead_id   },
          { name: "draft_id",  value: draft.id        },
          { name: "realtor_id", value: draft.realtor_id },
        ],
      })

      if (sendError) throw new Error(sendError.message)

      // Mark draft as sent
      await supabase
        .from("outreach_drafts")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", draft.id)

      // Update lead's last contact timestamp
      await supabase
        .from("leads")
        .update({ last_contact_at: new Date().toISOString() })
        .eq("id", draft.lead_id)

      // Log to activity feed
      await supabase.from("activity_log").insert({
        user_id:     null, // service role — no user context in cron
        event_type:  "outreach_sent",
        title:       `Email sent to ${leadName}`,
        description: subject,
        icon:        "mail",
        severity:    "success",
        metadata:    { draftId: draft.id, leadId: draft.lead_id, resendId: sent?.id },
      }).maybeSingle()

      results.push({ draftId: draft.id, leadId: draft.lead_id, success: true, resendId: sent?.id })

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`[outreach] Failed to send draft ${draft.id}:`, errMsg)

      // Mark as failed so it doesn't retry forever
      await supabase
        .from("outreach_drafts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", draft.id)

      results.push({ draftId: draft.id, leadId: draft.lead_id, success: false, error: errMsg })
    }
  }

  const sent   = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return { processed: toSend.length, sent, failed, results }
}
