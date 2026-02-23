import type { FredObservation, FredSeriesData } from "@/types";

const FRED_BASE = "https://api.stlouisfed.org/fred";

interface FredApiObservation {
  date: string;
  value: string;
}

interface FredObservationsResponse {
  observations: FredApiObservation[];
}

interface FredSeriesResponse {
  seriess: {
    id: string;
    title: string;
    last_updated: string;
  }[];
}

/**
 * Fetch a FRED data series by ID.
 * Reusable for any series — pass "MSPUS", "MORTGAGE30US", etc.
 */
export async function fetchFredSeries(
  seriesId: string
): Promise<FredSeriesData> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    throw new Error("FRED_API_KEY is not configured");
  }

  const [seriesRes, observationsRes] = await Promise.all([
    fetch(
      `${FRED_BASE}/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`
    ),
    fetch(
      `${FRED_BASE}/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=asc`
    ),
  ]);

  if (!seriesRes.ok || !observationsRes.ok) {
    throw new Error(
      `FRED API error: series=${seriesRes.status}, observations=${observationsRes.status}`
    );
  }

  const seriesData: FredSeriesResponse = await seriesRes.json();
  const observationsData: FredObservationsResponse =
    await observationsRes.json();

  const series = seriesData.seriess[0];
  if (!series) {
    throw new Error(`FRED series "${seriesId}" not found`);
  }

  const observations: FredObservation[] = observationsData.observations
    .filter((o) => o.value !== ".")
    .map((o) => ({
      date: o.date,
      value: parseFloat(o.value),
    }));

  return {
    seriesId: series.id,
    title: series.title,
    observations,
    lastUpdated: series.last_updated,
  };
}
