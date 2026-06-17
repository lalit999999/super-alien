import { redis } from "@/lib/redis";
import type { CacheSetOptions, CacheResult } from "./cache.types";
import { metricsService } from "@/modules/monitoring";

export class CacheService {
  async get<T>(key: string): Promise<CacheResult<T>> {
    const data = await redis.get<T>(key);
    if (data !== null && data !== undefined) {
      metricsService.trackCacheHit(key);
      return { hit: true, data };
    }
    metricsService.trackCacheMiss(key);
    return { hit: false, data: null };
  }

  async set<T>(key: string, value: T, options: CacheSetOptions): Promise<void> {
    await redis.set(key, JSON.stringify(value), { ex: options.ttl });
  }

  async del(key: string): Promise<void> {
    await redis.del(key);
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheSetOptions
  ): Promise<{ data: T; hit: boolean }> {
    const cached = await redis.get<string>(key);

    if (cached !== null && cached !== undefined) {
      metricsService.trackCacheHit(key);
      const data = typeof cached === "string" ? (JSON.parse(cached) as T) : (cached as T);
      return { data, hit: true };
    }

    metricsService.trackCacheMiss(key);
    const data = await fetcher();
    await redis.set(key, JSON.stringify(data), { ex: options.ttl });
    return { data, hit: false };
  }
}

export const cacheService = new CacheService();
