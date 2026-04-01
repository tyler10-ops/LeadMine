/**
 * Rentcast Property Data Adapter
 *
 * Fetches property records from the Rentcast API (rentcast.io).
 * Rentcast provides owner name, mailing address, sale history, assessed value,
 * and owner-occupied flag — everything LeadMine needs for seller lead scoring.
 *
 * Docs: https://developers.rentcast.io
 * Auth: X-Api-Key header
 * Plans: Foundation $74/mo (1,000 req) | Growth $199/mo (5,000 req)
 *
 * Required env var: RENTCAST_API_KEY
 */

import type { RawPropertyRecord } from "./scorer";

const RENTCAST_BASE = "https://api.rentcast.io/v1";
const PAGE_SIZE = 500; // Rentcast max per request
const REQUEST_DELAY_MS = 60; // ~16 req/sec, under 20/sec rate limit

// ── Rentcast response types ────────────────────────────────────────────────

interface RentcastMailingAddress {
  formattedAddress?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface RentcastOwner {
  names?: string[];
  type?: string;
  mailingAddress?: RentcastMailingAddress;
}

interface RentcastTaxAssessment {
  year?: number;
  value?: number;
  land?: number;
  improvements?: number;
}

interface RentcastProperty {
  id?: string;
  formattedAddress?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: number;
  yearBuilt?: number;
  owner?: RentcastOwner;
  ownerOccupied?: boolean;
  lastSaleDate?: string;
  lastSalePrice?: number;
  taxAssessments?: Record<string, RentcastTaxAssessment>;
}

// ── Result type (matches ATTOM adapter interface) ──────────────────────────

export interface RentcastFetchResult {
  records: RawPropertyRecord[];
  total: number;
  errors: string[];
}

// ── Main fetch function ────────────────────────────────────────────────────

/**
 * Fetch property records from Rentcast by ZIP code.
 * Paginates automatically until maxRecords reached or ZIP is exhausted.
 */
export async function fetchRentcastByZip(
  zipCode: string,
  options: { maxRecords?: number } = {}
): Promise<RentcastFetchResult> {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) throw new Error("RENTCAST_API_KEY is not configured in environment");

  const maxRecords = options.maxRecords ?? 500;
  const allRecords: RawPropertyRecord[] = [];
  const errors: string[] = [];
  let offset = 0;

