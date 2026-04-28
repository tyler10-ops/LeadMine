/**
 * County Assessor Data Adapter
 *
 * Handles fetching property records from public county assessor sources.
 * County data comes in three formats depending on jurisdiction:
 *   1. Open data portal (GeoJSON / CSV download) — fastest, preferred
 *   2. County website HTML scraping — slower, fallback
 *   3. State aggregator APIs — covers multiple counties at once
 *
 * MVP uses mock/CSV-parseable records with the real interface in place
 * so swapping to ATTOM or BatchLeads later requires only a new adapter.
 */

import type { RawPropertyRecord } from "./scorer";
import type { SearchArea } from "@/types";
import { fetchRentcastByZips } from "./rentcast-adapter";
// import { fetchAttomByCounty } from "./attom-adapter"; // Re-enable when upgrading to ATTOM paid plan

/**
 * Seed ZIP codes per county — used when ATTOM trial only supports postalcode queries.
 * Add more counties as needed. Even 2-3 ZIPs per county gives broad coverage.
 */
const COUNTY_ZIP_SEEDS: Record<string, string[]> = {
  // Nevada
  "Clark_NV":        ["89101","89102","89103","89104","89106","89107","89108","89109","89110","89115","89119","89121","89128","89129","89134","89138","89139","89141","89144","89146","89147","89148","89149","89156","89166","89169"],
  // Texas
  "Travis_TX":       ["78701","78702","78703","78704","78705","78721","78722","78723","78724","78725","78726","78727","78728","78729","78730","78731","78732","78733","78734","78735","78736","78737","78738","78739","78741","78742","78744","78745","78746","78747","78748","78749","78750","78751","78752","78753","78754","78756","78757","78758","78759"],
  "Harris_TX":       ["77001","77002","77003","77004","77005","77006","77007","77008","77009","77010","77018","77019","77020","77021","77022","77023","77024","77025","77026","77027","77030","77031","77036","77040","77041","77042","77043","77045","77046","77055","77056","77057","77058","77059","77062","77063","77064","77065","77066","77067","77068","77069","77070","77071","77072","77073","77074","77075","77077","77079","77080","77081","77082","77083","77084","77085","77086","77087","77088","77089","77090","77091","77092","77093","77094","77095","77096","77098","77099"],
  "Dallas_TX":       ["75201","75202","75203","75204","75205","75206","75207","75208","75209","75210","75211","75212","75214","75215","75216","75217","75218","75219","75220","75223","75224","75225","75226","75227","75228","75229","75230","75231","75232","75233","75234","75235","75236","75237","75238","75240","75241","75243","75244","75246","75247","75248","75249","75251","75252","75253","75254"],
  // Florida
  "Miami-Dade_FL":   ["33101","33109","33122","33125","33126","33127","33128","33129","33130","33131","33132","33133","33134","33135","33136","33137","33138","33139","33140","33141","33142","33143","33144","33145","33146","33147","33149","33150","33154","33155","33156","33157","33158","33160","33161","33162","33165","33166","33167","33168","33169","33170","33172","33173","33174","33175","33176","33177","33178","33179","33180","33181","33182","33183","33184","33185","33186","33187","33189","33190","33193","33194","33196"],
  // Washington
  "King_WA":         ["98001","98002","98003","98004","98005","98006","98007","98008","98010","98011","98014","98019","98022","98023","98024","98027","98028","98029","98030","98031","98032","98033","98034","98038","98039","98040","98042","98045","98047","98050","98051","98052","98053","98055","98056","98057","98058","98059","98063","98065","98068","98070","98072","98074","98075","98077","98092","98101","98102","98103","98104","98105","98106","98107","98108","98109","98112","98115","98116","98117","98118","98119","98121","98122","98125","98126","98133","98136","98144","98146","98148","98154","98155","98158","98161","98164","98166","98168","98177","98178","98188","98195","98198","98199"],
  // Arizona
  "Maricopa_AZ":     ["85001","85003","85004","85006","85007","85008","85009","85012","85013","85014","85015","85016","85017","85018","85019","85020","85021","85022","85023","85024","85027","85028","85029","85031","85032","85033","85034","85035","85037","85040","85041","85042","85043","85044","85045","85048","85050","85051","85053","85054","85083","85085","85086","85087","85201","85202","85203","85204","85205","85206","85207","85208","85209","85210","85212","85213","85215","85224","85225","85226","85233","85234","85248","85249","85250","85251","85253","85254","85255","85257","85258","85259","85260","85262","85266","85281","85282","85283","85284","85296","85297","85298","85301","85302","85303","85304","85305","85306","85307","85308","85309","85310","85331","85335","85338","85339","85345","85353","85354","85355","85374","85375","85377","85378","85379","85381","85382","85383","85387","85388","85392","85395"],
  // Georgia
  "Fulton_GA":       ["30004","30005","30009","30022","30024","30076","30092","30097","30201","30213","30214","30215","30228","30238","30268","30269","30273","30274","30281","30291","30296","30297","30301","30303","30305","30306","30307","30308","30309","30310","30311","30312","30313","30314","30315","30316","30317","30318","30319","30324","30326","30327","30328","30331","30336","30337","30338","30339","30340","30341","30342","30344","30349","30350","30360","30363","30539"],
  // Colorado
  "Denver_CO":       ["80202","80203","80204","80205","80206","80207","80209","80210","80211","80212","80214","80215","80216","80218","80219","80220","80221","80222","80223","80224","80226","80227","80228","80229","80230","80231","80232","80233","80234","80235","80236","80237","80238","80239","80246","80247","80249","80264"],
  // North Carolina
  "Mecklenburg_NC":  ["28105","28106","28201","28202","28203","28204","28205","28206","28207","28208","28209","28210","28211","28212","28213","28214","28215","28216","28217","28218","28219","28220","28221","28222","28223","28224","28226","28227","28228","28229","28230","28231","28232","28233","28234","28235","28236","28237","28241","28242","28243","28244","28246","28247","28250","28253","28254","28255","28256","28258","28260","28262","28263","28265","28266","28269","28270","28271","28272","28273","28274","28275","28277","28278","28280","28281","28282","28284","28285","28287","28288","28289","28290","28296","28297","28299"],
};


