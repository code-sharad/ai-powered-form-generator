interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
}

export function createRateLimiter({ limit, windowMs, now = () => Date.now() }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();
  let lastSweep = 0;

  function pruneKey(key: string, nowMs: number): number[] {
    const cutoff = nowMs - windowMs;
    const kept = (hits.get(key) ?? []).filter((t) => t > cutoff).sort((a, b) => a - b);
    if (kept.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, kept);
    }
    return kept;
  }

  // Keys that never come back would otherwise stay in the map forever.
  function sweep(nowMs: number): void {
    if (nowMs - lastSweep < windowMs) return;
    lastSweep = nowMs;
    for (const key of hits.keys()) pruneKey(key, nowMs);
  }

  return {
    check(key: string): RateLimitResult {
      const nowMs = now();
      sweep(nowMs);
      const timestamps = pruneKey(key, nowMs);
      if (timestamps.length >= limit) {
        const oldest = Math.min(...timestamps);
        const retryAfterMs = Math.max(0, oldest + windowMs - nowMs);
        return { allowed: false, retryAfterMs };
      }
      timestamps.push(nowMs);
      hits.set(key, timestamps);
      return { allowed: true, retryAfterMs: 0 };
    },
    reset(): void {
      hits.clear();
      lastSweep = 0;
    },
  };
}