  while (allRecords.length < maxRecords) {
    const url = `${RENTCAST_BASE}/properties?zipCode=${zipCode}&limit=${PAGE_SIZE}&offset=${offset}`;

    try {
      const res = await fetch(url, {
        headers: {
          "X-Api-Key": apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (res.status === 404 || res.status === 204) break;

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        // Rentcast returns 400 for ZIPs with no data
        if (res.status === 400) break;
        errors.push(`ZIP ${zipCode} offset ${offset}: HTTP ${res.status} — ${body.slice(0, 200)}`);
        break;
      }

      const data: RentcastProperty[] = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const p of data) {
        const record = normalizeRentcastProperty(p);
        if (record) allRecords.push(record);
      }

      // If we got fewer than PAGE_SIZE, we've reached the end
      if (data.length < PAGE_SIZE) break;

      offset += PAGE_SIZE;
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      errors.push(`ZIP ${zipCode}: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }
  }

  return {
    records: allRecords.slice(0, maxRecords),
    total: allRecords.length,
    errors,
  };
}

/**
 * Fetch property records across multiple ZIP codes.
 * Distributes maxRecords evenly across ZIPs.
 */
export async function fetchRentcastByZips(
  zipCodes: string[],
  options: { maxRecords?: number } = {}
): Promise<RentcastFetchResult> {
  if (zipCodes.length === 0) {
    return { records: [], total: 0, errors: ["No ZIP codes provided"] };
  }

  const maxRecords = options.maxRecords ?? 500;
  const maxPerZip = Math.ceil(maxRecords / zipCodes.length);
  const allRecords: RawPropertyRecord[] = [];
  const allErrors: string[] = [];

  for (const zip of zipCodes) {
    if (allRecords.length >= maxRecords) break;

    const result = await fetchRentcastByZip(zip, { maxRecords: maxPerZip });
    allRecords.push(...result.records);
    if (result.errors.length) allErrors.push(...result.errors);
  }

  return {
    records: allRecords.slice(0, maxRecords),
    total: allRecords.length,
    errors: allErrors,
  };
}

// ── Field normalizer ───────────────────────────────────────────────────────

function normalizeRentcastProperty(p: RentcastProperty): RawPropertyRecord | null {
  const addr = (p.addressLine1 ?? p.formattedAddress ?? "").trim();
  if (!addr) return null;

  const city  = p.city?.trim() ?? "";
  const state = p.state?.trim() ?? "";
  const zip   = p.zipCode?.trim() ?? "";

  // Owner info
  const ownerName = p.owner?.names?.[0]?.trim();
  const mailing   = p.owner?.mailingAddress;

  // Assessed value — use most recent year available
  let assessedValue: number | undefined;
  if (p.taxAssessments) {
    const years = Object.keys(p.taxAssessments).sort().reverse();
    if (years.length > 0) {
      assessedValue = p.taxAssessments[years[0]]?.value;
    }
  }

  // Equity estimation — assessed value minus estimated mortgage balance
  let estimatedEquity: number | undefined;
  let equityPercent: number | undefined;
  if (assessedValue && p.lastSalePrice && p.lastSaleDate) {
    const yearsOwned = calcYearsOwned(p.lastSaleDate);
    const balance    = estimateMortgageBalance(p.lastSalePrice, yearsOwned);
    estimatedEquity  = Math.max(0, assessedValue - balance);
    equityPercent    = assessedValue > 0 ? (estimatedEquity / assessedValue) * 100 : 0;
  }

  // Absentee owner detection
  // Rentcast gives ownerOccupied boolean + mailing address
  // If not owner-occupied, or mailing address differs from property ZIP → absentee signal
  const isAbsenteeSignal = p.ownerOccupied === false;
  const effectiveMailingZip =
    isAbsenteeSignal && !mailing?.zipCode
      ? "00000"  // sentinel to trigger scorer's zip-mismatch signal
      : mailing?.zipCode?.trim();

  return {
    owner_name:            ownerName,
    owner_mailing_address: mailing?.addressLine1?.trim(),
    owner_mailing_city:    mailing?.city?.trim(),
    owner_mailing_state:   mailing?.state?.trim(),
    owner_mailing_zip:     effectiveMailingZip,

    property_address: addr,
    property_city:    city,
    property_state:   state,
    property_zip:     zip,
    property_county:  p.county?.trim() ?? "",
    property_type:    normalizePropertyType(p.propertyType),

    last_sale_date:   p.lastSaleDate ? p.lastSaleDate.split("T")[0] : undefined,
    last_sale_price:  p.lastSalePrice ?? undefined,
    assessed_value:   assessedValue,

    estimated_equity: estimatedEquity,
    equity_percent:   equityPercent,

    external_property_id: p.id?.toString(),
    data_source: "rentcast",
    raw_data: {
      ownerOccupied: p.ownerOccupied,
      squareFootage: p.squareFootage,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      yearBuilt: p.yearBuilt,
      lotSize: p.lotSize,
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function calcYearsOwned(lastSaleDate: string): number {
  const sale = new Date(lastSaleDate);
  const now  = new Date();
  return (now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

/**
 * Rough mortgage balance estimator.
 * Assumes 30-year fixed at 6.5%, 20% down payment.
 * Good enough for equity signal scoring — not financial advice.
 */
function estimateMortgageBalance(purchasePrice: number, yearsOwned: number): number {
  const downPct    = 0.20;
  const rate       = 0.065 / 12;
  const principal  = purchasePrice * (1 - downPct);
  const n          = 360; // 30 years
  const paid       = Math.min(Math.floor(yearsOwned * 12), n);

  if (rate === 0) return Math.max(0, principal - (principal / n) * paid);

  const monthlyPayment = principal * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
  let balance = principal;
  for (let i = 0; i < paid; i++) {
    balance = balance * (1 + rate) - monthlyPayment;
  }
  return Math.max(0, balance);
}

function normalizePropertyType(type?: string): string | undefined {
  if (!type) return undefined;
  const map: Record<string, string> = {
    "Single Family": "single_family",
    "Condo":         "condo",
    "Townhouse":     "single_family",
    "Multi-Family":  "multi_family",
    "Manufactured":  "mobile_home",
    "Apartment":     "multi_family",
    "Land":          "land",
  };
  return map[type] ?? undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
