/** Base interface for vertical-specific mining configurations. */
export interface VerticalConfig {
  /** Unique slug identifier, e.g. "roofing" */
  id: string;
  /** Human-readable label */
  label: string;
  /** Google Places search queries per location */
  searchQueries: string[];
  /** Google Places type filters (e.g. "roofing_contractor") */
  placeTypes: string[];
  /** Keywords that boost a lead's score when found on their website */
  highValueKeywords: string[];
  /** Keywords that indicate low quality / irrelevant business */
  exclusionKeywords: string[];
  /** Minimum Google rating (1-5) to pass initial filter */
  minRating: number;
  /** Minimum review count to pass initial filter */
  minReviews: number;
  /** Weight multipliers for scoring dimensions */
  scoringWeights: ScoringWeights;
}

export interface ScoringWeights {
  /** Weight for Google rating (0-1) */
  rating: number;
  /** Weight for review count (0-1) */
  reviewCount: number;
  /** Weight for website presence (0-1) */
  websitePresence: number;
  /** Weight for keyword match density (0-1) */
  keywordRelevance: number;
  /** Weight for photo count / profile completeness (0-1) */
  profileCompleteness: number;
}
