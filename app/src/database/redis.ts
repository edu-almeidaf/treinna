import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Conectado com sucesso!");
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Erro de conexão:", err.message);
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();
  await client.ping();
  return client;
}

export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const data = await client.get(key);
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return data as unknown as T;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
  const client = getRedisClient();
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  await client.set(key, serialized, "EX", ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Conexão encerrada.");
  }
}

export async function zsetIncr(key: string, member: string, increment = 1): Promise<string> {
  const client = getRedisClient();
  return client.zincrby(key, increment, member);
}

export async function zsetRevRangeWithScores(key: string, start = 0, stop = 9): Promise<Array<{ member: string; score: number }>> {
  const client = getRedisClient();
  const raw = await client.zrevrange(key, start, stop, "WITHSCORES");
  const result: Array<{ member: string; score: number }> = [];
  
  for (let i = 0; i < raw.length; i += 2) {
    result.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
  }
  
  return result;
}