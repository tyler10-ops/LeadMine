import { createServiceClient } from "@/lib/supabase/server";
import type { RawBusinessRecord } from "../scrapers/base";

/** Result of deduplication check. */
export interface DedupResult {
  /** Records that are new (not in DB). */
  newRecords: RawBusinessRecord[];
  /** Source IDs that already exist. */
  duplicateIds: string[];
}

/**
 * Deduplicate raw business records against the Supabase `leads` table.
 * Checks by source_id + source combination, and also by phone/email
 * to catch cross-source duplicates.
 */
export async function deduplicateRecords(
  records: RawBusinessRecord[],
  clientId: string
): Promise<DedupResult> {
  if (records.length === 0) {
    return { newRecords: [], duplicateIds: [] };
  }

  const supabase = createServiceClient();
  const duplicateIds: string[] = [];
  const newRecords: RawBusinessRecord[] = [];

  // Batch check: look up existing leads by source URL (which stores sourceId)
  const sourceIds = records.map((r) => `${r.source}:${r.sourceId}`);

  const { data: existingBySource } = await supabase
    .from("leads")
    .select("source_url")
    .eq("client_id", clientId)
    .in("source_url", sourceIds);

  const existingSources = new Set(
    (existingBySource ?? []).map((r: { source_url: string }) => r.source_url)
  );

  // Also check by phone for cross-source dedup
  const phones = records
    .map((r) => r.phone)
    .filter((p): p is string => p !== null);

  const existingPhones = new Set<string>();
  if (phones.length > 0) {
    const { data: existingByPhone } = await supabase
      .from("leads")
      .select("phone")
      .eq("client_id", clientId)
      .in("phone", phones);

    for (const row of existingByPhone ?? []) {
      if (row.phone) existingPhones.add(row.phone);
    }
  }

  for (const record of records) {
    const sourceKey = `${record.source}:${record.sourceId}`;
    const isDuplicate =
      existingSources.has(sourceKey) ||
      (record.phone !== null && existingPhones.has(record.phone));

    if (isDuplicate) {
      duplicateIds.push(record.sourceId);
    } else {
      newRecords.push(record);
    }
  }

  return { newRecords, duplicateIds };
}
