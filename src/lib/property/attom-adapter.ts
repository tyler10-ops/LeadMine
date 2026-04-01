/**
 * ATTOM Data API Adapter
 *
 * Replaces the open-data county portal approach with ATTOM's commercial API.
 * ATTOM provides clean, national property records with owner info, AVM,
 * sales history, and absentee-owner flags — all in one response.
 *
 * Sign up: https://developer.attomdata.com
 * Pricing: pay-per-call or subscription. ~$0.10/record at starter tier.
 *
 * Endpoints used:
 *   GET /propertyapi/v1.0.0/property/snapshot  — bulk property lookup by FIPS
 */

import type { RawPropertyRecord } from "./scorer";

const ATTOM_BASE = "https://api.gateway.attomdata.com/propertyapi/v1.0.0";

// ── ATTOM response types ───────────────────────────────────────────────────

interface AttomOwner {
  owner1?: { fullname?: string; firstnm?: string; lastnm?: string };
  mailingaddressinfo?: {
    mail1stfulladdress?: string;
    mailcity?: string;
    mailstate?: string;
    mailzip?: string;
  };
}

interface AttomSale {
  saleTransDate?: string;
  saleamt?: number;
  saleForeclosure?: string;
}

interface AttomAssessment {
  assessed?: { assdttlvalue?: number; assdlandvalue?: number };
  market?: { mktttlvalue?: number };
  tax?: { taxamt?: number; taxyear?: number };
}

interface AttomSummary {
  absenteeInd?: string; // "Absentee" | "Owner Occupied" | "Unknown"
  proptype?: string;    // "SFR" | "CONDO" | "MFR" | etc.
  yearbuilt?: number;
  propLandUse?: string;
}

interface AttomProperty {
  identifier: { attomId: number | string; fips?: string; apn?: string };
  address: {
    line1?: string;
    locality?: string;
    countrySubd?: string; // state code
    postal1?: string;
    statecode?: string;
  };
  summary?: AttomSummary;
  sale?: AttomSale;
  assessment?: AttomAssessment;
  owner?: AttomOwner;
}

interface AttomResponse {
  property?: AttomProperty[];
  status: {
    code: number;
    msg: string;
    total?: number;
    page?: number;
    pagesize?: number;
  };
}

// ── County FIPS registry ───────────────────────────────────────────────────
// FIPS = 5-digit Federal Information Processing Standard code for each county.
// Format: 2-digit state + 3-digit county.

export const COUNTY_FIPS: Record<string, string> = {
  // Texas
  "Travis_TX":      "48453", // Austin
  "Harris_TX":      "48201", // Houston
  "Dallas_TX":      "48113",
  "Tarrant_TX":     "48439", // Fort Worth
  "Bexar_TX":       "48029", // San Antonio
  "Collin_TX":      "48085", // Plano / Frisco
  "Denton_TX":      "48121",
  "El Paso_TX":     "48141",

  // Florida
  "Miami-Dade_FL":  "12086",
  "Broward_FL":     "12011",
  "Hillsborough_FL":"12057", // Tampa
  "Orange_FL":      "12095", // Orlando
  "Palm Beach_FL":  "12099",
  "Pinellas_FL":    "12103",
  "Duval_FL":       "12031", // Jacksonville

  // California
  "Los Angeles_CA": "06037",
  "San Diego_CA":   "06073",
  "Orange_CA":      "06059",
  "Riverside_CA":   "06065",
  "San Bernardino_CA": "06071",
  "Santa Clara_CA": "06085", // San Jose

  // Illinois
  "Cook_IL":        "17031", // Chicago

  // Georgia
  "Fulton_GA":      "13121", // Atlanta
  "Gwinnett_GA":    "13135",
  "Cobb_GA":        "13067",
  "DeKalb_GA":      "13089",

  // Washington
  "King_WA":        "53033", // Seattle
  "Pierce_WA":      "53053", // Tacoma
  "Snohomish_WA":   "53061",

  // Arizona
  "Maricopa_AZ":    "04013", // Phoenix
  "Pima_AZ":        "04019", // Tucson

  // Colorado
  "Denver_CO":      "08031",
  "Arapahoe_CO":    "08005",
  "Jefferson_CO":   "08059",
  "Adams_CO":       "08001",

  // North Carolina
  "Mecklenburg_NC": "37119", // Charlotte
  "Wake_NC":        "37183", // Raleigh
  "Guilford_NC":    "37081",

  // Nevada
  "Clark_NV":       "32003", // Las Vegas

  // Ohio
  "Franklin_OH":    "39049", // Columbus
  "Cuyahoga_OH":    "39035", // Cleveland
  "Hamilton_OH":    "39061", // Cincinnati

  // Michigan
  "Wayne_MI":       "26163", // Detroit
  "Oakland_MI":     "26125",

  // Pennsylvania
  "Philadelphia_PA":"42101",
  "Allegheny_PA":   "42003", // Pittsburgh

  // New York
  "Kings_NY":       "36047", // Brooklyn
  "Queens_NY":      "36081",
  "New York_NY":    "36061", // Manhattan
  "Nassau_NY":      "36059",

  // Tennessee
  "Shelby_TN":      "47157", // Memphis
  "Davidson_TN":    "47037", // Nashville

  // Missouri
  "St. Louis City_MO": "29510",
  "Jackson_MO":     "29095", // Kansas City

  // Minnesota
  "Hennepin_MN":    "27053", // Minneapolis

  // Oregon
  "Multnomah_OR":   "41051", // Portland

  // Indiana
  "Marion_IN":      "18097", // Indianapolis

  // Massachusetts
  "Suffolk_MA":     "25025", // Boston
  "Middlesex_MA":   "25017",

  // Virginia
  "Fairfax_VA":     "51059",
  "Prince William_VA": "51153",
};

