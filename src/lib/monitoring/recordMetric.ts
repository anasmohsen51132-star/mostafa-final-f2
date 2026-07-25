// src/lib/monitoring/recordMetric.ts
//
// Reusable service for Section 2 (Live Metrics): records real, per-request
// API timing/status data into RequestMetric (see schema.prisma for why
// this is a separate table from SystemLog).
//
// Mirrors src/lib/logger.ts's design goals exactly:
//   - Can NEVER throw or reject in a way that breaks the request it's
//     observing.
//   - Exposed as an opt-in wrapper (withApiMonitoring), not something
//     applied to existing routes automatically — per Task 3's "do not
//     modify existing LMS functionality" constraint, no existing route has
//     been changed to use this. It's applied only to the new
//     /api/developer/monitoring route itself for now, the same "first
//     adopter" pattern Task 2 used for withApiLogging on the login route.
//
// PERFORMANCE NOTE: unlike logger.ts's audit-trail writes (which are
// awaited so they survive Vercel's serverless function potentially
// freezing right after the response is sent), a metric write is pure
// telemetry with no audit requirement — losing an occasional row is
// harmless. It's still awaited here rather than fired-and-forgotten,
// because an un-awaited promise on a serverless platform has a real
// chance of being killed before it completes anyway (same risk, no
// benefit), and awaiting keeps the write's own errors safely inside this
// function's try/catch rather than becoming an unhandled rejection
// elsewhere. The write itself is a single, indexed insert — typically
// low-single-digit milliseconds — which is the deliberate trade-off this
// file makes in exchange for accurate data (see the README-style note in
// getApiMetrics.ts about what "instrumented routes only" means).
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function recordRequestMetric(input: {
  route: string;
  method: string;
  statusCode: number;
  durationMs: number;
}): Promise<void> {
  try {
    await prisma.requestMetric.create({ data: input });
  } catch (e) {
    // Same last-resort floor as logger.ts's writeLog — this IS the
    // monitoring system, it has nowhere else to report to.
    console.error("[monitoring] failed to write RequestMetric", e);
  }
}

// PRUNING NOTE: this table has no automatic cleanup — Task 3 explicitly
// excludes cron jobs/background jobs, so periodic pruning (e.g. keep only
// the last 30 days) is intentionally left as a manual or future task
// rather than something this file schedules itself.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...rest: any[]) => Promise<Response>;

// Wraps an App Router handler to time it and record the result. Usage:
//
//   export const GET = withApiMonitoring("/api/developer/monitoring", async (req) => {
//     ...
//   });
//
// `routeLabel` is passed explicitly (rather than derived from req.url)
// so dynamic routes (e.g. "/api/developer/logs/[id]") record a stable,
// low-cardinality label instead of one row per distinct id — the same
// reason withApiLogging takes a routeLabel string.
export function withApiMonitoring(routeLabel: string, handler: RouteHandler): RouteHandler {
  return async (req, ...rest) => {
    const start = Date.now();
    let statusCode = 500;
    try {
      const res = await handler(req, ...rest);
      statusCode = res.status;
      return res;
    } finally {
      await recordRequestMetric({
        route: routeLabel,
        method: req.method,
        statusCode,
        durationMs: Date.now() - start,
      });
    }
  };
}
