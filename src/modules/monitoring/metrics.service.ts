import type { MetricEvent, MetricPayload } from "./metrics.types";

class MetricsService {
  private hits = 0;
  private misses = 0;
  private aiCallsSaved = 0;
  private rateLimitViolations = 0;

  private emit(event: MetricEvent, payload?: MetricPayload): void {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        event,
        ...payload,
      })
    );
  }

  trackCacheHit(key: string): void {
    this.hits++;
    this.emit("cache:hit", { key });
  }

  trackCacheMiss(key: string): void {
    this.misses++;
    this.emit("cache:miss", { key });
  }

  trackAiCallSaved(action: string): void {
    this.aiCallsSaved++;
    this.emit("ai:call:saved", { action });
  }

  trackRateLimitViolation(userId: string, action: string, limit: number): void {
    this.rateLimitViolations++;
    this.emit("rate_limit:violated", { userId, action, limit });
  }

  trackLatency(action: string, durationMs: number): void {
    this.emit("latency:recorded", { action, durationMs });
  }

  getSnapshot() {
    const total = this.hits + this.misses;
    return {
      cacheHits: this.hits,
      cacheMisses: this.misses,
      hitRate: total > 0 ? +(this.hits / total).toFixed(4) : 0,
      aiCallsSaved: this.aiCallsSaved,
      rateLimitViolations: this.rateLimitViolations,
    };
  }
}

export const metricsService = new MetricsService();
