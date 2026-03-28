const Redis = require("ioredis");

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 5) {
      console.error("[Redis] Max reconnect attempts reached");
      return null; // stop retrying
    }
    const delay = Math.min(times * 200, 2000);
    console.warn(`[Redis] Reconnecting in ${delay}ms... (attempt ${times})`);
    return delay;
  },
  lazyConnect: false,
});

redis.on("connect", () => console.log("[Redis] Connected to Redis"));
redis.on("error", (err) => console.error("[Redis] Error:", err.message));
redis.on("close", () => console.warn("[Redis] Connection closed"));

/**
 * Cache helpers
 */
const cacheGet = async (key) => {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

const cacheDel = async (key) => redis.del(key);

module.exports = { redis, cacheGet, cacheSet, cacheDel };