/**
 * Look up FIPS code for a county + state combination.
 * Returns undefined if not in registry.
 */
export function getFips(county: string, state: string): string | undefined {
  return COUNTY_FIPS[`${county}_${state}`];
}

// ── Core fetch function ────────────────────────────────────────────────────

export interface AttomFetchResult {
  records: RawPropertyRecord[];
  total: number;
  page: number;
  errors: string[];
}

/**
 * Fetch via ZIP codes — works on all ATTOM trial plans.
 */
async function fetchAttomByZips(
  zipCodes: string[],
  options: { maxRecords?: number; propertyType?: "SFR" | "CONDO" | "MFR" | "ALL" }
): Promise<AttomFetchResult> {
  const pageSize   = 100;
  const maxPerZip  = Math.ceil((options.maxRecords ?? 500) / zipCodes.length);
  const allRecords: RawPropertyRecord[] = [];
  const errors: string[] = [];
  let total = 0;

  for (const zip of zipCodes) {
    let page = 1;
    while (allRecords.length < (options.maxRecords ?? 500)) {
      const url = buildAttomUrl({ postalCode: zip }, page, pageSize, options.propertyType);
      try {
        const res = await fetch(url, {
          headers: { apikey: process.env.ATTOM_API_KEY!, Accept: "application/json" },
          signal: AbortSignal.timeout(30_000),
        });
        if (res.status === 404 || res.status === 204) break;
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          // ATTOM returns HTTP 400 with "SuccessWithoutResult" to mean "no records found" — not a real error
          if (body.includes("SuccessWithoutResult")) break;
          errors.push(`ZIP ${zip} page ${page}: HTTP ${res.status} — ${body.slice(0, 300)}`);
          break;
        }
        const data: AttomResponse = await res.json();
        if (data.status.msg === "SuccessWithoutResult") break; // empty ZIP, move on
        if (data.status.code !== 0) { errors.push(`ZIP ${zip}: ${data.status.msg}`); break; }
        const props = data.property ?? [];
        if (props.length === 0) break;
        total += data.status.total ?? 0;
        for (const p of props) { const r = normalizeAttomProperty(p); if (r) allRecords.push(r); }
        if (allRecords.length >= maxPerZip * zipCodes.indexOf(zip) + maxPerZip) break;
        if (props.length < pageSize) break;
        page++;
        await new Promise((r) => setTimeout(r, 110));
      } catch (err) {
        errors.push(`ZIP ${zip}: ${err instanceof Error ? err.message : String(err)}`);
        break;
      }
    }
  }

  return { records: allRecords.slice(0, options.maxRecords ?? 500), total, page: 1, errors };
}

