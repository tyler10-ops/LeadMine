import type { GemGrade } from "@/types";
import type { VerticalConfig } from "../verticals/base";
import type { EnrichedRecord } from "../enrichment";
import { scoreRecord } from "./scorer";
import { classifyGem, inferIntent } from "./gem-classifier";

export { scoreRecord } from "./scorer";
export { classifyGem, inferIntent } from "./gem-classifier";

/** Fully graded record ready for insertion into the leads table. */
export interface GradedRecord {
  record: EnrichedRecord;
  score: number;
  gemGrade: GemGrade;
  intent: "hot" | "warm" | "cold";
}

/**
 * Grade a batch of enriched records against a vertical config.
 * Returns records sorted by score descending.
 */
export function gradeBatch(
  records: EnrichedRecord[],
  vertical: VerticalConfig
): GradedRecord[] {
  return records
    .map((record) => {
      const score = scoreRecord(record, vertical);
      const gemGrade = classifyGem(record, score);
      const intent = inferIntent(record, gemGrade);
      return { record, score, gemGrade, intent };
    })
    .filter((r) => r.score >= vertical.minRating) // Filter out below-threshold
    .sort((a, b) => b.score - a.score);
}
