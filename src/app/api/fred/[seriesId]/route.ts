import { NextRequest, NextResponse } from "next/server";
import { fetchFredSeries } from "@/lib/fred/service";

export const revalidate = 86400; // Re-fetch from FRED once per day

const ALLOWED_SERIES = new Set(["MSPUS", "MORTGAGE30US", "HOUST", "CSUSHPINSA"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const { seriesId } = await params;

  if (!ALLOWED_SERIES.has(seriesId)) {
    return NextResponse.json(
      { error: `Series "${seriesId}" is not allowed` },
      { status: 400 }
    );
  }

  try {
    const data = await fetchFredSeries(seriesId);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch FRED data";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
