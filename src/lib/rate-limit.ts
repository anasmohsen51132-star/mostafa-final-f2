// src/lib/rate-limit.ts
//
// ARCH-003 FIX: this used to be a plain in-memory Map, which reset on every
// cold start and — critically — was NOT shared across Vercel's concurrent
// serverless instances. An attacker whose requests happened to land on
// different warm instances could bypass the limit entirely, since each
// instance kept its own independent count. Since the owner runs Neon
// (Postgres) rather than Redis/Upstash, the counter now lives in a
// dedicated Postgres table (RateLimitBucket) instead — every instance reads
// and writes the same row, so the limit is enforced consistently no matter
// which serverless instance handles a given request.
//
// The core operation is a single atomic `INSERT ... ON CONFLICT DO UPDATE`.
// Postgres takes a row-level lock for the duration of this statement, so two
// concurrent requests hitting the same key are safely serialized by the
// database itself — there's no read-then-write race window like a naive
// "SELECT count, then UPDATE count+1" would have.
import prisma from "@/lib/prisma";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Returns { allowed, remaining, retryAfterMs }.
 * `key` should uniquely identify the caller, e.g. `login:<ip>:<phone>`.
 *
 * NOTE: now async (was sync when backed by an in-memory Map) — every call
 * site must `await` this.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitBucket" (key, count, "resetAt")
    VALUES (${key}, 1, NOW() + (${windowMs}::text || ' milliseconds')::interval)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "RateLimitBucket"."resetAt" < NOW() THEN 1
        ELSE "RateLimitBucket".count + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" < NOW() THEN NOW() + (${windowMs}::text || ' milliseconds')::interval
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING count, "resetAt"
  `;

  const row = rows[0];
  const allowed = row.count <= limit;

  // Opportunistic cleanup of long-expired rows — runs on a small random
  // fraction of calls so it doesn't add latency to every request, mirroring
  // the periodic-cleanup approach the old in-memory version used.
  if (Math.random() < 0.01) {
    prisma.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "resetAt" < NOW() - interval '1 hour'`.catch((e) =>
      console.error("[rate-limit cleanup]", e)
    );
  }

  return {
    allowed,
    remaining: Math.max(0, limit - row.count),
    retryAfterMs: allowed ? 0 : new Date(row.resetAt).getTime() - Date.now(),
  };
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
