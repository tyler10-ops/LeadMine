import IORedis from "ioredis";

let connection: IORedis | null = null;

/**
 * Get the shared Redis/Upstash connection for BullMQ.
 * Reuses a singleton so we don't open multiple connections.
 */
export function getRedisConnection(): IORedis {
  if (connection) return connection;

  const url = process.env.UPSTASH_REDIS_URL;
  if (!url) throw new Error("UPSTASH_REDIS_URL is not set");

  connection = new IORedis(url, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    tls: url.startsWith("rediss://") ? {} : undefined,
  });

  return connection;
}

/** Close the Redis connection (for graceful shutdown). */
export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
