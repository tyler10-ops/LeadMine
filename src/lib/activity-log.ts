/**
 * Activity Log utility
 * Server-side only — uses service role to write audit events.
 * Client components should POST to /api/activity instead.
 */

import { createServerSupabase } from "@/lib/supabase/server";

export type EventType =
  | "mine_started"
  | "mine_completed"
  | "mine_failed"
  | "lead_scored"
  | "lead_created"
  | "lead_stage_changed"
  | "outreach_drafted"
  | "outreach_sent"
  | "settings_updated"
  | "market_added"
  | "market_removed"
  | "login"
  | "plan_upgraded"
  | "export_downloaded";

export type Severity = "info" | "success" | "warning" | "error";

export interface ActivityEvent {
  userId:      string;
  clientId?:   string;
  eventType:   EventType;
  entityType?: string;
  entityId?:   string;
  title:       string;
  description?: string;
  metadata?:   Record<string, unknown>;
  icon?:       string;
  severity?:   Severity;
}

// Icon mapping per event type
const EVENT_ICONS: Record<EventType, string> = {
  mine_started:        "pickaxe",
  mine_completed:      "gem",
  mine_failed:         "alert",
  lead_scored:         "flame",
  lead_created:        "user-plus",
  lead_stage_changed:  "arrow-right",
  outreach_drafted:    "mail",
  outreach_sent:       "send",
  settings_updated:    "settings",
  market_added:        "map-pin",
  market_removed:      "map-pin-off",
  login:               "shield",
  plan_upgraded:       "zap",
  export_downloaded:   "download",
};

// Severity mapping per event type
const EVENT_SEVERITY: Record<EventType, Severity> = {
  mine_started:        "info",
  mine_completed:      "success",
  mine_failed:         "error",
  lead_scored:         "success",
  lead_created:        "info",
  lead_stage_changed:  "info",
  outreach_drafted:    "info",
  outreach_sent:       "success",
  settings_updated:    "info",
  market_added:        "info",
  market_removed:      "warning",
  login:               "info",
  plan_upgraded:       "success",
  export_downloaded:   "info",
};

export async function logActivity(event: ActivityEvent): Promise<void> {
  try {
    const supabase = await createServerSupabase();
    await supabase.from("activity_log").insert({
      user_id:     event.userId,
      client_id:   event.clientId ?? null,
      event_type:  event.eventType,
      entity_type: event.entityType ?? null,
      entity_id:   event.entityId ?? null,
      title:       event.title,
      description: event.description ?? null,
      metadata:    event.metadata ?? {},
      icon:        event.icon ?? EVENT_ICONS[event.eventType],
      severity:    event.severity ?? EVENT_SEVERITY[event.eventType],
    });
  } catch {
    // Non-fatal — logging should never break the main flow
  }
}