export interface CountyFetchResult {
  records: RawPropertyRecord[];
  source: string;
  county: string;
  state: string;
  fetchedAt: string;
  recordCount: number;
  errors: string[];
}

export interface CountyDataSource {
  county: string;
  state: string;
  /** URL to open data portal CSV or GeoJSON endpoint */
  openDataUrl?: string;
  /** URL to county assessor search page (for scraping fallback) */
  assessorUrl?: string;
  /** Whether bulk download is available */
  hasBulkDownload: boolean;
  /** Per-county field name mapping. Falls back to Austin/Travis format if omitted. */
  fieldMap?: Record<string, string>;
  notes?: string;
}

// ── Known county open data sources ────────────────────────────────────────
// Expand this registry as more counties are onboarded.

// Default field map — matches Austin/Travis County Socrata format.
// Override per county when the open data portal uses different field names.
const DEFAULT_FIELD_MAP: Record<string, string> = {
  property_address:      "address",
  property_city:         "city",
  property_zip:          "zip_code",
  owner_name:            "owner_name",
  owner_mailing_address: "mailing_address",
  owner_mailing_city:    "mailing_city",
  owner_mailing_state:   "mailing_state",
  owner_mailing_zip:     "mailing_zip",
  assessed_value:        "assessed_value",
  last_sale_date:        "deed_date",
  last_sale_price:       "sale_price",
  property_type:         "land_use",
  parcel_id:             "parcel_id",
};

// ── Status key ──────────────────────────────────────────────────────────────
// verified  — endpoint tested and returning live data
// stale     — endpoint previously worked; dataset ID may have changed, needs re-test
// no-api    — county has no public bulk REST endpoint; use ATTOM/BatchLeads
// placeholder — not yet configured; skipped automatically by fetchCountyRecords

