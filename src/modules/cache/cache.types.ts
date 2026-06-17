export interface CacheSetOptions {
  ttl: number; // seconds
}

export interface CacheResult<T> {
  hit: boolean;
  data: T | null;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
}
