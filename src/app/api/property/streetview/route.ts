import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const heading = searchParams.get("heading") ?? "0";
  const fov     = searchParams.get("fov")     ?? "90";
  const pitch   = searchParams.get("pitch")   ?? "5";
  const size    = searchParams.get("size")    ?? "600x300";

  if (!address) return new NextResponse("address required", { status: 400 });
  if (!API_KEY) return new NextResponse("API key not configured", { status: 503 });

  const url = new URL("https://maps.googleapis.com/maps/api/streetview");
  url.searchParams.set("size",     size);
  url.searchParams.set("location", address);
  url.searchParams.set("heading",  heading);
  url.searchParams.set("fov",      fov);
  url.searchParams.set("pitch",    pitch);
  url.searchParams.set("source",   "outdoor");
  url.searchParams.set("key",      API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } }); // cache 24h

  if (!res.ok) return new NextResponse("Street View fetch failed", { status: 502 });

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":  "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
