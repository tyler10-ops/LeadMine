/**
 * Prospect Miner — finds realtors and brokerages via Google Places
 * and saves them as LeadMine sales prospects.
 */

import { createServiceClient } from "@/lib/supabase/server";

const GOOGLE_PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

interface PlaceResult {
  place_id:     string;
  name:         string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?:     string;
  rating?:      number;
  user_ratings_total?: number;
  types?:       string[];
}

interface MineProspectsOptions {
  city:    string;
  state:   string;
  queries?: string[];   // search terms, defaults to realtor-focused queries
  limit?:  number;      // max prospects to save (default 50)
}

const DEFAULT_QUERIES = [
  "real estate agent",
  "realtor",
  "real estate broker",
  "real estate brokerage",
  "RE/MAX",
  "Keller Williams",
  "Coldwell Banker",
  "Century 21",
  "eXp Realty",
];

function scoreProspect(place: PlaceResult): { score: number; reason: string } {
  let score = 40; // base
  const reasons: string[] = [];

  if (place.rating && place.rating >= 4.5) {
    score += 20; reasons.push("highly rated");
  } else if (place.rating && place.rating >= 4.0) {
    score += 10; reasons.push("well rated");
  }

  if (place.user_ratings_total && place.user_ratings_total >= 50) {
    score += 15; reasons.push("established business");
  } else if (place.user_ratings_total && place.user_ratings_total >= 20) {
    score += 8;
  }

  if (place.website) {
    score += 10; reasons.push("has website");
  }

  if (place.formatted_phone_number) {
    score += 5; reasons.push("phone listed");
  }

  // Franchise agents = bigger operations = better prospects
  const franchises = ["RE/MAX", "Keller Williams", "Coldwell Banker", "Century 21", "eXp", "Berkshire"];
  if (franchises.some(f => place.name.includes(f))) {
    score += 15; reasons.push("franchise agent");
  }

  return {
    score: Math.min(score, 100),
    reason: reasons.join(", ") || "standard prospect",
  };
}

async function searchPlaces(query: string, city: string, state: string): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY not set");

  const location = `${city}, ${state}`;
  const searchQuery = `${query} in ${location}`;

  const searchUrl = `${GOOGLE_PLACES_BASE}/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json() as { results: PlaceResult[]; status: string };

  if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
    console.warn(`[prospect-miner] Places API status: ${searchData.status} for query: ${searchQuery}`);
    return [];
  }

  // Fetch details for phone + website
  const detailed: PlaceResult[] = [];
  for (const place of (searchData.results ?? []).slice(0, 8)) {
    try {
      const detailUrl = `${GOOGLE_PLACES_BASE}/details/json?place_id=${place.place_id}&fields=place_id,name,formatted_phone_number,website,rating,user_ratings_total,formatted_address&key=${apiKey}`;
      const detailRes = await fetch(detailUrl);
      const detailData = await detailRes.json() as { result: PlaceResult };
      detailed.push({ ...place, ...detailData.result });
    } catch {
      detailed.push(place);
    }
  }

  return detailed;
}

function extractEmailFromWebsite(_website: string): string | null {
  // Without scraping, we can't reliably extract emails
  // Return null — emails are gathered via manual research or enrichment tools
  return null;
}

function parseCityState(address: string, city: string, state: string) {
  // Try to extract zip from formatted address
  const zipMatch = address?.match(/\b\d{5}\b/);
  return { city, state, zip: zipMatch?.[0] ?? null };
}

export async function mineProspects(options: MineProspectsOptions): Promise<{
  found: number;
  saved: number;
  skipped: number;
  errors: string[];
}> {
  const { city, state, queries = DEFAULT_QUERIES, limit = 50 } = options;
  const supabase = createServiceClient();
  const errors: string[] = [];

  let found    = 0;
  let saved    = 0;
  let skipped  = 0;
  const seen   = new Set<string>();

  for (const query of queries) {
    if (saved >= limit) break;

    let places: PlaceResult[] = [];
    try {
      places = await searchPlaces(query, city, state);
    } catch (e) {
      errors.push(`Search failed for "${query}": ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    for (const place of places) {
      if (saved >= limit) break;
      if (seen.has(place.place_id)) continue;
      seen.add(place.place_id);
      found++;

      const { score, reason } = scoreProspect(place);
      const location = parseCityState(place.formatted_address ?? "", city, state);

      const { error } = await supabase.from("prospects").upsert({
        business_name:    place.name,
        phone:            place.formatted_phone_number ?? null,
        website:          place.website ?? null,
        city:             location.city,
        state:            location.state,
        zip:              location.zip,
        source:           "google_places",
        google_place_id:  place.place_id,
        google_rating:    place.rating ?? null,
        google_reviews:   place.user_ratings_total ?? null,
        score,
        score_reason:     reason,
        stage:            "discovered",
      }, { onConflict: "google_place_id", ignoreDuplicates: true });

      if (error) {
        if (error.code === "23505") { skipped++; } // duplicate
        else { errors.push(error.message); }
      } else {
        saved++;
      }
    }

    // Rate limit — Google Places allows ~10 req/sec
    await new Promise(r => setTimeout(r, 200));
  }

  return { found, saved, skipped, errors };
}
