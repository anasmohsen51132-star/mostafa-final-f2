// src/lib/monitoring/platformMetrics.ts
//
// Section 6 (Platform Metrics). "Active"/"online" here means "successfully
// used an authenticated endpoint in the last 15 minutes" (via
// User.lastSeenAt — see /api/auth/me's doc comment), a standard, honest
// heuristic for a stateless-JWT app with no websocket/presence layer —
// not a literal live connection count.
import prisma from "@/lib/prisma";
import type { PlatformMetrics } from "./types";

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [
    activeUsersLast15Min,
    onlineAdminsLast15Min,
    onlineOwnersLast15Min,
    currentSessions,
    requestsToday,
    errorsToday,
    warningsToday,
    criticalEventsToday,
  ] = await Promise.all([
    prisma.user.count({ where: { lastSeenAt: { gte: fifteenMinAgo } } }),
    prisma.user.count({ where: { lastSeenAt: { gte: fifteenMinAgo }, role: "ADMIN" } }),
    prisma.user.count({ where: { lastSeenAt: { gte: fifteenMinAgo }, role: "OWNER" } }),
    prisma.user.count({ where: { currentSessionId: { not: null } } }),
    // Instrumented-routes-only, same caveat as ApiMetrics.
    prisma.requestMetric.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.systemLog.count({ where: { severity: "ERROR", createdAt: { gte: startOfDay } } }),
    prisma.systemLog.count({ where: { severity: "WARNING", createdAt: { gte: startOfDay } } }),
    prisma.systemLog.count({ where: { severity: "CRITICAL", createdAt: { gte: startOfDay } } }),
  ]);

  return {
    activeUsersLast15Min,
    onlineAdminsLast15Min,
    onlineOwnersLast15Min,
    currentSessions,
    requestsToday,
    errorsToday,
    warningsToday,
    criticalEventsToday,
  };
}
