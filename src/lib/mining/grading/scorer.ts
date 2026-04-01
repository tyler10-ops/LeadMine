import type { VerticalConfig } from "../verticals/base";
import type { EnrichedRecord } from "../enrichment";

/**
 * Score an enriched record from 0–100 based on the vertical's scoring weights.
 *
 * Dimensions:
 * - rating:             Google rating normalized to 0-100
 * - reviewCount:        Log-scaled review count (100 reviews = max)
 * - websitePresence:    Has website + has email + has contact page
 * - keywordRelevance:   % of vertical high-value keywords found
 * - profileCompleteness: Photos, phone, address completeness
 */
export function scoreRecord(
  record: EnrichedRecord,
  vertical: VerticalConfig
): number {
  const weights = vertical.scoringWeights;

  // Rating: 0-100 (5.0 = 100)
  const ratingScore = record.rating ? (record.rating / 5) * 100 : 0;

  // Review count: log-scaled, 100+ reviews = 100
  const reviewScore = record.reviewCount
    ? Math.min(100, (Math.log10(record.reviewCount + 1) / Math.log10(101)) * 100)
    : 0;

  // Website presence: composite of website + email + contact page
  let websiteScore = 0;
  if (record.website) websiteScore += 40;
  if (record.enrichedEmails.length > 0) websiteScore += 40;
  if (record.hasContactPage) websiteScore += 20;

  // Keyword relevance: % of vertical keywords found in website data
  const keywordScore = calculateKeywordRelevance(record, vertical);

  // Profile completeness: phone + address + photos
  let completenessScore = 0;
  if (record.phone || record.enrichedPhones.length > 0) completenessScore += 30;
  if (record.address) completenessScore += 30;
  if (record.photoCount && record.photoCount > 0) {
    completenessScore += Math.min(40, record.photoCount * 8);
  }

  // Weighted sum
  const raw =
    ratingScore * weights.rating +
    reviewScore * weights.reviewCount +
    websiteScore * weights.websitePresence +
    keywordScore * weights.keywordRelevance +
    completenessScore * weights.profileCompleteness;

  return Math.round(Math.max(0, Math.min(100, raw)));
}

/** Calculate keyword relevance score (0-100). */
function calculateKeywordRelevance(
  record: EnrichedRecord,
  vertical: VerticalConfig
): number {
  if (vertical.highValueKeywords.length === 0) return 50;

  const searchableText = [
    record.name,
    record.websiteTitle,
    record.websiteDescription,
    ...record.websiteKeywords,
    ...record.types,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let matches = 0;
  for (const keyword of vertical.highValueKeywords) {
    if (searchableText.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  // Check exclusion keywords — penalize heavily
  for (const keyword of vertical.exclusionKeywords) {
    if (searchableText.includes(keyword.toLowerCase())) {
      return 0;
    }
  }

  return Math.min(100, (matches / vertical.highValueKeywords.length) * 150);
}
