/**
 * Market Intelligence — Internal ingestion types.
 *
 * These types define the contract between data source adapters
 * and the signal processing pipeline.
 */

/** Raw data item from any source adapter before normalization */
export interface RawSignalInput {
  source_name: string;
  source_type: "api" | "batch" | "manual" | "derived";
  source_url?: string;
  external_id?: string;
  headline: string;
  summary?: string;
  body?: string;
  raw_data?: Record<string, unknown>;
  category: "rates" | "inventory" | "demand" | "policy" | "local_market" | "macro";
  geography?: "national" | "state" | "local";
  region?: string;
  tags?: string[];
  published_at?: string;
}

/** Normalized signal after processing, ready for DB insert */
export interface ProcessedSignal extends RawSignalInput {
  signal_direction: "bullish" | "bearish" | "neutral";
  confidence_score: number;
  impact_score: number;
  impact_factors: {
    breadth: number;
    magnitude: number;
    historical_relevance: number;
    confidence: number;
  };
  is_high_impact: boolean;
}

/** Abstract data source adapter interface */
export interface DataSourceAdapter {
  /** Unique name identifying this data source */
  readonly name: string;
  /** Source type classification */
  readonly type: "api" | "batch" | "manual" | "derived";
  /** Fetch latest signals from this source */
  fetch(): Promise<RawSignalInput[]>;
  /** Whether this source is currently available */
  isAvailable(): Promise<boolean>;
}