export const COUNTY_SOURCES: CountyDataSource[] = [
  // ── Illinois ──────────────────────────────────────────────────────────────
  {
    county: "Cook",
    state: "IL",
    // VERIFIED 2026-03: Assessor - Parcel Addresses (current 2026 data)
    // Returns: address, owner name, mailing address (absentee detection).
    // Does NOT include sale date/price — equity signals will be absent; absentee
    // owner signal fires strongly and is the highest-value flag anyway.
    openDataUrl: "https://datacatalog.cookcountyil.gov/resource/3723-97qp.json",
    hasBulkDownload: true,
    fieldMap: {
      property_address:      "prop_address_full",
      property_city:         "prop_address_city_name",
      property_zip:          "prop_address_zipcode_1",
      owner_name:            "mail_address_name",
      owner_mailing_address: "mail_address_full",
      owner_mailing_city:    "mail_address_city_name",
      owner_mailing_state:   "mail_address_state",
      owner_mailing_zip:     "mail_address_zipcode_1",
      parcel_id:             "pin",
    },
    notes: "Cook County Assessor — Chicago metro. VERIFIED working.",
  },

  // ── Texas ────────────────────────────────────────────────────────────────
  // Travis and Harris CADs publish bulk CSV downloads but no public Socrata API.
  // To enable Austin/Houston mining add an ATTOM or BatchLeads API key — see
  // src/lib/property/attom-adapter.ts (to be created) for that integration.
  {
    county: "Travis",
    state: "TX",
    hasBulkDownload: false,
    assessorUrl: "https://www.traviscad.org",
    notes: "Austin/Travis CAD — no public Socrata REST API. Use ATTOM or BatchLeads.",
  },
  {
    county: "Harris",
    state: "TX",
    hasBulkDownload: false,
    assessorUrl: "https://hcad.org",
    notes: "Houston/Harris CAD — no reliable public Socrata endpoint. Use ATTOM or BatchLeads.",
  },
  {
    county: "Dallas",
    state: "TX",
    hasBulkDownload: false,
    assessorUrl: "https://www.dallascad.org",
    notes: "Dallas CAD — no public bulk endpoint. Use ATTOM or BatchLeads.",
  },

  // ── Florida ───────────────────────────────────────────────────────────────
  {
    county: "Miami-Dade",
    state: "FL",
    hasBulkDownload: false,
    assessorUrl: "https://www.miamidade.gov/pa",
    notes: "Miami-Dade PA — moved from Socrata to ArcGIS; REST endpoint needs update. Use ATTOM.",
  },
  {
    county: "Broward",
    state: "FL",
    hasBulkDownload: false,
    assessorUrl: "https://www.bcpa.net",
    notes: "Broward PA — Socrata endpoint unresponsive. Use ATTOM or BatchLeads.",
  },

  // ── Washington ────────────────────────────────────────────────────────────
  {
    county: "King",
    state: "WA",
    hasBulkDownload: false,
    assessorUrl: "https://info.kingcounty.gov/assessor",
    notes: "King County — dataset ID changed; Socrata endpoint dead. Use ATTOM.",
  },

  // ── Colorado ──────────────────────────────────────────────────────────────
  {
    county: "Denver",
    state: "CO",
    hasBulkDownload: false,
    assessorUrl: "https://www.denvergov.org/assessor",
    notes: "Denver — Socrata endpoint needs re-verification. Use ATTOM.",
  },
];

// ── Field normalizer ───────────────────────────────────────────────────────
// Maps raw county field names to our unified RawPropertyRecord interface.
// Each county uses different field names — this normalizer handles that.

type RawCountyRow = Record<string, string | number | null | undefined>;