/**
 * Fetch property records from ATTOM by county name + state.
 * FIPS is used as a fallback when the county name lookup is ambiguous,
 * but the primary path uses county + state directly so any county works.
 */
export async function fetchAttomByCounty(
  countyOrFips: string,
  options: {
    maxRecords?: number;
    startPage?: number;
    propertyType?: "SFR" | "CONDO" | "MFR" | "ALL";
    state?: string;
    /** ZIP codes to use instead of county/FIPS — required on some ATTOM trial plans */
    zipCodes?: string[];
  } = {}
): Promise<AttomFetchResult> {
  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) throw new Error("ATTOM_API_KEY is not configured in environment");

  // If ZIP codes provided, iterate them instead of county-level query
  if (options.zipCodes && options.zipCodes.length > 0) {
    return fetchAttomByZips(options.zipCodes, options);
  }

  const pageSize = 100;
  const maxRecords = options.maxRecords ?? 500;
  const maxPages = Math.ceil(maxRecords / pageSize);
  const startPage = options.startPage ?? 1;

  const isFips = /^\d{5}$/.test(countyOrFips);

  const allRecords: RawPropertyRecord[] = [];
  const errors: string[] = [];
  let total = 0;

  for (let page = startPage; page < startPage + maxPages; page++) {
    const url = isFips
      ? buildAttomUrl({ fips: countyOrFips }, page, pageSize, options.propertyType)
      : buildAttomUrl({ county: countyOrFips, state: options.state }, page, pageSize, options.propertyType);

    let data: AttomResponse;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: apiKey,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (res.status === 404 || res.status === 204) break; // no more records
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        errors.push(`ATTOM API page ${page}: HTTP ${res.status} — ${text.slice(0, 200)}`);
        break;
      }

      data = await res.json();
    } catch (err) {
      errors.push(`ATTOM fetch page ${page}: ${err instanceof Error ? err.message : String(err)}`);
      break;
    }

    if (data.status.code !== 0) {
      // ATTOM uses status.code 0 for success; non-zero is an error
      errors.push(`ATTOM error (page ${page}): ${data.status.msg}`);
      break;
    }

    const properties = data.property ?? [];
    if (properties.length === 0) break;

    total = data.status.total ?? total;

    for (const prop of properties) {
      const record = normalizeAttomProperty(prop);
      if (record) allRecords.push(record);
    }

    if (allRecords.length >= maxRecords) break;
    if (properties.length < pageSize) break; // last page
  }

  return {
    records: allRecords.slice(0, maxRecords),
    total,
    page: startPage,
    errors,
  };
}

// ── URL builder ────────────────────────────────────────────────────────────

function buildAttomUrl(
  location: { fips?: string; county?: string; state?: string; postalCode?: string },
  page: number,
  pageSize: number,
  propType?: string
): string {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    page: String(page),
  });

  if (location.fips) {
    params.set("countyFips", location.fips);
  } else if (location.postalCode) {
    params.set("postalcode", location.postalCode);
  } else {
    if (location.county) params.set("county", location.county);
    if (location.state)  params.set("state",  location.state);
  }

  // Filter to SFR by default on trial — comma-separated values not supported on all plans
  if (propType && propType !== "ALL") {
    params.set("propertytype", propType);
  }
  // No propertytype filter = all types returned (widest compatibility with trial plan)

  return `${ATTOM_BASE}/property/basicprofile?${params.toString()}`;
}

// ── Field normalizer ───────────────────────────────────────────────────────

