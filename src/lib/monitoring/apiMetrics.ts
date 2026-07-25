// src/lib/monitoring/apiMetrics.ts
//
// Section 2 (Live Metrics). All numbers here are computed from real
// RequestMetric rows — nothing is mocked or hardcoded.
//
// IMPORTANT SCOPE NOTE: per Task 3's "do not modify existing LMS
// functionality" constraint, RequestMetric is currently only populated by
// routes that have opted into withApiMonitoring() (see recordMetric.ts) —
// today that's the /api/developer/monitoring endpoint itself. This means
// these numbers accurately describe instrumented traffic, not literally
// every request the whole platform receives, until more routes adopt the
// wrapper. `sampleSize` is returned specifically so the UI can be honest
// about this instead of presenting a stat computed from too little data.
import prisma from "@/lib/prisma";
import type { ApiMetrics } from "./types";

export async function getApiMetrics(): Promise<ApiMetrics> {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneHourAgo   = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo    = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [requestsLastMinute, requestsLastHour, last24h] = await Promise.all([
    prisma.requestMetric.count({ where: { createdAt: { gte: oneMinuteAgo } } }),
    prisma.requestMetric.count({ where: { createdAt: { gte: oneHourAgo } } }),
    prisma.requestMetric.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      select: { route: true, statusCode: true, durationMs: true },
    }),
  ]);

  const sampleSize = last24h.length;

  if (sampleSize === 0) {
    return {
      avgResponseMs: null,
      requestsLastMinute,
      requestsLastHour,
      successRatePct: null,
      failedRequests: 0,
      slowestEndpoints: [],
      sampleSize: 0,
    };
  }

  type Row = { route: string; statusCode: number; durationMs: number };
  const totalDuration = (last24h as Row[]).reduce((sum: number, r: Row) => sum + r.durationMs, 0);
  const failed = (last24h as Row[]).filter((r: Row) => r.statusCode >= 400);

  const byRoute = new Map<string, { totalMs: number; count: number }>();
  for (const r of last24h) {
    const cur = byRoute.get(r.route) ?? { totalMs: 0, count: 0 };
    cur.totalMs += r.durationMs;
    cur.count += 1;
    byRoute.set(r.route, cur);
  }
  const slowestEndpoints = [...byRoute.entries()]
    .map(([route, v]) => ({ route, avgMs: Math.round(v.totalMs / v.count), count: v.count }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 5);

  return {
    avgResponseMs: Math.round(totalDuration / sampleSize),
    requestsLastMinute,
    requestsLastHour,
    successRatePct: Math.round(((sampleSize - failed.length) / sampleSize) * 1000) / 10,
    failedRequests: failed.length,
    slowestEndpoints,
    sampleSize,
  };
}
