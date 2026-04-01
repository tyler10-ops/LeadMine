/**
 * Property Signal Scorer
 *
 * Scores a property record against seller, buyer, and investor opportunity
 * signals derived from county assessor data. Returns a 0–100 score,
 * gem grade, opportunity type, and human-readable signal flags.
 *
 * Designed to replace the business rating scorer for the real estate pivot.
 */

import type { GemGrade, OpportunityType, PropertySignalBreakdown } from "@/types";

export interface RawPropertyRecord {
  // Owner info
  owner_name?: string;
  owner_mailing_address?: string;
  owner_mailing_city?: string;
  owner_mailing_state?: string;
  owner_mailing_zip?: string;

  // Property info
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  property_county: string;
  property_type?: string;

  // Transaction history
  last_sale_date?: string;   // ISO date string
  last_sale_price?: number;
  assessed_value?: number;

  // Computed / enriched (may be missing from raw county data)
  estimated_value?: number;
  estimated_equity?: number;
  equity_percent?: number;
  years_owned?: number;     // calculated from last_sale_date if not provided

  // Source metadata
  external_property_id?: string;
  data_source?: string;
  raw_data?: Record<string, unknown>;
}

// ── Signal weights ─────────────────────────────────────────────────────────

const SELLER_SIGNALS: Array<{
  flag: string;
  reason: string;
  points: number;
  check: (r: RawPropertyRecord, derived: DerivedFields) => boolean;
}> = [
  {
    flag: "long_ownership_10yr",
    reason: "Owned 10+ years — statistically likely to consider selling",
    points: 15,
    check: (_, d) => (d.yearsOwned ?? 0) >= 10,
  },
  {
    flag: "long_ownership_20yr",
    reason: "Owned 20+ years — very high seller probability",
    points: 20,
    check: (_, d) => (d.yearsOwned ?? 0) >= 20,
  },
  {
    flag: "high_equity_40pct",
    reason: "Estimated equity above 40% — strong motivation to sell",
    points: 15,
    check: (r) => (r.equity_percent ?? 0) >= 40,
  },
  {
    flag: "high_equity_70pct",
    reason: "Estimated equity above 70% — exceptional seller position",
    points: 20,
    check: (r) => (r.equity_percent ?? 0) >= 70,
  },
  {
    flag: "absentee_owner",
    reason: "Absentee owner — mailing address differs from property",
    points: 25,
    check: (_, d) => d.isAbsenteeOwner,
  },
  {
    flag: "stale_transaction",
    reason: "No transaction in 5+ years — market conditions may prompt action",
    points: 10,
    check: (_, d) => (d.yearsOwned ?? 0) >= 5,
  },
];

const NEGATIVE_SIGNALS: Array<{
  flag: string;
  points: number;
  check: (r: RawPropertyRecord, derived: DerivedFields) => boolean;
}> = [
  {
    flag: "recently_sold",
    points: -35,
    check: (_, d) => (d.yearsOwned ?? 99) < 2,
  },
  {
    flag: "incomplete_record",
    points: -10,
    check: (r) => !r.last_sale_date || !r.property_address,
  },
];

// ── Derived field helpers ──────────────────────────────────────────────────

interface DerivedFields {
  yearsOwned: number | null;
  isAbsenteeOwner: boolean;
}

function deriveFields(record: RawPropertyRecord): DerivedFields {
  // Years owned — use provided or calculate from last_sale_date
  let yearsOwned: number | null = record.years_owned ?? null;
  if (yearsOwned === null && record.last_sale_date) {
    const saleMs = new Date(record.last_sale_date).getTime();
    const nowMs = Date.now();
    yearsOwned = Math.max(0, (nowMs - saleMs) / (1000 * 60 * 60 * 24 * 365.25));
  }

  // Absentee owner — mailing address differs from property
  const isAbsenteeOwner =
    !!record.owner_mailing_zip &&
    !!record.property_zip &&
    record.owner_mailing_zip.trim() !== record.property_zip.trim();

  return { yearsOwned, isAbsenteeOwner };
}

// ── Grade mapping ──────────────────────────────────────────────────────────

function scoreToGrade(score: number): GemGrade {
  if (score >= 65) return "elite";
  if (score >= 35) return "refined";
  if (score >   0) return "rock";
  return "ungraded";
}

// ── Main scorer ────────────────────────────────────────────────────────────

export function scorePropertyRecord(record: RawPropertyRecord): PropertySignalBreakdown {
  const derived = deriveFields(record);
  const flags: string[] = [];
  const reasons: string[] = [];
  let score = 0;

  // Positive seller signals
  for (const signal of SELLER_SIGNALS) {
    if (signal.check(record, derived)) {
      score += signal.points;
      flags.push(signal.flag);
      reasons.push(signal.reason);
    }
  }

  // Negative signals
  for (const signal of NEGATIVE_SIGNALS) {
    if (signal.check(record, derived)) {
      score += signal.points; // already negative
      flags.push(signal.flag);
    }
  }

  // Clamp to 0–100
  score = Math.min(100, Math.max(0, score));

  const grade = scoreToGrade(score);

  // Opportunity type — currently seller-focused from county data
  // Will expand to buyer/investor when additional data sources are added
  const opportunity_type: OpportunityType = "seller";

  return { score, grade, opportunity_type, flags, reasons };
}

// ── Batch scorer ───────────────────────────────────────────────────────────

export interface ScoredPropertyRecord {
  record: RawPropertyRecord;
  breakdown: PropertySignalBreakdown;
  yearsOwned: number | null;
  isAbsenteeOwner: boolean;
}

export function scoreBatch(records: RawPropertyRecord[]): ScoredPropertyRecord[] {
  return records.map((record) => {
    const derived = deriveFields(record);
    const breakdown = scorePropertyRecord(record);
    return {
      record,
      breakdown,
      yearsOwned: derived.yearsOwned,
      isAbsenteeOwner: derived.isAbsenteeOwner,
    };
  });
}
