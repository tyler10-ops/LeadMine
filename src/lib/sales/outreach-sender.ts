/**
 * Outreach Sender — processes the email sequence queue.
 * Reads prospects whose next_email_at <= NOW(), sends the next step,
 * and schedules the following one.
 */

import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Tyler at LeadMine <tyler@leadmine.ai>";
const REPLY_TO = "tyler@leadmine.ai";

interface Prospect {
  id:             string;
  name:           string | null;
  business_name:  string;
  email:          string | null;
  city:           string | null;
  state:          string | null;
  sequence_id:    string | null;
  sequence_step:  number;
  unsubscribed:   boolean;
}

interface SequenceStep {
  step_number: number;
  delay_days:  number;
  subject:     string;
  body_html:   string;
  body_text:   string;
  sequence_id: string;
}

function interpolate(template: string, prospect: Prospect): string {
  return template
    .replace(/\{\{name\}\}/g,          prospect.name ?? prospect.business_name.split(" ")[0])
    .replace(/\{\{business_name\}\}/g, prospect.business_name)
    .replace(/\{\{city\}\}/g,          prospect.city ?? "your area")
    .replace(/\{\{state\}\}/g,         prospect.state ?? "");
}

export async function processOutreachQueue(limit = 50): Promise<{
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const supabase = createServiceClient();
  let sent = 0, skipped = 0;
  const errors: string[] = [];

  // Fetch prospects due for an email
  const { data: prospects, error: fetchErr } = await supabase
    .from("prospects")
    .select("id, name, business_name, email, city, state, sequence_id, sequence_step, unsubscribed")
    .lte("next_email_at", new Date().toISOString())
    .eq("unsubscribed", false)
    .not("email", "is", null)
    .not("sequence_id", "is", null)
    .order("next_email_at", { ascending: true })
    .limit(limit);

  if (fetchErr) {
    errors.push(`Failed to fetch prospects: ${fetchErr.message}`);
    return { sent, skipped, errors };
  }

  for (const prospect of (prospects ?? []) as Prospect[]) {
    const nextStep = prospect.sequence_step + 1;

    // Fetch the next step in their sequence
    const { data: step } = await supabase
      .from("sequence_steps")
      .select("step_number, delay_days, subject, body_html, body_text, sequence_id")
      .eq("sequence_id", prospect.sequence_id!)
      .eq("step_number", nextStep)
      .eq("active", true)
      .single();

    if (!step) {
      // Sequence complete — remove from queue
      await supabase.from("prospects").update({
        next_email_at: null,
        sequence_step: nextStep,
      }).eq("id", prospect.id);
      skipped++;
      continue;
    }

    const s = step as SequenceStep;
    const subject  = interpolate(s.subject,   prospect);
    const htmlBody = interpolate(s.body_html,  prospect);
    const textBody = interpolate(s.body_text,  prospect);

    // Add unsubscribe footer
    const unsubUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/sales/unsubscribe?id=${prospect.id}`;
    const htmlWithFooter = `${htmlBody}
<br><br>
<p style="color:#999;font-size:12px;">
  You're receiving this because you're a real estate professional in ${prospect.city ?? "your area"}.
  <a href="${unsubUrl}" style="color:#999;">Unsubscribe</a>
</p>`;

    try {
      const { data: mail, error: sendErr } = await resend.emails.send({
        from:     FROM,
        to:       [prospect.email!],
        replyTo:  REPLY_TO,
        subject,
        html:     htmlWithFooter,
        text:     `${textBody}\n\nUnsubscribe: ${unsubUrl}`,
      });

      if (sendErr) throw new Error(sendErr.message);

      // Log the send
      await supabase.from("outreach_log").insert({
        prospect_id: prospect.id,
        sequence_id: prospect.sequence_id,
        step_number: nextStep,
        email_to:    prospect.email!,
        subject,
        resend_id:   mail?.id ?? null,
        status:      "sent",
      });

      // Schedule next email
      const nextEmailDate = new Date();
      nextEmailDate.setDate(nextEmailDate.getDate() + (s.delay_days || 3));

      await supabase.from("prospects").update({
        sequence_step:   nextStep,
        last_emailed_at: new Date().toISOString(),
        next_email_at:   nextEmailDate.toISOString(),
        stage:           "emailed",
        stage_changed_at: new Date().toISOString(),
        email_opens:     prospect.sequence_step === 0 ? 0 : undefined, // reset on first send
      }).eq("id", prospect.id);

      sent++;
    } catch (e) {
      errors.push(`Failed to send to ${prospect.email}: ${e instanceof Error ? e.message : String(e)}`);

      await supabase.from("outreach_log").insert({
        prospect_id: prospect.id,
        sequence_id: prospect.sequence_id,
        step_number: nextStep,
        email_to:    prospect.email!,
        subject,
        status:      "failed",
      });
    }
  }

  return { sent, skipped, errors };
}

/**
 * Enroll a prospect in the default outreach sequence immediately.
 */
export async function enrollProspect(prospectId: string, sequenceId?: string): Promise<void> {
  const supabase = createServiceClient();

  // Get default sequence if not specified
  let seqId = sequenceId;
  if (!seqId) {
    const { data: seq } = await supabase
      .from("email_sequences")
      .select("id")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();
    seqId = seq?.id;
  }

  if (!seqId) return;

  await supabase.from("prospects").update({
    sequence_id:   seqId,
    sequence_step: 0,
    next_email_at: new Date().toISOString(), // send first email now
  }).eq("id", prospectId);
}
