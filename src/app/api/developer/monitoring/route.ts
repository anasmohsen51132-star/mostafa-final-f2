// src/app/api/developer/monitoring/route.ts
//
// Task 3 (Live Monitoring & Platform Health Dashboard). Single combined
// endpoint returning everything Sections 1–6 need in one response —
// deliberately not six separate endpoints, so the dashboard's auto-refresh
// (Section 8) is one request per interval, not six.
//
// Already protected by middleware.ts (/api/developer/* is DEVELOPER-only),
// but re-checked here directly too, matching this project's existing
// defense-in-depth convention (see /api/developer/logs/route.ts).
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/utils";
import { withApiMonitoring } from "@/lib/monitoring/recordMetric";
import { getApiMetrics } from "@/lib/monitoring/apiMetrics";
import { getDatabaseMetrics } from "@/lib/monitoring/dbMetrics";
import { getStorageMetrics } from "@/lib/monitoring/storageMetrics";
import { getAuthMetrics } from "@/lib/monitoring/authMetrics";
import { getPlatformMetrics } from "@/lib/monitoring/platformMetrics";
import { computeSystemHealth } from "@/lib/monitoring/health";
import type { MonitoringSnapshot } from "@/lib/monitoring/types";

async function handler(req: NextRequest): Promise<Response> {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  // Database is checked first and separately (not Promise.all'd with the
  // rest) because if the DB is genuinely down, every other query below
  // would also fail — this way the response still comes back with an
  // honest "database disconnected" status instead of a generic 500.
  const database = await getDatabaseMetrics();

  const [api, storage, auth, platform] = await Promise.all([
    getApiMetrics(),
    getStorageMetrics(),
    getAuthMetrics(),
    getPlatformMetrics(),
  ]);

  const health = computeSystemHealth(database, storage, api, platform);

  const snapshot: MonitoringSnapshot = {
    generatedAt: new Date().toISOString(),
    health,
    api,
    database,
    storage,
    auth,
    platform,
  };

  // PERF-006 pattern (same as /api/auth/me): this is live, per-request
  // operational data — must never be cached by an intermediate layer.
  return Response.json(
    { success: true, data: snapshot },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export const GET = withApiMonitoring("/api/developer/monitoring", handler);