export function normalizeCountyRow(
  row: RawCountyRow,
  county: string,
  state: string,
  fieldMap: Record<string, string>
): RawPropertyRecord | null {
  const get = (key: string): string | undefined => {
    const mapped = fieldMap[key];
    if (!mapped) return undefined;
    const val = row[mapped];
    return val != null ? String(val).trim() : undefined;
  };

  const propertyAddress = get("property_address");
  const propertyCity    = get("property_city") ?? "";
  const propertyZip     = get("property_zip") ?? "";

  if (!propertyAddress) return null; // skip records with no address

  const lastSaleDateRaw = get("last_sale_date");
  const lastSaleDate = lastSaleDateRaw ? normalizeDate(lastSaleDateRaw) : undefined;

  const assessedValue  = parseNumber(get("assessed_value"));
  const lastSalePrice  = parseNumber(get("last_sale_price"));

  // Estimate equity if we have assessed value and sale price + date
  let estimatedEquity: number | undefined;
  let equityPercent: number | undefined;
  if (assessedValue && lastSalePrice && lastSaleDate) {
    const yearsOwned = calcYearsOwned(lastSaleDate);
    // Rough mortgage balance estimate: 30-year amortization at 6.5%
    const estimatedBalance = estimateMortgageBalance(lastSalePrice, yearsOwned);
    estimatedEquity = Math.max(0, assessedValue - estimatedBalance);
    equityPercent = assessedValue > 0 ? (estimatedEquity / assessedValue) * 100 : 0;
  }

  const ownerMailingZip = get("owner_mailing_zip");

  return {
    owner_name:            get("owner_name"),
    owner_mailing_address: get("owner_mailing_address"),
    owner_mailing_city:    get("owner_mailing_city"),
    owner_mailing_state:   get("owner_mailing_state"),
    owner_mailing_zip:     ownerMailingZip,
    property_address:      propertyAddress,
    property_city:         propertyCity,
    property_state:        state,
    property_zip:          propertyZip,
    property_county:       county,
    property_type:         normalizePropertyType(get("property_type")),
    last_sale_date:        lastSaleDate,
    last_sale_price:       lastSalePrice,
    assessed_value:        assessedValue,
    estimated_value:       assessedValue, // use assessed as proxy until AVM added
    estimated_equity:      estimatedEquity,
    equity_percent:        equityPercent,
    external_property_id:  get("parcel_id"),
    data_source:           "county_assessor",
    raw_data:              row as Record<string, unknown>,
  };
}

// ── Fetch records for a search area ──────────────────────────────────────

