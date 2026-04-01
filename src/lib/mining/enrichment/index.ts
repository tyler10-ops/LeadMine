import type { RawBusinessRecord } from "../scrapers/base";
import { scrapeWebsite } from "./website-scraper";
import { deduplicateRecords } from "./deduplicator";

export { scrapeWebsite } from "./website-scraper";
export type { WebsiteEnrichment } from "./website-scraper";
export { deduplicateRecords } from "./deduplicator";
export type { DedupResult } from "./deduplicator";

/** Enriched business record with website data merged in. */
export interface EnrichedRecord extends RawBusinessRecord {
  enrichedEmails: string[];
  enrichedPhones: string[];
  socialLinks: string[];
  websiteTitle: string | null;
  websiteDescription: string | null;
  websiteKeywords: string[];
  hasContactPage: boolean;
}

/**
 * Run the full enrichment pipeline on a batch of records:
 * 1. Dedup against Supabase
 * 2. Scrape websites for emails/phones
 */
export async function enrichBatch(
  records: RawBusinessRecord[],
  clientId: string
): Promise<{ enriched: EnrichedRecord[]; duplicateCount: number }> {
  // Step 1: Dedup
  const { newRecords, duplicateIds } = await deduplicateRecords(
    records,
    clientId
  );

  // Step 2: Enrich new records with website data (concurrently, batched)
  const pLimit = (await import("p-limit")).default;
  const limit = pLimit(5);

  const enriched = await Promise.all(
    newRecords.map((record) =>
      limit(async (): Promise<EnrichedRecord> => {
        if (!record.website) {
          return {
            ...record,
            enrichedEmails: record.email ? [record.email] : [],
            enrichedPhones: record.phone ? [record.phone] : [],
            socialLinks: [],
            websiteTitle: null,
            websiteDescription: null,
            websiteKeywords: [],
            hasContactPage: false,
          };
        }

        const websiteData = await scrapeWebsite(record.website);
        if (!websiteData) {
          return {
            ...record,
            enrichedEmails: record.email ? [record.email] : [],
            enrichedPhones: record.phone ? [record.phone] : [],
            socialLinks: [],
            websiteTitle: null,
            websiteDescription: null,
            websiteKeywords: [],
            hasContactPage: false,
          };
        }

        // Merge: prefer scraped emails, dedup
        const allEmails = new Set([
          ...(record.email ? [record.email] : []),
          ...websiteData.emails,
        ]);
        const allPhones = new Set([
          ...(record.phone ? [record.phone] : []),
          ...websiteData.phones,
        ]);

        return {
          ...record,
          enrichedEmails: Array.from(allEmails),
          enrichedPhones: Array.from(allPhones),
          socialLinks: websiteData.socialLinks,
          websiteTitle: websiteData.title,
          websiteDescription: websiteData.description,
          websiteKeywords: websiteData.keywords,
          hasContactPage: websiteData.hasContactPage,
        };
      })
    )
  );

  return { enriched, duplicateCount: duplicateIds.length };
}
