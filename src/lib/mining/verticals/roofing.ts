import type { VerticalConfig } from "./base";

export const roofingVertical: VerticalConfig = {
  id: "roofing",
  label: "Roofing Contractors",
  searchQueries: [
    "roofing contractor",
    "roof repair",
    "roof replacement",
    "roofing company",
    "commercial roofing",
  ],
  placeTypes: ["roofing_contractor", "general_contractor"],
  highValueKeywords: [
    "free estimate",
    "licensed",
    "insured",
    "emergency roof repair",
    "storm damage",
    "hail damage",
    "insurance claims",
    "residential roofing",
    "commercial roofing",
    "roof inspection",
    "metal roofing",
    "shingle",
    "flat roof",
    "gutter",
  ],
  exclusionKeywords: [
    "closed permanently",
    "out of business",
    "temporarily closed",
  ],
  minRating: 3.0,
  minReviews: 5,
  scoringWeights: {
    rating: 0.25,
    reviewCount: 0.2,
    websitePresence: 0.2,
    keywordRelevance: 0.2,
    profileCompleteness: 0.15,
  },
};
