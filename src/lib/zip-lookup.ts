// Zip → centroid lookup with in-memory cache.
// Uses Zippopotam.us (free, no key, ~150ms per lookup).
// In production, swap for a static JSON dataset or a self-hosted lookup.

type Centroid = { lat: number; lng: number; city?: string; state?: string };

const cache = new Map<string, Centroid | null>();

export async function lookupZip(zip: string): Promise<Centroid | null> {
  const key = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(key)) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${key}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) {
      cache.set(key, null);
      return null;
    }
    const centroid: Centroid = {
      lat: parseFloat(place.latitude),
      lng: parseFloat(place.longitude),
      city: place["place name"],
      state: place["state abbreviation"],
    };
    cache.set(key, centroid);
    return centroid;
  } catch {
    cache.set(key, null);
    return null;
  }
}

export async function lookupZipsBatch(zips: string[]): Promise<Map<string, Centroid>> {
  const unique = Array.from(new Set(zips.map(z => z.trim().slice(0, 5)).filter(z => /^\d{5}$/.test(z))));
  const results = await Promise.all(unique.map(async z => [z, await lookupZip(z)] as const));
  const out = new Map<string, Centroid>();
  for (const [zip, centroid] of results) {
    if (centroid) out.set(zip, centroid);
  }
  return out;
}