export type MetricEvent =
  | "cache:hit"
  | "cache:miss"
  | "ai:call:saved"
  | "rate_limit:violated"
  | "latency:recorded";

export interface MetricPayload {
  key?: string;
  userId?: string;
  action?: string;
  durationMs?: number;
  limit?: number;
}
