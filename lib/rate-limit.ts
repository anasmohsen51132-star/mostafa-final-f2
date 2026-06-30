// src/lib/rate-limit.ts
// Lightweight in-memory rate limiter for serverless functions.
// NOTE: state resets per-instance (cold starts / multiple Vercel instances).
// This is sufficient as a first line of defense; for strict guarantees at scale,
// move to Upstash/Redis (see ARCH-002 recommendation).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map doesn't grow unbounded on long-lived instances.
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key);
  }
}

/**
 * Returns { allowed, remaining, retryAfterMs }.
 * `key` should uniquely identify the caller, e.g. `login:<ip>:<phone>`.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  cleanup();
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: 0 };
}

export function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// SEC-005 FIX: rateLimit() always computed retryAfterMs, but every call site
// discarded it and returned a plain error() with no Retry-After header at
// all — clients had no standard way to know how long to back off, so naive
// retry loops just hammered the endpoint again immediately.
export function rateLimitResponse(message: string, retryAfterMs: number) {
  return Response.json(
    { success: false, error: message },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
    }
  );
}