function normalizeAttomProperty(p: AttomProperty): RawPropertyRecord | null {
  const addr = p.address?.line1?.trim();
  if (!addr) return null;

  const city = p.address?.locality?.trim() ?? "";
  const state = (p.address?.statecode ?? p.address?.countrySubd ?? "").trim();
  const zip = p.address?.postal1?.trim() ?? "";

  // Assessment values
  const assessed = p.assessment?.assessed?.assdttlvalue;
  const market = p.assessment?.market?.mktttlvalue;
  const estimatedValue = market ?? assessed;

  // Last sale
  const sale = p.sale;
  const lastSaleDate = sale?.saleTransDate
    ? sale.saleTransDate.split("T")[0]
    : undefined;
  const lastSalePrice = sale?.saleamt ?? undefined;

  // Equity estimation
  let estimatedEquity: number | undefined;
  let equityPercent: number | undefined;
  if (estimatedValue && lastSalePrice && lastSaleDate) {
    const yearsOwned = calcYearsOwned(lastSaleDate);
    const balance = estimateMortgageBalance(lastSalePrice, yearsOwned);
    estimatedEquity = Math.max(0, estimatedValue - balance);
    equityPercent = estimatedValue > 0 ? (estimatedEquity / estimatedValue) * 100 : 0;
  }

  // Owner info
  const owner = p.owner;
  const ownerName = owner?.owner1?.fullname?.trim();
  const mailing = owner?.mailingaddressinfo;

  // Property type
  const propType = normalizePropertyType(p.summary?.proptype ?? p.summary?.propLandUse);

  // If ATTOM marks it as absentee, override mailing zip with a sentinel
  // so the scorer's zip-comparison logic fires correctly.
  // We store the raw absenteeInd in raw_data for reference.
  const attomAbsentee = p.summary?.absenteeInd === "Absentee";
  const mailingZip = mailing?.mailzip?.trim();
  // When ATTOM says absentee but we have no mailing zip, synthesize a mismatch
  const effectiveMailingZip =
    attomAbsentee && !mailingZip ? "00000" : mailingZip;

  return {
    owner_name: ownerName,
    owner_mailing_address: mailing?.mail1stfulladdress?.trim(),
    owner_mailing_city: mailing?.mailcity?.trim(),
    owner_mailing_state: mailing?.mailstate?.trim(),
    owner_mailing_zip: effectiveMailingZip,

    property_address: addr,
    property_city: city,
    property_state: state,
    property_zip: zip,
    property_county: "", // filled in by caller

    property_type: propType,

    last_sale_date: lastSaleDate,
    last_sale_price: lastSalePrice,
    assessed_value: assessed,
    estimated_value: estimatedValue,
    estimated_equity: estimatedEquity,
    equity_percent: equityPercent,

    external_property_id: String(p.identifier.attomId),
    data_source: "attom",
    raw_data: {
      attomId: p.identifier.attomId,
      apn: p.identifier.apn,
      absenteeInd: p.summary?.absenteeInd,
      yearbuilt: p.summary?.yearbuilt,
      propLandUse: p.summary?.propLandUse,
      taxAmt: p.assessment?.tax?.taxamt,
      taxYear: p.assessment?.tax?.taxyear,
      isForeclosure: sale?.saleForeclosure === "Y",
    },
  };
}

// ── Utility helpers ────────────────────────────────────────────────────────

function calcYearsOwned(lastSaleDate: string): number {
  const saleMs = new Date(lastSaleDate).getTime();
  return Math.max(0, (Date.now() - saleMs) / (1000 * 60 * 60 * 24 * 365.25));
}

function estimateMortgageBalance(
  originalPrice: number,
  yearsOwned: number,
  rate = 0.065,
  termYears = 30
): number {
  if (yearsOwned >= termYears) return 0;
  const monthlyRate = rate / 12;
  const n = termYears * 12;
  const payment = (originalPrice * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  const monthsPaid = Math.min(yearsOwned * 12, n);
  const balance =
    originalPrice * Math.pow(1 + monthlyRate, monthsPaid) -
    payment * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate);
  return Math.max(0, balance);
}

function normalizePropertyType(raw?: string): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower === "sfr" || lower.includes("single") || lower.includes("residential"))
    return "single_family";
  if (lower === "condo" || lower.includes("condominium")) return "condo";
  if (lower === "mfr" || lower.includes("multi") || lower.includes("duplex"))
    return "multi_family";
  if (lower.includes("town")) return "townhouse";
  if (lower.includes("land") || lower.includes("lot") || lower.includes("vacant"))
    return "land";
  if (lower.includes("mobile") || lower.includes("manufactured")) return "mobile_home";
  if (lower.includes("commercial") || lower.includes("retail")) return "commercial";
  return undefined;
}