export async function fetchCountyRecords(
  searchArea: SearchArea,
  options: { limit?: number; zipFilter?: string[] } = {}
): Promise<CountyFetchResult> {
  const errors: string[] = [];
  const records: RawPropertyRecord[] = [];
  const limit = options.limit ?? 500;

  // ZIP-first path: if the caller passed zip codes directly, use them via Rentcast
  const directZips = (options.zipFilter ?? []).length > 0
    ? options.zipFilter!
    : (searchArea.zip_codes ?? []);

  if (directZips.length > 0) {
    const apiKey = process.env.RENTCAST_API_KEY;
    if (!apiKey) {
      return {
        records: [],
        source: "rentcast",
        county: "zip-based",
        state: "",
        fetchedAt: new Date().toISOString(),
        recordCount: 0,
        errors: ["RENTCAST_API_KEY is not set in environment — add it to .env.local on the Mac Mini worker and restart PM2"],
      };
    }
    try {
      const result = await fetchRentcastByZips(directZips, { maxRecords: limit });
      return {
        records: result.records,
        source: "rentcast",
        county: "zip-based",
        state: searchArea.state ?? "",
        fetchedAt: new Date().toISOString(),
        recordCount: result.records.length,
        errors: result.errors,
      };
    } catch (err) {
      return {
        records: [],
        source: "rentcast",
        county: "zip-based",
        state: "",
        fetchedAt: new Date().toISOString(),
        recordCount: 0,
        errors: [`Rentcast fetch failed: ${err instanceof Error ? err.message : String(err)}`],
      };
    }
  }

  // County fallback path (legacy — used when no ZIP codes are provided)
  const targetCounties = searchArea.counties.length > 0
    ? searchArea.counties
    : ["Unknown"];

  const useRentcast = !!process.env.RENTCAST_API_KEY;

  for (const county of targetCounties) {
    // ── Rentcast path (primary data source) ───────────────────────────────
    if (useRentcast) {
      const countyKey  = `${county}_${searchArea.state ?? ""}`;
      const countyZips = COUNTY_ZIP_SEEDS[countyKey] ?? [];

      if (countyZips.length === 0) {
        errors.push(
          `${county}, ${searchArea.state}: no ZIP codes registered for this county. ` +
          `Add ZIP codes to COUNTY_ZIP_SEEDS in county-adapter.ts to enable mining here.`
        );
        continue;
      }

      try {
        const result = await fetchRentcastByZips(countyZips, { maxRecords: limit });
        const stamped = result.records.map((r) => ({ ...r, property_county: county }));
        records.push(...stamped);
        if (result.errors.length) errors.push(...result.errors);
      } catch (err) {
        errors.push(`Rentcast failed for ${county}, ${searchArea.state}: ${err instanceof Error ? err.message : String(err)}`);
      }
      continue;
    }

    // ── Open data portal fallback ──────────────────────────────────────────
    const source = COUNTY_SOURCES.find(
      (s) =>
        s.county.toLowerCase() === county.toLowerCase() &&
        s.state.toLowerCase() === (searchArea.state ?? "").toLowerCase()
    );

    if (!source) {
      errors.push(`${county}, ${searchArea.state} not in county registry. Set ATTOM_API_KEY for full national coverage.`);
      continue;
    }
    if (!source.openDataUrl || source.openDataUrl.includes("placeholder")) {
      errors.push(`${county}, ${searchArea.state}: no open data URL. Set ATTOM_API_KEY to unlock this market.`);
      continue;
    }

    try {
      const fetched = await fetchFromOpenDataPortal(source, searchArea.zip_codes ?? [], limit);
      records.push(...fetched);
    } catch (err) {
      errors.push(`Failed to fetch ${county}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    records,
    source: "county_assessor",
    county: targetCounties.join(", "),
    state: searchArea.state ?? "",
    fetchedAt: new Date().toISOString(),
    recordCount: records.length,
    errors,
  };
}

// ── Open data portal fetcher ───────────────────────────────────────────────

async function fetchFromOpenDataPortal(
  source: CountyDataSource,
  zipFilter: string[],
  limit: number
): Promise<RawPropertyRecord[]> {
  if (!source.openDataUrl) return [];

  // Build URL with zip filter if supported (Socrata API format)
  let url = source.openDataUrl;
  const params = new URLSearchParams({ $limit: String(limit) });
  if (zipFilter.length > 0) {
    // Socrata WHERE clause for zip filtering
    params.append("$where", `zip_code IN (${zipFilter.map((z) => `'${z}'`).join(",")})`);
  }
  if (!url.includes("?")) url += "?" + params.toString();

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);

  const rows: RawCountyRow[] = await res.json();

  // Use county-specific field map if provided, otherwise fall back to Austin/Travis format
  const fieldMap = source.fieldMap ?? DEFAULT_FIELD_MAP;

  return rows
    .map((row) => normalizeCountyRow(row, source.county, source.state, fieldMap))
    .filter((r): r is RawPropertyRecord => r !== null);
}

// ── Utility helpers ────────────────────────────────────────────────────────

function parseNumber(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? undefined : n;
}

function normalizeDate(raw: string): string | undefined {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return undefined;
    return d.toISOString().split("T")[0];
  } catch {
    return undefined;
  }
}

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
  const p = originalPrice;
  const payment = (p * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  const monthsPaid = Math.min(yearsOwned * 12, n);
  const balance =
    p * Math.pow(1 + monthlyRate, monthsPaid) -
    payment * ((Math.pow(1 + monthlyRate, monthsPaid) - 1) / monthlyRate);
  return Math.max(0, balance);
}

function normalizePropertyType(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  if (lower.includes("single") || lower.includes("sfr") || lower.includes("residential"))
    return "single_family";
  if (lower.includes("condo") || lower.includes("condominium")) return "condo";
  if (lower.includes("multi") || lower.includes("duplex") || lower.includes("triplex"))
    return "multi_family";
  if (lower.includes("town")) return "townhouse";
  if (lower.includes("land") || lower.includes("lot") || lower.includes("vacant"))
    return "land";
  if (lower.includes("mobile") || lower.includes("manufactured")) return "mobile_home";
  if (lower.includes("commercial") || lower.includes("retail") || lower.includes("office"))
    return "commercial";
  return undefined;
}
