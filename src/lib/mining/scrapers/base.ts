/** Raw record returned by any scraper before enrichment/grading. */
export interface RawBusinessRecord {
  /** Source-specific unique id (e.g. Google place_id) */
  sourceId: string;
  /** Scraper that produced this record */
  source: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  rating: number | null;
  reviewCount: number | null;
  photoCount: number | null;
  types: string[];
  /** Raw payload from the API for debugging / re-processing */
  rawData: Record<string, unknown>;
}

/** Interface every scraper must implement. */
export interface BaseScraper {
  /** Unique name for this scraper */
  readonly name: string;
  /**
   * Scrape businesses for the given query in the given location.
   * @param query  Search query (e.g. "roofing contractor")
   * @param location  Location string (e.g. "Dallas, TX")
   * @returns Array of raw business records
   */
  scrape(query: string, location: string): Promise<RawBusinessRecord[]>;
}
