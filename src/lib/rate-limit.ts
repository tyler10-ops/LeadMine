/**
 * Lightweight in-memory rate limiter for public API routes.
 *
 * Per serverless instance (module-level Map), so it mitigates bursts from a
 * single client rather than providing a global guarantee — good enough to blunt
 * spam / cost-abuse on public endpoints without external infra (Redis/KV).
 */
const hits = new Map<string, number[]>();

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Returns true if the key has exceeded `limit` requests within `windowMs`. */
export function rateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Opportunistic cleanup so the Map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return false;
}
