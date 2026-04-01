import * as cheerio from "cheerio";

/** Result of scraping a business website for contact info. */
export interface WebsiteEnrichment {
  emails: string[];
  phones: string[];
  socialLinks: string[];
  hasContactPage: boolean;
  title: string | null;
  description: string | null;
  keywords: string[];
}

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
const SOCIAL_DOMAINS = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "yelp.com",
  "nextdoor.com",
];

/** Emails to exclude (generic/spam patterns). */
const EXCLUDED_EMAIL_PATTERNS = [
  /noreply@/i,
  /no-reply@/i,
  /mailer-daemon@/i,
  /postmaster@/i,
  /@example\./i,
  /@sentry\./i,
  /@wixpress\./i,
  /\.png$/i,
  /\.jpg$/i,
  /\.gif$/i,
];

/**
 * Scrape a business website to extract emails, phones, and metadata.
 * Fetches the homepage + /contact page if it exists.
 */
export async function scrapeWebsite(
  url: string
): Promise<WebsiteEnrichment | null> {
  try {
    const normalizedUrl = normalizeUrl(url);
    const pages = [normalizedUrl];

    // Try common contact page paths
    const contactPaths = ["/contact", "/contact-us", "/about", "/about-us"];
    const homepage = await fetchPage(normalizedUrl);
    if (!homepage) return null;

    const $ = cheerio.load(homepage);

    // Check if any contact links exist on the homepage
    const hasContactPage = contactPaths.some((path) => {
      const fullUrl = new URL(path, normalizedUrl).href;
      return $(`a[href="${fullUrl}"], a[href="${path}"]`).length > 0;
    });

    if (hasContactPage) {
      for (const path of contactPaths) {
        pages.push(new URL(path, normalizedUrl).href);
      }
    }

    const allEmails = new Set<string>();
    const allPhones = new Set<string>();
    const allSocialLinks = new Set<string>();
    let title: string | null = null;
    let description: string | null = null;

    // Scrape all pages concurrently (homepage already fetched)
    const pageContents = await Promise.allSettled(
      pages.slice(1).map((p) => fetchPage(p))
    );

    const htmlPages = [homepage];
    for (const result of pageContents) {
      if (result.status === "fulfilled" && result.value) {
        htmlPages.push(result.value);
      }
    }

    for (const html of htmlPages) {
      const page$ = cheerio.load(html);

      // Extract emails
      const text = page$("body").text();
      const emailMatches = text.match(EMAIL_REGEX) ?? [];
      const hrefEmails = page$('a[href^="mailto:"]')
        .map((_, el) => page$(el).attr("href")?.replace("mailto:", "").split("?")[0])
        .get();

      for (const email of [...emailMatches, ...hrefEmails]) {
        if (email && !EXCLUDED_EMAIL_PATTERNS.some((p) => p.test(email))) {
          allEmails.add(email.toLowerCase());
        }
      }

      // Extract phones
      const phoneMatches = text.match(PHONE_REGEX) ?? [];
      const hrefPhones = page$('a[href^="tel:"]')
        .map((_, el) => page$(el).attr("href")?.replace("tel:", ""))
        .get();
      for (const phone of [...phoneMatches, ...hrefPhones]) {
        if (phone) allPhones.add(phone.trim());
      }

      // Extract social links
      page$("a[href]").each((_, el) => {
        const href = page$(el).attr("href");
        if (href && SOCIAL_DOMAINS.some((d) => href.includes(d))) {
          allSocialLinks.add(href);
        }
      });

      // Extract meta from homepage only
      if (html === homepage) {
        title = page$("title").text().trim() || null;
        description =
          page$('meta[name="description"]').attr("content")?.trim() ?? null;
      }
    }

    // Extract keywords from title + description
    const keywords = extractKeywords(title, description);

    return {
      emails: Array.from(allEmails),
      phones: Array.from(allPhones),
      socialLinks: Array.from(allSocialLinks),
      hasContactPage,
      title,
      description,
      keywords,
    };
  } catch {
    return null;
  }
}

/** Fetch a page with a timeout and basic error handling. */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LeadMineBot/1.0; +https://leadmine.ai)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    return await res.text();
  } catch {
    return null;
  }
}

/** Normalize a URL to ensure it has a protocol. */
function normalizeUrl(url: string): string {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

/** Extract meaningful keywords from title and description. */
function extractKeywords(
  title: string | null,
  description: string | null
): string[] {
  const text = [title, description].filter(Boolean).join(" ").toLowerCase();
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "our", "your", "we", "us",
    "you", "it", "its", "this", "that", "from",
  ]);

  return text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 30);
}
