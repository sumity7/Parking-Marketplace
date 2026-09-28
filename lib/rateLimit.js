// Lightweight in-memory rate limiter — no external service, no new infrastructure.
// Caveat (documented, not hidden): this is per-process memory, so it resets on
// restart and doesn't share state across multiple server instances. That's an
// acceptable trade-off for this app's likely single-instance deployment; if it's
// ever run behind a multi-instance/serverless setup, swap this for a shared store
// (e.g. Redis) without changing the call sites below.
const buckets = global._rateLimitBuckets || (global._rateLimitBuckets = new Map());

// Periodic sweep so the Map doesn't grow unbounded with stale IPs. Guarded against
// Next.js dev-mode hot-reload creating multiple overlapping intervals.
if (!global._rateLimitSweepStarted) {
  global._rateLimitSweepStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 5 * 60 * 1000).unref?.();
}

// Returns { allowed, remaining, retryAfterSeconds }. `key` should already include
// a namespace prefix (e.g. "register:1.2.3.4") so different endpoints don't share buckets.
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

// Best-effort client IP extraction behind a proxy/load balancer.
export function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
