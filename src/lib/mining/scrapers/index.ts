import type { BaseScraper } from "./base";
import { GooglePlacesScraper } from "./google-places";

export type { RawBusinessRecord, BaseScraper } from "./base";
export { GooglePlacesScraper } from "./google-places";

/** Registry of available scrapers, keyed by name. */
const scraperRegistry = new Map<string, () => BaseScraper>([
  ["google-places", () => new GooglePlacesScraper()],
]);

/** Instantiate a scraper by name. Throws if not found. */
export function getScraper(name: string): BaseScraper {
  const factory = scraperRegistry.get(name);
  if (!factory) throw new Error(`Unknown scraper: ${name}`);
  return factory();
}

/** List all registered scraper names. */
export function listScrapers(): string[] {
  return Array.from(scraperRegistry.keys());
}
