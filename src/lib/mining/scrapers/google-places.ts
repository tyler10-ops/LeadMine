import type { BaseScraper, RawBusinessRecord } from "./base";

const PLACES_TEXT_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  photos?: unknown[];
  types?: string[];
  addressComponents?: Array<{
    longText: string;
    types: string[];
  }>;
}

interface TextSearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

/**
 * Google Places API (new) Text Search scraper.
 * Uses the v1 API with field masks for cost efficiency.
 */
export class GooglePlacesScraper implements BaseScraper {
  readonly name = "google-places";
  private apiKey: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private limitFn: (<T>(fn: () => Promise<T>) => Promise<T>) | null = null;

  constructor() {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) throw new Error("GOOGLE_PLACES_API_KEY is not set");
    this.apiKey = key;
  }

  /** Initialize the concurrency limiter (p-limit is ESM-only). */
  private async ensureLimit(): Promise<void> {
    if (this.limitFn) return;
    const pLimit = (await import("p-limit")).default;
    this.limitFn = pLimit(5);
  }

  async scrape(query: string, location: string): Promise<RawBusinessRecord[]> {
    await this.ensureLimit();
    const limit = this.limitFn!;
    const results: RawBusinessRecord[] = [];
    let pageToken: string | undefined;

    // Paginate through up to 3 pages (60 results max)
    for (let page = 0; page < 3; page++) {
      const batch = await limit(() =>
        this.fetchPage(query, location, pageToken)
      );

      if (batch.places.length === 0) break;

      for (const place of batch.places) {
        results.push(this.toRecord(place));
      }

      pageToken = batch.nextPageToken;
      if (!pageToken) break;
    }

    return results;
  }

  /** Execute a single Text Search API call. */
  private async fetchPage(
    query: string,
    location: string,
    pageToken?: string
  ): Promise<{ places: PlaceResult[]; nextPageToken?: string }> {
    const body: Record<string, unknown> = {
      textQuery: `${query} in ${location}`,
      pageSize: 20,
    };
    if (pageToken) body.pageToken = pageToken;

    const fieldMask = [
      "places.id",
      "places.displayName",
      "places.formattedAddress",
      "places.nationalPhoneNumber",
      "places.websiteUri",
      "places.rating",
      "places.userRatingCount",
      "places.photos",
      "places.types",
      "places.addressComponents",
    ].join(",");

    const res = await fetch(PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Google Places API error ${res.status}: ${text}`);
    }

    const data = (await res.json()) as TextSearchResponse;
    return {
      places: data.places ?? [],
      nextPageToken: data.nextPageToken,
    };
  }

  /** Convert a Places API result to our internal record format. */
  private toRecord(place: PlaceResult): RawBusinessRecord {
    const components = place.addressComponents ?? [];
    const findComponent = (type: string) =>
      components.find((c) => c.types.includes(type))?.longText ?? null;

    return {
      sourceId: place.id,
      source: this.name,
      name: place.displayName?.text ?? "Unknown",
      phone: place.nationalPhoneNumber ?? null,
      email: null, // Enriched later via website scrape
      website: place.websiteUri ?? null,
      address: place.formattedAddress ?? null,
      city: findComponent("locality"),
      state: findComponent("administrative_area_level_1"),
      zip: findComponent("postal_code"),
      rating: place.rating ?? null,
      reviewCount: place.userRatingCount ?? null,
      photoCount: place.photos?.length ?? null,
      types: place.types ?? [],
      rawData: place as unknown as Record<string, unknown>,
    };
  }
}
