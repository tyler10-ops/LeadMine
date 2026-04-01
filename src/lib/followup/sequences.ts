/**
 * Follow-Up Sequence Engine
 *
 * Enqueues an automated multi-step outreach sequence for a scored lead.
 * Sequence: Email (day 0) → Call (day 1) → SMS (day 3) → Re-score (day 7)
 *
 * Uses BullMQ delayed jobs so each step fires at the right time
 * without a long-running process or cron polling.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getFollowUpQueue } from "@/lib/queue/queues";

// ── Sequence definition ───────────────────────────────────────────────────────

export const SEQUENCE_STEPS = [
  { step: 1, channel: "email"   as const, delayMs: 0,                      label: "Initial Email"    },
  { step: 2, channel: "call"    as const, delayMs: 1  * 24 * 60 * 60_000,  label: "Day 1 Call"       },
  { step: 3, channel: "sms"     as const, delayMs: 3  * 24 * 60 * 60_000,  label: "Day 3 SMS"        },
  { step: 4, channel: "rescore" as const, delayMs: 7  * 24 * 60 * 60_000,  label: "Day 7 Re-score"   },
] as const;

// Steps that produce a follow_up_activities row (rescore is internal-only)
const TRACKABLE_CHANNELS = ["email", "call", "sms"] as const;

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Enqueues a follow-up sequence for a lead that just scored diamond or hot.
 * Safe to call multiple times — deduplicates by checking for existing pending sequence.
 *
 * @param leadId     - UUID of the lead
 * @param realtorId  - UUID of the realtor who owns the lead
 * @param tier       - "diamond" | "hot" (determines sequence label & priority)
 * @param supabase   - An authenticated or service-role Supabase client
 */
export async function enqueueFollowUpSequence(
  leadId: string,
  realtorId: string,
  tier: "diamond" | "hot",
  supabase: SupabaseClient
): Promise<{ enqueued: boolean; sequenceId?: string; reason?: string }> {

  // ── Dedup: skip if an active auto-sequence already exists ────────────────
  const { data: existing } = await supabase
    .from("follow_up_activities")
    .select("id")
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .like("sequence_name", "auto-%")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { enqueued: false, reason: "Active sequence already running for this lead" };
  }

  // ── Create follow_up_activities rows for trackable steps ─────────────────
  const sequenceId = crypto.randomUUID();
  const sequenceName = `auto-${tier}`;
  const now = Date.now();

  const activityRows = SEQUENCE_STEPS
    .filter(s => (TRACKABLE_CHANNELS as readonly string[]).includes(s.channel))
    .map(s => ({
      realtor_id:    realtorId,
      lead_id:       leadId,
      channel:       s.channel as "email" | "call" | "sms",
      status:        "pending",
      scheduled_at:  new Date(now + s.delayMs).toISOString(),
      sequence_step: s.step,
      sequence_name: sequenceName,
      content:       s.label,
      sequence_id:   sequenceId,
    }));

  const { data: inserted, error: insertError } = await supabase
    .from("follow_up_activities")
    .insert(activityRows)
    .select("id, sequence_step");

  if (insertError) {
    console.error("[followup] Failed to insert activities:", insertError.message);
    return { enqueued: false, reason: insertError.message };
  }

  // Build a map of step → activity ID for passing into job data
  const stepToActivityId = Object.fromEntries(
    (inserted ?? []).map(row => [row.sequence_step, row.id])
  );

  // ── Enqueue BullMQ jobs with delays ───────────────────────────────────────
  const queue = getFollowUpQueue();

  await Promise.all(
    SEQUENCE_STEPS.map(s =>
      queue.add(
        `seq-${sequenceId}-step-${s.step}`,
        {
          sequenceId,
          leadId,
          realtorId,
          step:              s.step,
          channel:           s.channel,
          tier,
          followUpActivityId: stepToActivityId[s.step] ?? undefined,
        },
        { delay: s.delayMs }
      )
    )
  );

  console.log(`[followup] Sequence ${sequenceId} enqueued for lead ${leadId} (${tier})`);
  return { enqueued: true, sequenceId };
}

/**
 * Cancel all pending follow-up activities for a lead (e.g. lead went dead or booked).
 * Does NOT cancel already-enqueued BullMQ jobs (they'll be no-ops when they fire
 * because the activity rows will be in a terminal state).
 */
export async function cancelFollowUpSequence(
  leadId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("follow_up_activities")
    .update({ status: "failed", completed_at: new Date().toISOString() })
    .eq("lead_id", leadId)
    .eq("status", "pending")
    .like("sequence_name", "auto-%");
}
