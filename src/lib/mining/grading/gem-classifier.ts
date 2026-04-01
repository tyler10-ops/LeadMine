import type { GemGrade } from "@/types";
import type { EnrichedRecord } from "../enrichment";

/**
 * Classify an enriched, scored record into a gem grade.
 *
 * - Elite (80-100):   High score + has email + has website + good reviews
 * - Refined (50-79):  Decent score + at least some contact info
 * - Rock (0-49):      Low score or missing critical data
 */
export function classifyGem(
  record: EnrichedRecord,
  score: number
): GemGrade {
  // Elite: high score with reachable contact info
  if (
    score >= 80 &&
    record.enrichedEmails.length > 0 &&
    record.website !== null
  ) {
    return "elite";
  }

  // Refined: mid-range score with at least one contact method
  if (
    score >= 50 &&
    (record.enrichedEmails.length > 0 ||
      record.enrichedPhones.length > 0)
  ) {
    return "refined";
  }

  // Everything else is a rock
  return "rock";
}

/** Determine lead intent based on gem grade and enrichment signals. */
export function inferIntent(
  record: EnrichedRecord,
  grade: GemGrade
): "hot" | "warm" | "cold" {
  if (grade === "elite") return "hot";
  if (grade === "refined") return "warm";
  return "cold";
}
